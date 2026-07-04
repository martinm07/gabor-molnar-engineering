import json
import os
import shutil
import tempfile
from pathlib import Path

import pypandoc
from flask import (
    Blueprint,
    current_app,
    jsonify,
    render_template,
    request,
    send_from_directory,
    url_for,
)
from sqlalchemy import select
from werkzeug.datastructures import FileStorage

from structdesign.blog.blogcreatecomponents import get_component_lib
from structdesign.helper import cors_enabled

from ..extensions import db
from ..models import GuidanceDocument, SavedComponentLibrary

bp = Blueprint("blogadmin", __name__, url_prefix="/documents")


def get_all_documents_json() -> list[dict]:
    all_docs = db.session.scalars(
        select(GuidanceDocument).where(GuidanceDocument.type == 0)
    ).all()

    final = []
    for doc in all_docs:
        final.append(
            {
                "id": doc.id,
                "title": doc.title,
                "description": doc.description,
                "tags": [
                    {
                        "name": tag.name,
                        "accent": tag.accent,
                        "description": tag.description,
                    }
                    for tag in doc.tags
                ],
                "accent": doc.accent,
                "thumbnail": doc.thumbnail,
                "date_created": doc.date_created.isoformat(),
                "date_updated": doc.date_updated.isoformat(),
                "hearts": doc.hearts,
                "status": doc.status,
            }
        )
    return final


@bp.route("/list_all_documents")
@cors_enabled()
def list_all_documents():
    return get_all_documents_json()


@bp.route("/admin")
def admin():
    all_docs = get_all_documents_json()
    return render_template("blog/admin.html", all_docs=all_docs)


def convert_document_to_html(input_path: str, ext: str, doc_id: str) -> str:
    """
    Converts input_path (.docx/.odt) to HTML, storing media under
    instance/documentmedia/<doc_id>/ and rewriting HTML to reference
    /documents/media/<doc_id>/ as the URL prefix.
    """

    with tempfile.TemporaryDirectory() as tmp_extract_dir:
        # result = subprocess.run(
        #     [
        #         "pandoc",
        #         input_path,
        #         "-t", "html",
        #         f"--extract-media={tmp_extract_dir}",
        #     ],
        #     capture_output=True,
        #     text=True,
        #     check=True,
        # )
        html = pypandoc.convert_file(
            input_path,
            "html",
            ext,
            outputfile=None,
            # extra_args=[f"--extract-media=documents/media/{doc_id}/"],
            extra_args=[f"--extract-media={tmp_extract_dir}"],
        )

        print(tmp_extract_dir)

        # Pandoc writes media into <tmp_extract_dir>/media/...
        # tmp_media_dir = os.path.join(tmp_extract_dir, "media")

        # Real storage location
        final_media_dir = os.path.join(
            current_app.instance_path, "documentmedia", doc_id
        )
        os.makedirs(os.path.dirname(final_media_dir), exist_ok=True)

        if os.path.isdir(tmp_extract_dir):
            # Move (not copy) extracted files to their permanent home
            shutil.move(tmp_extract_dir, final_media_dir)

            # Rewrite HTML: swap the temp filesystem path for the public URL
            url_prefix = f"/documents/media/{doc_id}"
            html = html.replace(tmp_extract_dir, url_prefix)

        return html


@bp.route("/create_new_guidance_document", methods=["OPTIONS", "POST"])
@cors_enabled()
def create_new_guidance_document():
    file = request.files.get("file")
    data = request.form

    if not data.get("title"):
        return "'title' field is required.", 400

    # try:
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
    db.session.flush()  # We flush to resolve the ID, we do not commit
    # except:
    #     return "Required fields are 'title'.", 400

    if file:
        ext = Path(file.filename or "").suffix[1:]

        if not ext or ext not in pypandoc.get_pandoc_formats()[0]:  # pyright: ignore[reportIndexIssue]
            return "File had an invalid extension.", 400

        # content = file.stream.read()
        # file.save(fpath)
        # file.stream.r

        with tempfile.NamedTemporaryFile() as input_file:
            file.save(input_file)
            input_file.flush()

            # input_file.

            print(input_file.name)
            output = convert_document_to_html(input_file.name, ext, str(doc.id))
            print("\n\n")
            print(output)

            doc.body = output

    # db.session.commit()

    # return jsonify(url_for("blogcreate.edit_document", id=doc.id))
    return url_for("blogcreate.edit_document", id=doc.id)

    # output = pypandoc.convert_file(
    #     fpath,
    #     "html",
    #     ext,
    #     outputfile=None,
    #     extra_args=[f"--extract-media=documents/media/{doc.id}/"],
    # )
    # print(output)

    # return ""
