#!/usr/bin/env node
// @ts-check
import { Octokit } from '@octokit/rest'
import gunzip from 'gunzip-maybe'
import fetch from 'node-fetch'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import tar from 'tar-fs'

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url))
const SERVER_DIR = path.resolve(DIR_NAME, '../tmp/server')
const SCRIPT_EXTENSION = process.platform === 'win32' ? '.bat' : '.sh'
const KC_BASE = 'http://localhost:8080'
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'admin'

// TODO: Once support for Node.js 14 has been dropped this can be replaced with an import from 'node:stream/promises'.
// More information: https://nodejs.org/api/stream.html#streams-promises-api
const pipelineAsync = promisify(pipeline)

await startServer()

async function startServer () {
  await downloadServer()

  // Wipe data so each start gets a clean realm state (binary is preserved)
  const dataDir = path.join(SERVER_DIR, 'data')
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true })
    console.info('Cleared server data directory for clean start.')
  }

  console.info('Starting server …')

  const child = spawn(
    path.join(SERVER_DIR, `bin/kc${SCRIPT_EXTENSION}`),
    ['start-dev'],
    {
      env: {
        KC_BOOTSTRAP_ADMIN_USERNAME: ADMIN_USER,
        KC_BOOTSTRAP_ADMIN_PASSWORD: ADMIN_PASS,
        ...process.env
      }
    }
  )

  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)

  await waitForReady()
  await provisionKeycloakReporter()
}

async function waitForReady () {
  const url = `${KC_BASE}/realms/master/.well-known/openid-configuration`
  console.info('Waiting for Keycloak to be ready…')
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        console.info('Keycloak is ready.')
        return
      }
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 5000))
  }
  throw new Error('Keycloak failed to start within timeout.')
}

async function provisionKeycloakReporter () {
  const tokenRes = await fetch(
    `${KC_BASE}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: ADMIN_USER,
        password: ADMIN_PASS,
      }),
    }
  )
  const { access_token } = /** @type {{ access_token: string }} */ (await tokenRes.json())
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${access_token}`,
  }

  // Create the keycloak-reporter client (409 = already exists, safe to ignore)
  const clientRes = await fetch(`${KC_BASE}/admin/realms/master/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      clientId: 'keycloak-reporter',
      secret: '3UYhI2hryFwoVtcd7ljlaDuD9HXrGV5r',
      serviceAccountsEnabled: true,
      directAccessGrantsEnabled: true,
      publicClient: false,
      enabled: true,
      fullScopeAllowed: true,
    }),
  })
  if (!clientRes.ok && clientRes.status !== 409) {
    throw new Error(`Failed to create client: ${clientRes.status}`)
  }

  // Resolve the service account user Keycloak auto-creates
  const saRes = await fetch(
    `${KC_BASE}/admin/realms/master/users?username=service-account-keycloak-reporter`,
    { headers }
  )
  const [serviceAccount] = /** @type {{ id: string }[]} */ (await saRes.json())

  // Fetch the admin realm role and assign it to the service account
  const roleRes = await fetch(`${KC_BASE}/admin/realms/master/roles/admin`, { headers })
  const adminRole = /** @type {{ id: string, name: string }} */ (await roleRes.json())

  await fetch(
    `${KC_BASE}/admin/realms/master/users/${serviceAccount.id}/role-mappings/realm`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify([{ id: adminRole.id, name: adminRole.name }]),
    }
  )

  // Create a test user so e2e user-listing tests have predictable data
  await fetch(`${KC_BASE}/admin/realms/master/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      username: 'kermit',
      firstName: 'Kermit',
      lastName: 'the Frog',
      email: 'kermit@example.com',
      enabled: true,
      credentials: [{ type: 'password', value: 'kermit', temporary: false }],
    }),
  })

  console.info('keycloak-reporter client provisioned successfully.')
}

async function downloadServer () {
  const directoryExists = fs.existsSync(path.join(SERVER_DIR, `bin/kc${SCRIPT_EXTENSION}`))

  if (directoryExists) {
    console.info('Server installation found, skipping download.')
    return
  }

  console.info('Downloading and extracting server…')

  const nightlyAsset = await getNightlyAsset()
  //console.log(nightlyAsset)
  if (!nightlyAsset) {
    throw new Error('Could not find nightly release asset.')
  }
  const assetStream = await getAssetAsStream(nightlyAsset)
  if (!assetStream) {
    throw new Error('Asset stream is empty.')
  }

  await extractTarball(assetStream, SERVER_DIR, { strip: 1 })
}

async function getNightlyAsset () {
  const api = new Octokit()
  const tag = process.env.kcVersion || 'nightly';
  const release = await api.repos.getReleaseByTag({
    owner: 'keycloak',
    repo: 'keycloak',
    tag: tag
  })
  let assertName = `keycloak-${tag}.tar.gz`
  if (tag == 'nightly') {
    assertName = 'keycloak-999.0.0-SNAPSHOT.tar.gz'
  }

  return release.data.assets.find(
    ({ name }) => name === assertName
  )
}

/** @param {{ browser_download_url: string }} asset */
async function getAssetAsStream (asset) {
  const response = await fetch(asset.browser_download_url)

  if (!response.ok) {
    throw new Error('Something went wrong requesting the nightly release.')
  }

  return /** @type {import('node:stream').Readable} */ (response.body)
}

/**
 * @param {import('node:stream').Readable} stream
 * @param {string} destPath
 * @param {object} options
 */
function extractTarball (stream, destPath, options) {
  return pipelineAsync(stream, gunzip(), tar.extract(destPath, options))
}
