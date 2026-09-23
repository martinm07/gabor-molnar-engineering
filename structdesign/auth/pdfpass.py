import hashlib
import os

from flask import Blueprint, render_template, request

from structdesign.helper import api_view

bp = Blueprint("pdfpass", __name__, url_prefix="/")


@bp.route("/pdfpass")
def pdfpass():
    marker = os.environ.get("FLASK_PDFPASS_MARKER")
    return render_template("auth/pdfpass.html", marker=marker)


@bp.route("/pdfpass/<seed>")
def pdfpass_seed(seed: str):
    marker = os.environ.get("FLASK_PDFPASS_MARKER")
    return render_template("auth/pdfpass.html", seed=seed, marker=marker)


@bp.route("/api/pdfpass_get_password")
@api_view()
def pdfpass_get_password():
    seed = request.args.get("seed")
    if seed is None:
        return "Missing required argument 'seed'."

    marker = os.environ.get("FLASK_PDFPASS_MARKER")
    salt = os.environ.get("FLASK_PDFPASS_SALT")

    if marker is None or salt is None:
        raise OSError(
            "'FLASK_PDFPASS_MARKER' and 'FLASK_PDFPASS_SALT' are missing from the environment."
        )

    salt_bytes = salt.encode("utf-8")
    seed_bytes = seed.encode("utf-8")
    digest = hashlib.sha256(salt_bytes + seed_bytes).hexdigest()

    return digest[:24]


@bp.route("/api/pdfpass_get_marker")
@api_view()
def pdfpass_get_marker():
    marker = os.environ.get("FLASK_PDFPASS_MARKER", "")
    return marker
