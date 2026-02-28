FROM node:20

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install -g pnpm@10

RUN pnpm install

COPY frontend/ .

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]