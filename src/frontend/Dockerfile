FROM node:trixie-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

FROM node:trixie-slim
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]