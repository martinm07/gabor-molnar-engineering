FROM python:3.11-slim

# Installing git so that "py3-validate-email" can install from gitea
RUN apt-get update && apt-get install -y git \
    # "Clean up to keep the container small" 
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt gunicorn
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "wsgi:app"]