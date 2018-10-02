######### USE DOCKER COMPOSE FILE IN ROOT #############


FROM node:10.11.0-alpine

# Create default app directory within the container
WORKDIR /usr/src/app

# Copy local source files into container
COPY /api ./

#VOLUME 


RUN npm install

# replace this with your application's default port
EXPOSE 8888

#DOCKER-COMPOSE over-writes this command when 'entrypoint' is defined
CMD [ "node", "apiServer.js" ]