FROM python:3.13-slim AS base

WORKDIR /app

# Install ffmpeg and basic utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependency files first
COPY pyproject.toml uv.lock ./

# Install dependencies (in editable environment)
RUN uv sync --frozen --no-dev

# Copy app source
COPY . .

RUN if [ -n "$SECRET_COOKIES" ]; then echo "$SECRET_COOKIES" > /app/yt_cookies.txt; fi

EXPOSE 8000

# Run FastAPI app
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
