#!/bin/bash
# Wait for Keycloak to start and the keycloak-reporter client to be fully provisioned
READY_MARKER="$(dirname "$0")/../tmp/keycloak-ready"

counter=0
printf 'Waiting for Keycloak server to start'
until $(curl --output /dev/null --silent --head --fail http://localhost:8080/realms/master/.well-known/openid-configuration); do
    printf '.'
    sleep 10
    if [[ "$counter" -gt 24 ]]; then
        printf "\nKeycloak server failed to start. Timeout!"
        curl --head --fail http://localhost:8080/realms/master/.well-known/openid-configuration
        exit 1
    fi
    counter=$((counter + 1))
done

printf '\nWaiting for keycloak-reporter client to be provisioned'
counter=0
until [[ -f "$READY_MARKER" ]]; do
    printf '.'
    sleep 5
    if [[ "$counter" -gt 24 ]]; then
        printf "\nClient provisioning timed out!"
        exit 1
    fi
    counter=$((counter + 1))
done
printf '\nKeycloak server and client ready.\n'
