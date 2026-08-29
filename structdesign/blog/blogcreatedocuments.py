# from datetime.timezone.utc import UTC
import json
import os
from datetime import UTC, date, datetime, timezone
from pathlib import Path

from flask import Blueprint, current_app, request
from sqlalchemy import select
from werkzeug.utils import secure_filename

from structdesign.blog.blogsearch import update_typesense_document

from ..extensions import db
from ..helper import api_view
from ..models import DocumentTag, GuidanceDocument

bp = Blueprint("blogcreatedocuments", __name__, url_prefix="/documents")


def get_development_document(id_: int, commit_changes=False):
    devdoc = db.session.get(GuidanceDocument, (id_, 1))
    if devdoc:
        return devdoc

    publishdoc = db.session.get(GuidanceDocument, (id_, 0))
    if publishdoc:
        current_app.logger.warning(
            "Creating missing development document from published document for ID %s",
            id_,
        )
        devdoc = GuidanceDocument(
            id=id_,
            type=1,
            title=publishdoc.title,
            description=publishdoc.description,
            accent=publishdoc.accent,
            thumbnail=publishdoc.thumbnail,
            tags=publishdoc.tags,
            body=publishdoc.body,
            stylesheet="",
            component_lib_version=publishdoc.component_lib_version,
            hearts=0,
            status=publishdoc.status,
        )
        db.session.add(devdoc)
        if commit_changes:
            db.session.commit()
        return devdoc
    else:
        return None


@bp.route("/api/get_document_edit")
@api_view()
def get_document_edit():
    id_ = request.args.get("id")
    if id_ is None:
        return "Required URL parameter 'id'", 400
    doc = get_development_document(int(id_), commit_changes=True)
    if doc is None:
        return f"Found no document of id '{id_}'", 404

    return {
        "id": doc.id,
        "title": doc.title,
        "description": doc.description,
        "body": doc.body,
        "accent": doc.accent,
        "thumbnail": doc.thumbnail,
        "tags": [tag.name for tag in doc.tags],
        "status": doc.status,
        "component_lib_ver": doc.component_lib_version,
    }


################################# DOCUMENT BODY


@bp.route("/api/sync_document_full", methods=["OPTIONS", "POST"])
@api_view()
def sync_document_full():
    data = json.loads(request.data.decode("utf-8"))
    id_: int = data.get("id")
    if id_ is None:
        return "Missing required 'id' key", 400
    body: str = data.get("body")
    if body is None:
        return "Missing required 'body' key", 400

    # document = db.session.get(GuidanceDocument, int(id_))
    document = get_development_document(int(id_))
    if document is None:
        return f"Found no document of id '{id_}'", 400
    document.body = body
    document.date_updated = datetime.now(UTC)
    db.session.commit()
    return ""


