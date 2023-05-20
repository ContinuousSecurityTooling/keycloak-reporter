FROM node:18

COPY dist/ docker_entrypoint.sh /app

WORKDIR /app

RUN cd /app &&  npm i

ENTRYPOINT ["/app/docker_entrypoint.sh"]