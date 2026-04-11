FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist /app/dist

EXPOSE 3000

CMD ["sh", "-c", "node dist/mcp-server/bin/http.js --token ${SIYUAN_API_TOKEN} --port 3000 --baseUrl ${SIYUAN_BASE_URL}"]