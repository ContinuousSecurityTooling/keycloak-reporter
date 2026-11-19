# Compiles the TypeScript sources; the output is plain JS, so this stage runs on the
# build platform only, even for multi-arch builds.
FROM --platform=$BUILDPLATFORM node:26.13.1-slim AS build

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json cli.ts index.ts ./
COPY config/ config/
COPY lib/ lib/
COPY src/ src/
COPY types/ types/
RUN npm run build

FROM node:26.13.1-slim

ARG BUILD_DATE
ARG APP_VERSION

LABEL org.opencontainers.image.authors='Martin Reinhardt (martin@m13t.de)' \
    org.opencontainers.image.created=$BUILD_DATE \
    org.opencontainers.image.version=$APP_VERSION \
    org.opencontainers.image.url='https://hub.docker.com/r/continuoussecuritytooling/keycloak-reporting-cli' \
    org.opencontainers.image.documentation='https://github.com/ContinuousSecurityTooling/keycloak-reporter' \
    org.opencontainers.image.source='https://github.com/ContinuousSecurityTooling/keycloak-reporter.git' \
    org.opencontainers.image.licenses='MIT'

ENV CONFIG_FILE=/app/config.json

COPY --from=build /src/dist/ /app/
COPY docker_entrypoint.sh package.json /app/

WORKDIR /app

RUN npm install --omit=dev &&\
    chown -R 1000:2000 /app

# apt update
RUN apt-get update && apt-get -y upgrade &&\
  # clean up to slim image
  apt-get clean autoclean && apt-get autoremove --yes && rm -rf /var/lib/{apt,dpkg,cache,log}/

USER 1000

ENTRYPOINT ["/app/docker_entrypoint.sh"]
