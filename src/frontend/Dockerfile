FROM node:trixie-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

FROM node:trixie-slim
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

# Chạy Vite dev server với --host để có thể truy cập từ bên ngoài container
# và --watch để enable file watching
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]