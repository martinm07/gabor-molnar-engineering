import os

from flask import Flask

# from . import home, old_auth, auth, blog, helper
from . import blog, helper, register
from .extensions import csrf, db, migrate


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_prefixed_env()

    if test_config is None:
        app.config.from_pyfile("config.py", silent=True)
    else:
        app.config.update(test_config)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)

    app.register_blueprint(helper.bp)
    app.register_blueprint(register.bp)
    app.register_blueprint(blog.bp)
    # app.register_blueprint(home.bp)
    # app.register_blueprint(old_auth.bp)
    # app.register_blueprint(auth.bp)

    return app
