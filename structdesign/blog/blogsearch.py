import json
from datetime import date

from flask import Blueprint, request
from sqlalchemy import select

from ..extensions import db, typesense_client
from ..helper import collection_exists, cors_enabled, get_unix_timestamp
from ..models import DocumentTag, GuidanceDocument, documents_schema

bp = Blueprint("blogsearch", __name__, url_prefix="/documents")


def onfalsey(val, fallback):
    return val if val else fallback


@bp.route("/query")
@cors_enabled(methods=["GET"])
def query():
    query = request.args.get("q", "*")
    sort_by = request.args.get("sort", "relevance")
    sort_descending = request.args.get("desc", True)

    sort_str = f"{sort_by if sort_by != "relevance" else '_text_match'}:{'DESC' if sort_descending else 'ASC'}"
    search_parameters = {
        "q": query,
        "query_by": ",".join(["title", "description", "body", "tags"]),
        "sort_by": f"{sort_str}{',_text_match:DESC' if sort_by != "relevance" else ''}",
    }

    return typesense_client.collections["documents"].documents.search(search_parameters)


@bp.route("/advanced_query")
@cors_enabled(methods=["GET"])
def advanced_query():
    query = onfalsey(request.args.get("q"), "*")
    sort_by = onfalsey(request.args.get("sort"), "relevance")
    sort_descending = json.loads(onfalsey(request.args.get("desc"), "true"))
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

    sort_str = f"{sort_by if sort_by != "relevance" else '_text_match'}:{'desc' if sort_descending else 'asc'}"
    search_parameters = {
        "q": query,
        "query_by": ",".join(["title", "description", "body", "tags"]),
        "sort_by": f"{sort_str}{',_text_match:desc' if sort_by != "relevance" else ''}",
        "filter_by": " && ".join(filter_args),
        "facet_by": "tags",
        "page": page,
    }
    results = typesense_client.collections["documents"].documents.search(
        search_parameters
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
        tags_list = results["facet_counts"][tags_i]["counts"]
        for tag in tags_list:
            tag_accent = db.session.scalars(
                select(DocumentTag.accent).filter_by(name=tag["value"])
            ).first()
            tag["color"] = tag_accent

    return results


### COMMANDS


@bp.cli.command("create_documents_jsonl")
def create_documents_jsonl():
    rows = db.session.scalars(select(GuidanceDocument))
    data = [
        {
            "id": str(row.id),
            "title": row.title,
            "description": row.description,
            "body": row.body,
            "date_created": get_unix_timestamp(row.date_created),
            "tags": [tag.name for tag in row.tags],
            "doc_id": row.id,
        }
        for row in rows
    ]
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
