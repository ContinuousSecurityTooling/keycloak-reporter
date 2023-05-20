# Keycloak Reporter

[![Docker Stars](https://img.shields.io/docker/stars/continuoussecuritytooling/keycloak-reporting-cli.svg)](https://hub.docker.com/r/continuoussecuritytooling/keycloak-reporting-cli/)

## Usage

```
docker run continuoussecuritytooling/keycloak-reporting-cli listClients <Keycloak_Root_URL> <Client_ID> <Client_Secret> --format=csv
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