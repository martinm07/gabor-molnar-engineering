import os
import warnings

import typesense
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect()

_typesense_host = os.getenv("FLASK_TYPESENSE_HOST")
_typesense_port = os.getenv("FLASK_TYPESENSE_PORT")
_typesense_protocol = os.getenv("FLASK_TYPESENSE_PROTOCOL")
_typesense_api_key = os.getenv("FLASK_TYPESENSE_API_KEY")
if not _typesense_host or not _typesense_port or not _typesense_protocol or not _typesense_api_key:
    warnings.warn("Missing required environment variables for TypeSense connection " +
        "'FLASK_TYPESENSE_HOST', 'FLASK_TYPESENSE_PORT', 'FLASK_TYPESENSE_PROTOCOL', 'FLASK_TYPESENSE_API_KEY'")

typesense_client = typesense.Client( # pyright: ignore [reportPrivateImportUsage]
    {
        "nodes": [
            {
                "host": _typesense_host or "",
                "port": int(_typesense_port or 8108),
                "protocol": _typesense_protocol or "http"
            }
        ],
        "api_key": _typesense_api_key or "",
        "connection_timeout_seconds": 2,
    }
)
