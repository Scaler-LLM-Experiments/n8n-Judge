# Build + serve the Vite SPA that lives in app/ (repo root is not the app root).
FROM node:20-alpine
WORKDIR /app

# install deps first for layer caching
COPY app/package*.json ./
RUN npm install

# build the production bundle
COPY app/ ./
RUN npm run build

# vite preview binds to $PORT (Railway injects it); host allowed in vite.config.js
CMD ["npm", "run", "start"]
