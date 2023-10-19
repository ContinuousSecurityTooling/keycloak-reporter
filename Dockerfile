FROM node:20

LABEL org.opencontainers.image.source https://github.com/ContinuousSecurityTooling/keycloak-reporter

ENV CONFIG_FILE=/app/config.json

COPY dist/ docker_entrypoint.sh package.json /app

WORKDIR /app

RUN cd /app && npm install --omit=dev &&\
    chown -R 1000:2000 /app

USER 1000

ENTRYPOINT ["/app/docker_entrypoint.sh"]