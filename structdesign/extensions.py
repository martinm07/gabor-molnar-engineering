import os

import typesense
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect()
typesense_client = typesense.Client(
    {
        "nodes": [
            {
                "host": os.getenv("FLASK_TYPESENSE_HOST"),
                "port": os.getenv("FLASK_TYPESENSE_PORT"),
                "protocol": os.getenv("FLASK_TYPESENSE_PROTOCOL"),
            }
        ],
        "api_key": os.getenv("FLASK_TYPESENSE_API_KEY"),
        "connection_timeout_seconds": 2,
    }
)
