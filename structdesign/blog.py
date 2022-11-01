from flask import Blueprint, render_template

bp = Blueprint("blog", __name__)

@bp.route("/guidance_documents")
def guidance_documents():
    return render_template("blog/home.html", user=None, bool=bool)