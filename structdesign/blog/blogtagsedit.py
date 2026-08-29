import json
from typing import Any

from flask import Blueprint, render_template, request
from sqlalchemy import select

from ..extensions import db
from ..helper import api_view
from ..models import DocumentTag

bp = Blueprint("blogtagsedit", __name__, url_prefix="/documents")


def get_all_tags(return_objs=False) -> list[Any]:
    tag_objs = db.session.scalars(select(DocumentTag)).all()

    tag_objs = list(tag_objs)
    tag_objs.sort(key=lambda x: x.id)

    all_tags = []
    for tag in tag_objs:
        document_titles = [
            doc.title
            for i, doc in enumerate(tag.documents)
            if not any(x.id == doc.id for x in tag.documents[:i])
        ]

        all_tags.append(
            {
                "name": tag.name,
                "description": tag.description,
                "accent": tag.accent,
                "documentTitles": document_titles,
            }
        )

    if not return_objs:
        return all_tags
    else:
        return tag_objs


@bp.route("/api/get_all_tags")
@api_view(admin_required_=False)
def get_all_tags_view():
    all_tags = get_all_tags()
    return all_tags


@bp.route("/api/save_doctag_changes", methods=["OPTIONS", "POST"])
@api_view(methods=["OPTIONS", "POST"])
def save_doctag_changes():
    data = json.loads(request.data.decode("utf-8"))

    all_tags = get_all_tags(True)

    # Add new tags
    added = data.get("added", [])
    for new_tag_data in added:
        new_tag = DocumentTag(
            name=new_tag_data.get("name"),
            description=new_tag_data.get("description"),
            accent=new_tag_data.get("accent"),
        )
        db.session.add(new_tag)

    # Edit tags
    edit: dict[str, dict] = data.get("edit", {})
    for i, new_data in edit.items():
        tag = all_tags[int(i)]
        print(tag.name, " -> ", new_data.get("name"))
        print(tag.description, " -> ", new_data.get("description"))
        print(tag.accent, " -> ", new_data.get("accent"))
        print("-----------")

        if name := new_data.get("name"):
            tag.name = name
        if description := new_data.get("description"):
            tag.description = description
        if accent := new_data.get("accent"):
            tag.accent = accent

    # Remove tags
    removed = data.get("removed", [])
    for i in removed:
        db.session.delete(all_tags[i])

    print(all_tags)
    print("-------------------")
    print(added)
    print(edit)
    print(removed)

    db.session.commit()

    return ""


@bp.route("/tags")
def tags():
    all_tags = get_all_tags()

    return render_template("blog/tagsedit.html", all_tags=all_tags)
