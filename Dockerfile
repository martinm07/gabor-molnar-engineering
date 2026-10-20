FROM python:3.12.3

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files first (better layer caching)
COPY pyproject.toml .
COPY uv.lock .
# Install dependencies (no project itself yet)
RUN uv sync --frozen --no-install-project

# Copy the rest of the app
COPY . .
# Install the project itself
RUN uv sync --frozen

ENV PYTHONUNBUFFERED=1

EXPOSE 5000
CMD ["uv", "run", "gunicorn", "-b", "0.0.0.0:5000", \
  "--access-logfile", "-", \
  "--error-logfile", "-", \
  "--log-level", "info", \
  "--capture-output", \
  "wsgi:app"]
