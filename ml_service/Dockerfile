FROM python:3.13-slim AS base

WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependency files first
COPY pyproject.toml uv.lock ./

# Install dependencies (in editable environment)
RUN uv sync --frozen --no-dev

# Copy app source
COPY . .

EXPOSE 8000

# Run FastAPI app
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

