FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV ENV=production
ENV PORT=8000

CMD alembic upgrade head && python main.py

CMD ["python", "main.py"]

EXPOSE 8000
