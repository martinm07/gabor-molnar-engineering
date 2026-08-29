import os
from datetime import UTC, datetime

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from structdesign.helper import api_view

from ..extensions import db
from ..models import Param

bp = Blueprint("login", __name__, url_prefix="/")


@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        error = None
        if not username:
            error = "Username is required."
        elif not password:
            error = "Password is required."

        required_username = os.getenv("ADMIN_USERNAME")
        required_password = os.getenv("ADMIN_PASSWORD")

        if username != required_username or password != required_password:
            error = "Username and/or password incorrect."

        print("PROCESSING LOGIN SUBMISSION", error, list(session.items()))

        if error:
            flash(error)
        else:
            session["is_admin"] = True
            session["logged_in_time"] = datetime.now(UTC).isoformat()
            if redirect_to := request.args.get("redirect_to"):
                return redirect(redirect_to)
            else:
                return redirect(url_for("home.home"))
    return render_template("auth/login.html")


@bp.route("/logout", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def logout():
    session.pop("is_admin", "")
    session.pop("logged_in_time", "")

    return ""


@bp.route("/logout_all", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def logout_all():
    current_time = datetime.now(UTC).isoformat()

    param = db.session.get(Param, "logout_admin_before")
    if not param:
        param = Param(key="logout_admin_before", value=current_time)
        db.session.add(param)
    else:
        param.value = current_time

    db.session.commit()
    return ""
