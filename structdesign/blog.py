import json
import random
from itertools import islice
from typing import Iterable

import click
from flask import Blueprint, jsonify, render_template, request
from sqlalchemy import select

from .extensions import db, typesense_client
from .helper import collection_exists, cors_enabled, get_unix_timestamp
from .models import (
    DocumentTag,
    GuidanceDocument,
    document_tag_association_table,
    documents_schema,
)

bp = Blueprint("blog", __name__, url_prefix="/documents")


@bp.route("/")
@bp.route("/all")
def guidance_documents():
    return render_template("blog/home.html", user=None, bool=bool)


def paginate(gen: Iterable, page: float, length: int):
    if length is None:
        return gen
    if page is None:
        page = 0
    return islice(gen, int(page * length), int((page + 1) * length))


@bp.route("/get_latest")
@cors_enabled(methods=["GET"])
def get_latest():
    page = float(request.args.get("p")) if "p" in request.args else None
    length = int(request.args.get("l")) if "l" in request.args else None

    results = []
    rows = db.session.scalars(
        select(GuidanceDocument).order_by(GuidanceDocument.date_created.desc())
    )

    for row in paginate(rows, page, length):
        results.append(
            {
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "accent": row.accent,
                "thumbnail": row.thumbnail,
            }
        )
    return jsonify(results)


@bp.route("/get_tagnames")
@cors_enabled(methods=["GET"])
def get_tagnames():
    tags = db.session.scalars(select(DocumentTag)).all()
    return jsonify(
        [
            {"name": tag.name, "description": tag.description, "color": tag.accent}
            for tag in tags
        ]
    )


@bp.route("/get_blogs_tag")
@cors_enabled(methods=["GET"])
def get_blogs_tag():
    name = request.args.get("name", None)
    if not name:
        return jsonify([])

    page = float(request.args.get("p")) if "p" in request.args else None
    length = int(request.args.get("l")) if "l" in request.args else None

    scalar_subq = (
        select(DocumentTag.id).where(DocumentTag.name == name).scalar_subquery()
    )

    stmt = (
        select(
            GuidanceDocument.id,
            GuidanceDocument.title,
            GuidanceDocument.description,
            GuidanceDocument.accent,
            GuidanceDocument.thumbnail,
        )
        .join_from(
            GuidanceDocument,
            document_tag_association_table,
            GuidanceDocument.id == document_tag_association_table.c.blog_id,
        )
        .where(document_tag_association_table.c.tag_id == scalar_subq)
    )
    rows = db.session.execute(stmt).all()
    return jsonify(
        [
            {
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "accent": row.accent,
                "thumbnail": row.thumbnail,
            }
            for row in paginate(rows, page, length)
        ]
    )


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


