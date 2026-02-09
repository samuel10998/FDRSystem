FROM node:23-alpine

WORKDIR /app

# dependencies first (better cache)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# app source
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
