from flask import Blueprint, jsonify, render_template, request
from sqlalchemy import func, select

from .extensions import db
from .helper import cors_enabled
from .models import GuidanceDocument

bp = Blueprint("blog", __name__, url_prefix="/guidance_documents")


@bp.route("/")
def guidance_documents():
    return render_template("blog/home.html", user=None, bool=bool)


@bp.route("/get_latest")
@cors_enabled(methods=["GET"])
def get_latest():
    totalnum = db.session.scalars(func.count(GuidanceDocument.id)).first()
    page = int(request.args.get("p", 0))
    length = int(request.args.get("l", totalnum))

    results = []
    rows = db.session.scalars(
        select(GuidanceDocument).order_by(GuidanceDocument.date_created.desc())
    )
    for i, row in enumerate(rows):
        if i < page * length:
            continue
        if i >= (page + 1) * length:
            break
        results.append(
            {
                "title": row.title,
                "description": row.description,
                "body": row.body,
                "accent": row.accent,
                "thumbnail": row.thumbnail,
            }
        )
    return jsonify(results)
