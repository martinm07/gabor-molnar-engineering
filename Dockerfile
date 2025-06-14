# The Python version should just be the same as the Python version I'm using in
#  development. This is because it has to line up with version requirements in
#  requirements.txt, which is generated from my development environment.
# Hopefully in the future I can get away from this dependence using a better
#  package manager like `uv`, or using `pylock.toml` files, or something else.
FROM python:3.12.3

## Installing git so that "py3-validate-email" can install from gitea
## This is only necessary for "-slim" Python images
# RUN apt-get update && apt-get install -y git \
#     # "Clean up to keep the container small" 
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

# WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt gunicorn
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "wsgi:app"]