FROM python:3.12-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Копируем и устанавливаем Python зависимости
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь backend
COPY backend/ .

# Открываем порт
EXPOSE 8000

# Команда запуска Django dev сервера
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]