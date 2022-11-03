from flask import Blueprint

bp = Blueprint("auth", __name__)

@bp.route("/login")
def login():
    return "<h1>Hello, world!</h1>"