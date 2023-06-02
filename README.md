# Keycloak Reporter


[![License](https://img.shields.io/github/license/ContinuousSecurityTooling/keycloak-reporter.svg)](LICENSE)
[![CI](https://github.com/ContinuousSecurityTooling/keycloak-reporter/actions/workflows/pipeline.yml/badge.svg)](https://github.com/ContinuousSecurityTooling/keycloak-reporter/actions/workflows/pipeline.yml)
[![npm version](https://badge.fury.io/js/%40ContinuousSecurityTooling%2Fkeycloak-reporter.svg)](https://www.npmjs.com/package/@continuoussecuritytooling/keycloak-reporter)
[![npm downloads](https://img.shields.io/npm/dm/%40ContinuousSecurityTooling%2Fkeycloak-reporter.svg)](https://www.npmjs.com/package/@continuoussecuritytooling/keycloak-reporter)
[![npm downloads](https://img.shields.io/npm/dt/%40ContinuousSecurityTooling%2Fkeycloak-reporter.svg)](https://www.npmjs.com/package/@continuoussecuritytooling/keycloak-reporter)
[![Docker Stars](https://img.shields.io/docker/stars/continuoussecuritytooling/keycloak-reporting-cli.svg)](https://hub.docker.com/r/continuoussecuritytooling/keycloak-reporting-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/ContinuousSecurityTooling/keycloak-reporter/badge.svg)](https://snyk.io/test/github/ContinuousSecurityTooling/keycloak-reporter)

[![Docker Stars](https://img.shields.io/docker/stars/continuoussecuritytooling/keycloak-reporting-cli.svg)](https://hub.docker.com/r/continuoussecuritytooling/keycloak-reporting-cli/)

## Usage

```
npm i @continuoussecuritytooling/keycloak-reporter --location=global
kc-reporter help
```
For listing clients:
```
kc-reporter listClients <Keycloak_Root_URL> <Client_ID> <Client_Secret> --format=csv
```

The output looks for CSV, like that:
```
"client","description","realm","enabled","public","allowedOrigins"
"account",,"bunge",true,true,"[]"
"account-console",,"bunge",true,true,"[]"
"admin-cli",,"bunge",true,true,"[]"
"broker",,"bunge",true,false,"[]"
"portal",,"bunge",true,false,"[]"
"realm-management",,"bunge",true,false,"[]"
"security-admin-console",,"bunge",true,true,"[""+""]"
```

Valid commands are:
- `listClients`
- `listUsers`

## Advanced

### Config file

You can also provider a config file via env var `CONFIG_FILE` and then just provide the commands, e.g.:
```
CONFIG_FILE=e2e/fixtures/config.json kc-reporter listClients
```

### Post to Slack or Teams

When using this command:
```
kc-reporter listUsers <Keycloak_Root_URL> <Client_ID> <Client_Secret> --format=json --output=webhook --webhookType=slack --webhookUrl=$WEBHOOK_TESTING_SLACK
```
the following entry in slack will be created:
![Slack Sample](.docs/webhook-slack-sample.png)

And for Teams:
```
kc-reporter listUsers <Keycloak_Root_URL> <Client_ID> <Client_Secret> --format=json --output=webhook --webhookType=teams --webhookUrl=$WEBHOOK_TESTING_TEAMS
```
the following entry in slack will be created:
![Team Sample](.docs/webhook-teams-sample.png)