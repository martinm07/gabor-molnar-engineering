from datetime import datetime

from sqlalchemy import select

from structdesign.blog.blogcreate import create_version
from structdesign.extensions import db
from structdesign.models import (
    DocumentTag,
    GuidanceDocument,
    SavedComponent,
    SavedComponentLibrary,
)


def populate_blogs(num: int, **kwargs) -> list[GuidanceDocument]:
    def getval(name: str, i: int, default=None):
        return (
            kwargs.get(name)[i]
            if kwargs.get(name) and kwargs.get(name)[i:]
            else default
        )

    docs = []
    for i in range(num):
        doc = GuidanceDocument(
            title=getval("title", i, f"title{i}"),
            description=getval("description", i, f"desc{i}"),
            body=getval("body", i, f"body{i}"),
            accent=getval("accent", i, "0 0 0"),
            thumbnail=getval("thumnail", i, "<svg-path>"),
            hearts=getval("hearts", i, 0),
            status=getval("status", i, "public"),
            component_lib_version=getval("component_lib_version", i, ""),
        )
        if getval("date_created", i):
            doc.date_created = datetime.fromisoformat(kwargs["date_created"][i])
        docs.append(doc)
        db.session.add(doc)
    db.session.commit()
    return docs


def populate_tags(num: int, docs, **kwargs) -> list[DocumentTag]:
    def getval(name: str, i: int, default=None):
        return (
            kwargs.get(name)[i]
            if kwargs.get(name) and kwargs.get(name)[i:]
            else default
        )

    blogs = db.session.scalars(select(GuidanceDocument)).all() if not docs else docs

    tags = []
    for i in range(num):
        tag = DocumentTag(
            name=getval("name", i, f"tag{i}"),
            description=getval("description", i, f"tagdescription{i}"),
            accent=getval("accent", "0 0 0"),
        )
        if getval("doc_ids", i):
            doc_ids = getval("doc_ids", i)
            [blog.tags.append(tag) for blog in blogs if blog.id in doc_ids]
        tags.append(tag)
        db.session.add(tag)
    db.session.commit()
    return tags


def populate_components(
    num: int, lib: SavedComponentLibrary, **kwargs
) -> tuple[list[SavedComponent], str]:
    def getval(name: str, i: int, default=None):
        return (
            kwargs.get(name)[i]
            if kwargs.get(name) and kwargs.get(name)[i:]
            else default
        )

    comps = []
    for i in range(num):
        comp = SavedComponent(
            name=getval("name", i, f"name{i}"),
            description=getval("description", i, f"desc{i}"),
            content=getval("content", i, f"content{i}"),
            parts=getval("parts", i, f"parts{i}"),
            library=lib,
        )
        comps.append(comp)
        db.session.add(comp)
    version = create_version(comps)
    lib.latest_version = version
    db.session.commit()
    return comps, version


def create_component_lib() -> SavedComponentLibrary:
    lib = SavedComponentLibrary(name="base", latest_version="")
    db.session.add(lib)
    db.session.commit()
    return lib
