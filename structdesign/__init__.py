import os
from pathlib import Path

from flask import Flask, request, send_file

from . import helper, home
from .auth import auth, pdfpass  # , old_auth2, register
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


def get_public_files(public_root: str):
    public_files = []
    for root, _, files in os.walk(public_root):
        for file in files:
            path = Path(os.path.join(root, file)).relative_to(public_root)
            public_files.append(str(path))
    return public_files


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

    # @app.before_request
    # def debug_headers():
    #     if request.method == "P"
    #     app.logger.warning("Headers: %s", dict(request.headers))
    #     app.logger.warning("is_secure=%s host=%s", request.is_secure, request.host)

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
    app.register_blueprint(pdfpass.bp)

    ## For looking at the old (and frankly better) registration page
    ##  in a Svelte development server under _DEPR_svelte, uncomment this
    ##  line.
    # app.register_blueprint(old_auth2.bp)

    ## This could be used to see the old old registration page under _DEPR_svelte
    ##  however I don't think that'll function properly without some other work being done.
    # app.register_blueprint(old_auth.bp)

    appname = app.config.get("APP")
    if appname:
        PUBLIC_ROOT = os.path.abspath(os.path.join(appname, "public"))
        public_files = get_public_files(PUBLIC_ROOT)
    else:
        raise OSError("The FLASK_APP environment variable isn't set.")

    @app.before_request
    def check_public_files():
        if any(x == request.path[1:] for x in public_files):
            return send_file(os.path.join(PUBLIC_ROOT, request.path[1:]))

    return app
