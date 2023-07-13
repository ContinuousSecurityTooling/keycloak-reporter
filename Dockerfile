FROM node:20

ENV CONFIG_FILE=/app/config.json

COPY dist/ docker_entrypoint.sh package.json /app

WORKDIR /app

RUN cd /app &&  npm i

ENTRYPOINT ["/app/docker_entrypoint.sh"]