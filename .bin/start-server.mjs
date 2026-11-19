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
const READY_MARKER = path.resolve(DIR_NAME, '../tmp/keycloak-ready')
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

  // Remove stale ready marker from a previous run
  if (fs.existsSync(READY_MARKER)) fs.rmSync(READY_MARKER)

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
      protocol: 'openid-connect',
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

  // Keycloak 26 requires the kc-admin-api scope for admin REST API access: it sets
  // the token audience to the admin URL. Without it the admin API rejects the token
  // with 401 "Expected audience not available in the token".
  const clientsRes = await fetch(
    `${KC_BASE}/admin/realms/master/clients?clientId=keycloak-reporter`,
    { headers }
  )
  const [reporterClient] = /** @type {{ id: string }[]} */ (await clientsRes.json())
  if (!reporterClient) throw new Error('keycloak-reporter client not found after creation')

  const scopesRes = await fetch(`${KC_BASE}/admin/realms/master/client-scopes`, { headers })
  const scopes = /** @type {{ id: string, name: string }[]} */ (await scopesRes.json())
  const adminApiScope = scopes.find((s) => s.name === 'kc-admin-api')
  if (!adminApiScope) throw new Error('kc-admin-api client scope not found in master realm')

  const scopeAssignRes = await fetch(
    `${KC_BASE}/admin/realms/master/clients/${reporterClient.id}/default-client-scopes/${adminApiScope.id}`,
    { method: 'PUT', headers }
  )
  if (!scopeAssignRes.ok) {
    throw new Error(`Failed to assign kc-admin-api scope: HTTP ${scopeAssignRes.status}`)
  }
  console.info('Assigned kc-admin-api default client scope.')

  // Resolve the service account user Keycloak auto-creates (may not appear immediately)
  let serviceAccount
  for (let i = 0; i < 20; i++) {
    const saRes = await fetch(
      `${KC_BASE}/admin/realms/master/users?username=service-account-keycloak-reporter`,
      { headers }
    )
    const [found] = /** @type {{ id: string }[]} */ (await saRes.json())
    if (found) { serviceAccount = found; break }
    await new Promise(r => setTimeout(r, 1000))
  }
  if (!serviceAccount) throw new Error('Service account for keycloak-reporter not found after retries')

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

  // Verify service account can actually reach the admin API before signalling readiness
  for (let i = 0; i < 4; i++) {
    const vtRes = await fetch(`${KC_BASE}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'keycloak-reporter',
        client_secret: '3UYhI2hryFwoVtcd7ljlaDuD9HXrGV5r',
      }),
    })
    const { access_token } = /** @type {{ access_token?: string }} */ (await vtRes.json())
    if (access_token) {
      const adminRes = await fetch(`${KC_BASE}/admin/realms`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      console.info(`Admin API verification: HTTP ${adminRes.status}`)
      if (adminRes.ok) break
      if (i === 0) {
        const payload = JSON.parse(
          Buffer.from(access_token.split('.')[1], 'base64url').toString()
        )
        console.info('--- token claims ---')
        console.info(JSON.stringify({
          iss: payload.iss,
          aud: payload.aud,
          azp: payload.azp,
          typ: payload.typ,
          sub: payload.sub,
          scope: payload.scope,
          realm_access: payload.realm_access,
          resource_access: payload.resource_access,
        }, null, 2))
        console.info('--- admin response ---')
        console.info('www-authenticate:', adminRes.headers.get('www-authenticate'))
        console.info('body:', await adminRes.text())
        console.info('--- end diagnostics ---')
      }
      if (i === 3) throw new Error(`Service account cannot access admin API: HTTP ${adminRes.status}`)
    }
    await new Promise(r => setTimeout(r, 1000))
  }

  fs.writeFileSync(READY_MARKER, 'ready')
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
  const tag = process.env.kcVersion || '26.8.2';
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
