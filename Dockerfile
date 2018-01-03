FROM node:9.3.0
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 6001
CMD [ "npm", "start"]