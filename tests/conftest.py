import os
import time
from pathlib import Path

import docker
import mysql.connector
import pytest
import requests
import sqlalchemy as sa
import typesense
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import scoped_session, sessionmaker

from structdesign import create_app
from structdesign.extensions import csrf, db

load_dotenv()

try:
    DB_CONN = os.environ["TEST_DATABASE_URL"]
except KeyError:
    raise KeyError(
        "TEST_DATABASE_URL not found. You must export a \
                   database connection string to the environment variable \
                   TEST_DATABASE_URL in order to run tests"
    )
else:
    DB_OPTS = sa.engine.url.make_url(DB_CONN).translate_connect_args()


@pytest.fixture(scope="session")
def database(client):
    test_db = mysql.connector.connect(
        host=DB_OPTS.get("host"),
        user=DB_OPTS.get("username"),
        password=DB_OPTS.get("password"),
    )
    dbname = DB_OPTS.get("database")

    cursor = test_db.cursor()

    cursor.execute("SHOW DATABASES")
    if next((x for x in cursor if x[0] == dbname), -1) == -1:
        cursor.execute("CREATE DATABASE " + dbname)
    # Potentially unread results in cursor
    cursor.reset()

    db.create_all()  # Requires active Flask application context
    yield db

    cursor.execute("DROP DATABASE " + dbname)
    cursor.close()


@pytest.fixture(scope="session")
def app():
    # Note that, because `database` depends on `client` depends on `app`
    #  (for the active application context), this seems to initialize
    #  SQLAlchemy with a database that doesn't yet exist. However, because
    #  of lazy initialization it doesn't actually mind!
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": DB_CONN})
    for bp in app.iter_blueprints():
        csrf.exempt(bp)
    ## Indeed, the following will produce the error "Unknown database 'tes_gab_mol_eng'"
    # with app.app_context():
    #     user = User("ThisWillFail", "failure@failstreet.gov")

    return app


@pytest.fixture(autouse=True)
def enable_transactional_tests(database: SQLAlchemy):
    """https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites"""
    connection = database.engine.connect()
    transaction = connection.begin()

    database.session = scoped_session(
        session_factory=sessionmaker(
            bind=connection,
            join_transaction_mode="create_savepoint",
        )
    )

    yield

    database.session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="session")
def typesense_client():
    client = docker.from_env()

    project_root = Path(__file__).parent
    instance_folder = os.path.join(project_root, "instance")

    container = next(
        (
            container
            for container in client.containers.list(all=True)
            if container.name == "typesense_tes_gab_mol_eng"
        ),
        None,
    )

    if not container:
        container = client.containers.run(
            "typesense/typesense:26.0",
            name="typesense_tes_gab_mol_eng",
            detach=True,
            ports={"8109/tcp": 8109},
            volumes=[f"{os.path.join(instance_folder, "typesense-data")}:/data"],
            command=[
                "--data-dir",
                "/data",
                "--api-key",
                "testing",
                "--api-port",
                "8109",
                "--enable-cors",
            ],
        )
    else:
        if not container.status == "running":
            container.start()

    typesense_client = typesense.Client(
        {
            "nodes": [
                {
                    "host": "localhost",
                    "port": "8109",
                    "protocol": "http",
                }
            ],
            "api_key": "testing",
            "connection_timeout_seconds": 2,
        }
    )

    timeout = 30
    sleep_time = 0.5
    elapsed_time = 0
    while True:
        try:
            resp = requests.get("http://localhost:8109/health").json()
            if resp.get("ok") or elapsed_time > timeout:
                break
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(sleep_time)
        elapsed_time += sleep_time

    yield typesense_client

    # container.kill("SIGINT")


@pytest.fixture(scope="session")
def client(app: Flask):
    with app.app_context():
        yield app.test_client()


@pytest.fixture(scope="session")
def runner(app: Flask):
    return app.test_cli_runner()


@pytest.fixture(autouse=True)
def cleanup_session(client):
    with client.session_transaction() as session:
        session.clear()
