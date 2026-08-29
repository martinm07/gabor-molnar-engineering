import json
import os
import shutil
import tempfile
from pathlib import Path

import pypandoc
from flask import (
    Blueprint,
    current_app,
    render_template,
    request,
    url_for,
)
from sqlalchemy import and_, select
from sqlalchemy.orm import aliased

from structdesign.blog.blogcreatecomponents import get_component_lib
from structdesign.blog.blogsearch import (
    delete_typesense_document,
    update_typesense_document,
)
from structdesign.helper import admin_required, api_view

from ..extensions import db
from ..models import GuidanceDocument

bp = Blueprint("blogadmin", __name__, url_prefix="/documents")


def get_all_documents_json() -> list[dict]:
    #   https://stackoverflow.com/a/26124759/11493659
    """
    SELECT t1.*
    FROM table_name AS t1
    LEFT JOIN table_name AS t2
    ON t1.firstname = t2.firstname
    AND t1.lastname > t2.lastname
    WHERE t2.id IS NULL;
    """

    t1 = aliased(GuidanceDocument)
    t2 = aliased(GuidanceDocument)

    # This statement returns rows for all the GuidanceDocuments of unique IDs.
    # --------
    # This is a "left join"- where we keep ALL the rows of the "left table", and join the right table
    #  rows wherever we can, according to the criterion.
    # In this case, that criterion is that the id matches, and that the right table row has a SMALLER "type".
    # If the left table row has a type of 0, that is impossible so it won't match.
    # We then use a WHERE clause to filter the joint table, to those rows where we COULDN'T join the right table.
    # This means that, if a GuidanceDocument of type 0 (i.e. published) exists, it will be preferred.
    stmt = (
        select(t1)
        .join_from(t1, t2, and_(t1.id == t2.id, t2.type < t1.type), isouter=True)
        .where(t2.id.is_(None))
    )

    all_docs = db.session.scalars(stmt).all()

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


@bp.route("/api/list_all_documents")
@api_view()
def list_all_documents():
    return get_all_documents_json()


@bp.route("/admin")
@admin_required
def admin():
    all_docs = get_all_documents_json()
    return render_template("blog/admin.html", all_docs=all_docs)


class UnsupportedOrInvalidFileError(Exception):
    pass


def convert_document_to_html(input_path: str, ext: str, doc_id: str) -> str:
    """
    Converts input_path (.docx/.odt) to HTML, storing media under
    instance/documentmedia/<doc_id>/ and rewriting HTML to reference
    /documents/media/<doc_id>/ as the URL prefix.
    """

    with tempfile.TemporaryDirectory() as tmp_extract_dir:
        try:
            html = pypandoc.convert_file(
                input_path,
                "html",
                ext,
                outputfile=None,
                extra_args=[f"--extract-media={tmp_extract_dir}"],
            )
        except RuntimeError:
            raise UnsupportedOrInvalidFileError

        print(tmp_extract_dir)

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
            # This is safe because of the path given to temporary files is stuff like
            # "/tmp/nix-shell.vmfioY/tmpwxrp9jlm", which should never appear naturally in the text.
            html = html.replace(tmp_extract_dir, url_prefix)

        return html


@bp.route("/api/create_new_guidance_document", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def create_new_guidance_document():
    file = request.files.get("file")
    data = request.form

    if not data.get("title"):
        return "'title' field is required.", 400
    elif len(data["title"]) > 256:
        return "Title must be 256 characters long or less."

    doc = GuidanceDocument(
        title=data["title"],
        description=data.get("description", ""),
        accent=data.get("accent", None),
        thumbnail=data.get("thumbnail", ""),
        body=data.get("body", ""),
        stylesheet=data.get("stylesheet", ""),
        component_lib_version=get_component_lib().latest_version,
        status="public",
        type=1,
    )
    db.session.add(doc)
    db.session.flush()  # We flush to resolve the ID, we do not commit

    if file:
        ext = Path(file.filename or "").suffix[1:]

        # if not ext or ext not in pypandoc.get_pandoc_formats()[0]:  # pyright: ignore[reportIndexIssue]
        #     return "File had an invalid extension.", 400

        with tempfile.NamedTemporaryFile() as input_file:
            file.save(input_file)
            input_file.flush()

            print(input_file.name)
            try:
                output = convert_document_to_html(input_file.name, ext, str(doc.id))
            except UnsupportedOrInvalidFileError:
                return (
                    "File type is unsupported or otherwise the file contents are invalid",
                    400,
                )

            output = (
                '<main style="width: 75%; max-width: 600px; margin: 0 auto;">'
                + output
                + "</main>"
            )

            print("\n\n")
            print(output)

            doc.body = output

    db.session.commit()
    update_typesense_document(doc)

    # We are returning text, not JSON
    return url_for("blogcreate.edit_document", id=doc.id)


@bp.route("/api/delete_document", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def delete_document():
    data = json.loads(request.data.decode("utf-8"))
    if not data.get("id"):
        return "'id' required.", 400

    to_delete = db.session.scalars(
        select(GuidanceDocument).where(GuidanceDocument.id == int(data["id"]))
    ).all()

    if len(to_delete) == 0:
        return f"No document of id '{data['id']}'", 400

    for doc in to_delete:
        db.session.delete(doc)

    db.session.commit()
    [delete_typesense_document(doc.id) for doc in to_delete]

    return ""
