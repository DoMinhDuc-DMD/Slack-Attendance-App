FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install ngrok -g

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]