import os
import json
from pathlib import Path

from flask import Blueprint, current_app, render_template, send_from_directory, request
from sqlalchemy import select
import pypandoc

from structdesign.blog.blogcreatecomponents import get_component_lib
from structdesign.helper import cors_enabled

from ..extensions import db
from ..models import GuidanceDocument, SavedComponentLibrary

bp = Blueprint("blogadmin", __name__, url_prefix="/documents")


def get_all_documents_json() -> list[dict]:
    all_docs = db.session.scalars(select(GuidanceDocument).where(GuidanceDocument.type == 0)).all()

    final = []
    for doc in all_docs:
        final.append({
            "id": doc.id,
            "title": doc.title,
            "description": doc.description,
            "tags": [{
                "name": tag.name,
                "accent": tag.accent,
                "description": tag.description
            } for tag in doc.tags],
            "accent": doc.accent,
            "thumbnail": doc.thumbnail,
            "date_created": doc.date_created.isoformat(),
            "date_updated": doc.date_updated.isoformat(),
            "hearts": doc.hearts,
            "status": doc.status,
        })
    return final


@bp.route("/list_all_documents")
@cors_enabled()
def list_all_documents():
    return get_all_documents_json()

@bp.route("/admin")
def admin():
    all_docs = get_all_documents_json()
    return render_template("blog/admin.html", all_docs=all_docs)


@bp.route("/create_new_guidance_document", methods=["OPTIONS", "POST"])
@cors_enabled()
def create_new_guidance_document():
    file = request.files.get("file")
    data = request.form

    try:
        doc = GuidanceDocument(
            title=data["title"],
            description=data.get("description", ""),
            body=data.get("body", ""),
            accent=data.get("accent", None),
            thumbnail=data.get("thumbnail", ""),
            component_lib_version=get_component_lib().latest_version,
            status="public",
            type=1,
        )
        db.session.add(doc)
        db.session.flush() # We flush to resolve the ID, we do not commit
    except:
        return "Required fields are 'title'.", 400

    if file:
        fpath = Path(current_app.instance_path) / "temp";
        ext = Path(file.filename or "").suffix[1:]

        if not ext or ext not in pypandoc.get_pandoc_formats()[0]: # pyright: ignore[reportIndexIssue]
            return "File had an invalid extension.", 400

        # content = file.stream.read()
        file.save(fpath)

        output = pypandoc.convert_file(
            "docs/test1.odt",
            "html",
            outputfile=None,
            extra_args=[f'--extract-media=documents/media/{doc.id}/']
        )
        print(output)

        os.remove(fpath)

    return ""