@bp.route("/api/sync_document_patch", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def sync_document_patch():
    """
    Synchronizes a guidance document's content by applying a list of patch operations.
    This endpoint expects a JSON payload with the following structure:
        {
            "id": int,                # The ID of the guidance document to patch (required)
            "patches": [              # A list of patch objects (required)
                {
                    "index": int,     # The starting index in the document body to apply the patch (required)
                    "length": int,    # The number of characters to replace (optional, defaults to 0)
                    "value": str      # The string to insert at the specified index (optional, defaults to "")
                },
                ...
            ],
            "complibver": str         # The component library version for the document
        }
    Each patch replaces `length` characters at `index` with `value`.
    Returns:
        - The updated document content as a string on success.
        - A 400 error with a descriptive message if required data is missing or invalid.
    """
    data = json.loads(request.data.decode("utf-8"))
    id_: int = data.get("id")
    if not id_:
        return "Missing required 'id' key", 400

    patches: list[dict[str, str | int]] = data.get("patches", "")
    # print(patches)
    if type(patches) is not list:
        return "'patches' must be an array", 400

    complibver: str | None = data.get("complibver", None)
    if complibver is None:
        return "'complibver' is required", 400

    document = get_development_document(int(id_))
    if not document:
        return f"No guidance document of id '{id_}'", 400
    content = document.body
    # old_len = len(content)

    # Sync the content of a document by sending a minimal amount of data
    #  for the server to then figure out how to patch in.
    # To speed up this view more it would be cool if database syncs could be "debounced"
    #  someway, though this is probably beyond scope (would involve an in-memory db e.g. Redis, DragonFly, Valkey)

    # patch_str will be set up as a list of change objects, each one with the content to insert, the index
    #  to insert it at, and how many characters to replace

    for patch in patches:
        value = str(patch.get("value", ""))
        length = int(patch.get("length", 0))
        index = patch.get("index")
        if type(index) is not int:
            return "Each patch object requires an index", 400
        patch["old_val"] = content[index : index + length]
        content = content[:index] + value + content[index + length :]

    # for i in range(len(patches)):
    #     patch = patches[i]
    #     print(
    #         f'({i}) Index: {patch["index"]} Length: {patch["length"]} "{patch["old_val"]}" -> "{patch["value"]}"'
    #     )
    # print(f"---Content length: {old_len} -> {len(content)}")
    print(content)
    document.body = content
    document.component_lib_version = complibver
    document.date_updated = datetime.now(UTC)
    db.session.commit()

    return content


################################### DOCUMENT METADATA


def fill_doc_tag_names(tags: list[str]) -> list[DocumentTag]:
    final: list[DocumentTag] = []
    for tag_str in tags:
        tag = db.session.scalars(select(DocumentTag).filter_by(name=tag_str)).first()
        if not tag:
            raise ValueError(f"Tag '{tag_str}' does not exist.")
        final.append(tag)
    return final


@bp.route("/api/update_document_metadata", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def update_document_metadata():
    data = json.loads(request.data.decode("utf-8"))
    id_: int = data.get("id")
    if not id_:
        return "Missing required 'id' key", 400

    document = get_development_document(int(id_))
    if not document:
        return f"No guidance document of id '{id_}'", 400

    try:
        if title := data.get("title"):
            document.title = title
        if description := data.get("description"):
            document.description = description
        if tags := data.get("tags"):
            document.tags = fill_doc_tag_names(tags)
        if accent := data.get("accent"):
            document.accent = accent
        if thumbnail := data.get("thumbnail"):
            document.thumbnail = thumbnail
        if status := data.get("status"):
            document.status = status

        ## IMP: ANY VALIDATION SHOULD GO HERE

        document.date_updated = datetime.now(UTC)
        db.session.commit()
    except Exception:  # noqa: BLE001
        document = get_development_document(int(id_), commit_changes=True)
        if not document:
            return f"Somehow no guidance document of id '{id_}'", 400

    return {
        "title": document.title,
        "description": document.description,
        "tags": [tag.name for tag in document.tags],
        "accent": document.accent,
        "thumbnail": document.thumbnail,
        "status": document.status,
    }


@bp.route("/api/publish_development_document", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def publish_development_document():
    data = json.loads(request.data.decode("utf-8"))
    id_ = data.get("id")
    if not id_:
        return "Missing required 'id' key", 400

    document = get_development_document(int(id_))
    if not document:
        return f"No guidance document of id '{id_}'", 404

    body = data.get("body")
    stylesheet = data.get("stylesheet")
    if body is None or stylesheet is None:
        return "Missing required fields 'body' and 'stylesheet'", 400

    publishdoc = db.session.get(GuidanceDocument, (int(id_), 0))
    if not publishdoc:
        publishdoc = GuidanceDocument(
            id=id_,
            type=0,
            title=document.title,
            description=document.description,
            accent=document.accent,
            thumbnail=document.thumbnail,
            tags=document.tags,
            body=body,
            stylesheet=stylesheet,
            component_lib_version=document.component_lib_version,
            hearts=0,
            status=document.status,
        )
        db.session.add(publishdoc)
    else:
        publishdoc.title = document.title
        publishdoc.description = document.description
        publishdoc.accent = document.accent
        publishdoc.thumbnail = document.thumbnail
        publishdoc.tags = document.tags

        publishdoc.body = body
        publishdoc.stylesheet = stylesheet
        publishdoc.component_lib_version = document.component_lib_version

        publishdoc.status = document.status
        # We don't set hearts

        publishdoc.date_updated = datetime.now(UTC)

    db.session.commit()
    update_typesense_document(publishdoc)
    return ""


################################# MEDIA FILES


@bp.route("/api/add_media_file", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def add_media_file():
    file = request.files.get("file")
    docid = request.form.get("id")

    print(f"Document ID: {docid}")

    if not file:
        print("No file provided!")
        return "No file provided", 400

    # print(f"filename: {file.filename}")

    if file.filename:
        filename = secure_filename(file.filename)
    else:
        filename = "unnamed"

    filename = Path(filename)

    dirpath = current_app.instance_path / Path(f"documentmedia/{docid}")
    os.makedirs(dirpath, exist_ok=True)

    current_fpath = dirpath / filename
    i = 1
    while current_fpath.exists():
        i += 1
        current_fpath = dirpath / (filename.stem + f"_{i}" + filename.suffix)

    file.save(current_fpath)

    return ""


@bp.route("/api/remove_media_file", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def remove_media_file():
    data = json.loads(request.data.decode("utf-8"))
    docid: str | None = data.get("id")
    path: str | None = data.get("path")

    if not docid or not path:
        return (
            "Parameters 'id' (document ID) and 'path' (path to media file) are required",
            400,
        )

    file_path = current_app.instance_path / Path(f"documentmedia/{docid}") / path
    print(f"Removing file: {file_path}")
    if not file_path.exists():
        return "File doesn't exist", 400

    file_path.unlink()

    return ""


@bp.route("/api/get_media_files", methods=["GET"])
@api_view(methods=["OPTIONS", "POST"])
def get_media_files():
    docid = request.args.get("id")

    if not docid:
        return "Parameter 'id' (document ID) required.", 400

    media_dir = current_app.instance_path / Path(f"documentmedia/{docid}")
    # Doesn't recursively read directories
    # media_files = [fpath.name for fpath in media_dir.iterdir() if fpath.is_file()]

    # Does recursively read directories
    media_files: list[str] = []
    for root, dirs, files in media_dir.walk():
        media_files.extend(
            [str((root / file).relative_to(media_dir)) for file in files]
        )

    def sort_by_modified(x: str):
        return (media_dir / x).stat().st_mtime

    media_files.sort(key=sort_by_modified, reverse=True)

    return media_files
