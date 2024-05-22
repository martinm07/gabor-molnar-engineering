import os

import mysql.connector
import pytest
import sqlalchemy as sa
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
    else:
        # The expression in the if statement may leave some unread items in the results buffer,
        # which we need to clear out before continuing
        cursor.fetchall()

        cursor.execute("USE " + dbname)
        cursor.execute("SHOW TABLES")
        for x in cursor:
            cursor.execute(f"DROP TABLE IF EXISTS {x[0]}")

    db.create_all()  # Requires active Flask application context
    return db


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
def client(app: Flask):
    with app.app_context():
        yield app.test_client()


@pytest.fixture(scope="session")
def runner(app: Flask):
    return app.test_cli_runner()


# @pytest.fixture(autouse=True)
# def cleanup_session(client: FlaskClient):
#     with client.session_transaction() as session:
#         session.clear()
