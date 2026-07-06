import os

from flask import Flask

from . import helper, home
from .auth import auth  # , old_auth2, register
from .blog import (
    blogadmin,
    blogcreate,
    blogcreatecomponents,
    blogcreatedocuments,
    blogcreateiframeresizer,
    bloghomeread,
    blogsearch,
    blogtagsedit,
)
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

    app.register_blueprint(home.bp)
    # app.register_blueprint(register.bp)

    app.register_blueprint(bloghomeread.bp)
    app.register_blueprint(blogsearch.bp)
    app.register_blueprint(blogcreate.bp)
    app.register_blueprint(blogtagsedit.bp)
    app.register_blueprint(blogadmin.bp)

    ## API for Guidance Document editor
    app.register_blueprint(blogcreatedocuments.bp)
    app.register_blueprint(blogcreatecomponents.bp)
    app.register_blueprint(blogcreateiframeresizer.bp)

    app.register_blueprint(auth.bp)

    ## For looking at the old (and frankly better) registration page
    ##  in a Svelte development server under _DEPR_svelte, uncomment this
    ##  line.
    # app.register_blueprint(old_auth2.bp)

    ## This could be used to see the old old registration page under _DEPR_svelte
    ##  however I don't think that'll function properly without some other work being done.
    # app.register_blueprint(old_auth.bp)

    return app
