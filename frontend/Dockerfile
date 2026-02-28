FROM node:20

WORKDIR /app

# Копируем package.json и lock-файл
COPY frontend/package*.json ./

# Устанавливаем pnpm
RUN npm install -g pnpm@10

# Устанавливаем зависимости
RUN pnpm install

# Копируем весь фронтенд
COPY frontend/ .

EXPOSE 5173

# Запуск dev-сервера
CMD ["pnpm", "dev", "--host"]