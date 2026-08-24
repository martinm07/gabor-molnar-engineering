import json
import time
from datetime import date
from typing import cast

from flask import Blueprint, render_template, request

# from typesense.exceptions import ServiceUnavailable
from httpx import ConnectError
from sqlalchemy import and_, select
from typesense.exceptions import ObjectNotFound
from typesense.sync.document import Document
from typesense.types.document import DocumentSchema

from ..extensions import db, typesense_client
from ..helper import api_view, collection_exists, get_unix_timestamp
from ..models import DocumentTag, GuidanceDocument, documents_schema

bp = Blueprint("blogsearch", __name__, url_prefix="/documents")


def onfalsey(val, fallback):
    return val if val else fallback


@bp.route("/search")
def search():
    return render_template("blog/search.html")


@bp.route("/query")
@api_view(admin_required_=False)
def query():
    query = request.args.get("q", "*")
    sort_by = request.args.get("sort", "relevance")
    sort_descending = request.args.get("desc", True)

    sort_str = f"{sort_by if sort_by != 'relevance' else '_text_match'}:{'DESC' if sort_descending else 'ASC'}"

    return typesense_client.collections["documents"].documents.search(
        {
            "q": query,
            "query_by": "title,description,body,tags",
            "sort_by": f"{sort_str}{',_text_match:DESC' if sort_by != 'relevance' else ''}",
        }
    )


@bp.route("/advanced_query")
@api_view(admin_required_=False)
def advanced_query():
    query = onfalsey(request.args.get("q"), "*")
    sort_by = onfalsey(request.args.get("sort"), "relevance")
    # sort_descending = json.loads(onfalsey(request.args.get("desc"), "true"))
    sort_ascending = request.args.get("asc") is not None
    tags = request.args.get("tags", None)
    from_date = request.args.get("fromdate", None)
    to_date = request.args.get("todate", None)
    page = onfalsey(request.args.get("page"), "1")

    filter_args = []
    if tags:
        for tag in tags.split(","):
            filter_args.append(f"tags:=[{tag}]")

    if from_date:
        filter_args.append(
            f"date_created:>={get_unix_timestamp(date.fromisoformat(from_date))}"
        )
    if to_date:
        filter_args.append(
            f"date_created:<={get_unix_timestamp(date.fromisoformat(to_date))}"
        )

    sort_str = f"{sort_by if sort_by != 'relevance' else '_text_match'}:{'asc' if sort_ascending else 'desc'}"
    # sort_str = f"{sort_str}{',_text_match:desc' if sort_by != 'relevance' else ''}"

    print("Sort string:", sort_str)
    print(f"Searching with query: '{query}'")

    results = typesense_client.collections["documents"].documents.search(
        {
            "q": query,
            "query_by": "title,description,body,tags",
            "sort_by": sort_str,
            "filter_by": " && ".join(filter_args),
            "facet_by": "tags",
            "page": int(page),
            "highlight_affix_num_tokens": 15,
            "per_page": 12,
            "prioritize_exact_match": False,
        }
    )

    # This whole getting the tags in oder to add the color is very slow
    tags_i = next(
        (
            i
            for i, val in enumerate(results["facet_counts"])
            if val["field_name"] == "tags"
        ),
        None,
    )
    if tags_i is not None:
        tags_list = cast(
            list[dict[str, str]], results["facet_counts"][tags_i]["counts"]
        )
        for tag in tags_list:
            tag_accent = db.session.scalars(
                select(DocumentTag.accent).filter_by(name=tag["value"])
            ).first()
            if tag_accent is not None:
                tag["color"] = tag_accent

    return results


def to_typesense_document(doc: GuidanceDocument):
    return {
        "id": str(doc.id),
        "title": doc.title,
        "description": doc.description,
        "body": doc.body,
        "date_created": get_unix_timestamp(doc.date_created),
        "date_updated": get_unix_timestamp(doc.date_updated),
        "tags": [tag.name for tag in doc.tags],
        "doc_id": doc.id,
        "accent": doc.accent,
        "thumbnail": doc.thumbnail,
    }


def document_exists(typesense_doc: Document[DocumentSchema]):
    try:
        typesense_doc.retrieve()
        return True
    except ObjectNotFound:
        return False
    except ConnectError:
        print("!!! FAILED TO CONNECT TO TYPESENSE SERVER.")

    return False


def update_typesense_document(doc: GuidanceDocument):
    try:
        if doc.status == "unlisted" or doc.status == "private" or doc.type == 1:
            delete_typesense_document(doc.id)
            return

        to_update = typesense_client.collections["documents"].documents[f"{doc.id}"]
        if document_exists(to_update):
            to_update.update(to_typesense_document(doc))
        else:
            typesense_client.collections["documents"].documents.create(
                to_typesense_document(doc)
            )
    except ConnectError:
        print(
            "!!! FAILED TO CONNECT TO TYPESENSE SERVER. WILL NOT APPLY UPDATE TO TYPESENSE DATABASE."
        )


def delete_typesense_document(docid: int):
    try:
        to_delete = typesense_client.collections["documents"].documents[f"{docid}"]
        if document_exists(to_delete):
            to_delete.delete()
    except ConnectError:
        print(
            "!!! FAILED TO CONNECT TO TYPESENSE SERVER. WILL NOT APPLY UPDATE TO TYPESENSE DATABASE."
        )


### COMMANDS


@bp.cli.command("create_documents_jsonl")
def create_documents_jsonl():
    rows = db.session.scalars(
        select(GuidanceDocument).where(
            and_(
                GuidanceDocument.status != "unlisted",
                GuidanceDocument.status != "private",
                GuidanceDocument.type == 0,
            )
        )
    )
    data = [to_typesense_document(row) for row in rows]
    with open("instance/documentdata.jsonl", "w+") as f:
        f.write("\n".join([json.dumps(row) for row in data]))


@bp.cli.command("populate_typesense")
def populate_typesense():
    if collection_exists(typesense_client, "documents"):
        typesense_client.collections["documents"].delete()
    typesense_client.collections.create(documents_schema)

    with open("instance/documentdata.jsonl", "r") as jsonl_file:
        typesense_client.collections["documents"].documents.import_(
            jsonl_file.read().encode("utf-8"), {"action": "create"}
        )