lorem = """Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Turpis cursus in hac habitasse platea dictumst quisque. Elementum facilisis leo vel fringilla est ullamcorper eget nulla. Vitae congue mauris rhoncus aenean vel. Tortor aliquam nulla facilisi cras fermentum odio. Dolor sed viverra ipsum nunc aliquet. A diam maecenas sed enim ut. Fermentum odio eu feugiat pretium nibh ipsum consequat nisl vel. Nulla aliquet enim tortor at auctor. Sapien pellentesque habitant morbi tristique senectus et. Convallis convallis tellus id interdum velit. Mi tempus imperdiet nulla malesuada pellentesque elit. In fermentum et sollicitudin ac orci phasellus egestas tellus. Etiam non quam lacus suspendisse faucibus interdum. Egestas fringilla phasellus faucibus scelerisque eleifend donec pretium. Sed cras ornare arcu dui vivamus arcu felis bibendum ut. Lectus nulla at volutpat diam ut venenatis. Lobortis feugiat vivamus at augue eget. Vitae elementum curabitur vitae nunc sed velit dignissim. Egestas maecenas pharetra convallis posuere morbi leo. Ipsum consequat nisl vel pretium. Faucibus a pellentesque sit amet porttitor eget dolor. Pharetra et ultrices neque ornare aenean euismod elementum nisi quis. Aliquam ut porttitor leo a. Eu sem integer vitae justo eget magna. Morbi tincidunt ornare massa eget egestas. Eleifend quam adipiscing vitae proin sagittis nisl rhoncus mattis. Suspendisse ultrices gravida dictum fusce ut. Auctor augue mauris augue neque gravida in fermentum. Eu lobortis elementum nibh tellus molestie nunc non blandit massa. Convallis aenean et tortor at risus viverra. Velit ut tortor pretium viverra suspendisse potenti nullam. Et magnis dis parturient montes nascetur ridiculus mus mauris vitae. Luctus accumsan tortor posuere ac ut consequat semper viverra nam. Ac orci phasellus egestas tellus rutrum. Amet mattis vulputate enim nulla aliquet porttitor lacus. Integer quis auctor elit sed vulputate mi. Nisi lacus sed viverra tellus in hac habitasse platea. Odio morbi quis commodo odio aenean sed. Nibh venenatis cras sed felis eget. Nulla facilisi nullam vehicula ipsum a arcu cursus vitae congue. Tristique senectus et netus et malesuada. Semper eget duis at tellus at. Ut morbi tincidunt augue interdum velit euismod in pellentesque. Sed adipiscing diam donec adipiscing tristique risus. Consequat mauris nunc congue nisi vitae. Sed libero enim sed faucibus turpis in eu mi. Enim praesent elementum facilisis leo. Lacus laoreet non curabitur gravida arcu ac tortor dignissim. Nulla facilisi nullam vehicula ipsum a arcu. Accumsan lacus vel facilisis volutpat est velit. Nulla at volutpat diam ut venenatis. Sollicitudin aliquam ultrices sagittis orci a scelerisque purus. Vestibulum lorem sed risus ultricies tristique nulla aliquet enim. Neque vitae tempus quam pellentesque nec nam aliquam sem. Consectetur libero id faucibus nisl tincidunt. At elementum eu facilisis sed odio morbi quis commodo odio. Ullamcorper eget nulla facilisi etiam dignissim diam quis enim lobortis. Sed libero enim sed faucibus turpis in. Ut sem viverra aliquet eget sit amet tellus cras adipiscing. Faucibus et molestie ac feugiat sed lectus vestibulum. Orci eu lobortis elementum nibh tellus molestie nunc. Est placerat in egestas erat imperdiet sed euismod nisi. Cursus sit amet dictum sit amet justo. Sed faucibus turpis in eu mi bibendum neque. Odio facilisis mauris sit amet massa vitae tortor condimentum lacinia. Pharetra diam sit amet nisl suscipit adipiscing bibendum est. Adipiscing elit ut aliquam purus. Integer quis auctor elit sed vulputate mi sit. Orci a scelerisque purus semper eget duis. Nibh venenatis cras sed felis eget velit aliquet sagittis. Donec ac odio tempor orci dapibus ultrices in iaculis nunc. Velit ut tortor pretium viverra."""
colors = [
    "121 93 147",
    "229 59 161",
    "84 163 53",
    "74 71 89",
    "63 89 82",
    "32 35 43",
    "49 29 66",
    "198 229 59",
    "120 93 147",
    "35 124 175",
    "224 188 166",
    "57 109 140",
    "55 58 58",
    "48 168 140",
    "50 114 28",
]


@bp.cli.command("addblogs")
@click.argument("num")
def addblogs(num):
    """Adds randomized blogs of size `num` to the database."""
    num = int(num)
    thumbnail = "M 0 0 L 2 -2 L 3 -2 L 3 2 L 1 4 L 0 4 L 0 0 L 1 0 L 1 4 L 1 4 L 1 0 M 3 -2 L 1 0 M -2 3 L -3 1 L -2 0 L -1 1 L -2 3 M -2 3 L -2.273 1.39 L -3 1 M -2.273 1.388 L -1 1 M -2.273 1.389 L -2 0"
    for _ in range(num):
        start = random.randint(0, len(lorem) // 2)
        titlelen = random.randint(15, 35)
        desclen = random.randint(100, 150)
        color = random.choice(colors)

        doc = GuidanceDocument(
            title=lorem[start : start + titlelen],
            description=lorem[start : start + desclen],
            body=lorem,
            accent=color,
            thumbnail=thumbnail,
        )
        db.session.add(doc)
    db.session.commit()


@bp.cli.command("addtags")
@click.argument("num")
def addtags(num):
    tags = []
    for _ in range(int(num)):
        name = " ".join(random.choices(lorem.split(" "), k=random.randint(1, 2)))
        start = random.randint(0, len(lorem) // 2)
        descLen = random.randint(100, 150)
        color = random.choice(colors)
        tag = DocumentTag(
            name=name, description=lorem[start : start + descLen], accent=color
        )
        tags.append(tag)
        db.session.add(tag)
    blogs = db.session.scalars(select(GuidanceDocument)).all()
    for tag in tags:
        for blog in blogs:
            if random.random() < 0.5:
                continue
            blog.tags.append(tag)
    db.session.commit()
