from __future__ import annotations

import datetime
from typing import List, Literal

from sqlalchemy import Column, ForeignKey, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .extensions import db


class Param(db.Model):
    __tablename__ = "params"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(128))
    value: Mapped[str] = mapped_column(Text())


###################################################
##                      USER                     ##
###################################################


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(String(96), default="")
    about: Mapped[str] = mapped_column(String(512), default="")
    date_created: Mapped[datetime.date] = mapped_column(default=func.current_date())
    display_date_created: Mapped[bool] = mapped_column(default=True)

    secret: Mapped["UserSecret"] = relationship(back_populates="user")
    logins_list: Mapped[list["UserLoginOption"]] = relationship(back_populates="user")


class UserLoginOption(db.Model):
    __tablename__ = "userloginoptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id = mapped_column(ForeignKey("users.id"))
    user: Mapped["User"] = relationship(back_populates="logins_list")

    info: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(10))
    precedence: Mapped[int] = mapped_column(default=0)
    isrecovery: Mapped[bool] = mapped_column(default=False)
    isloginfactor: Mapped[bool] = mapped_column(default=True)


class UserContact(db.Model):
    __tablename__ = "usercontacts"

    id: Mapped[int] = mapped_column(primary_key=True)


class UserSecret(db.Model):
    __tablename__ = "usersecrets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id = mapped_column(ForeignKey("users.id"))
    user: Mapped["User"] = relationship(back_populates="secret", single_parent=True)


###################################################
##                      BLOG                     ##
###################################################

document_tag_association_table = Table(
    "document_tag_association_table",
    db.Model.metadata,
    Column("blog_id", ForeignKey("blogs.id")),
    Column("tag_id", ForeignKey("blogtags.id")),
)


class GuidanceDocument(db.Model):
    __tablename__ = "blogs"

    id: Mapped[int] = mapped_column(primary_key=True)
    date_created: Mapped[datetime.date] = mapped_column(default=func.current_date())
    date_updated: Mapped[datetime.date] = mapped_column(default=func.current_date())
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str] = mapped_column(String(1024))
    body: Mapped[str] = mapped_column(Text())
    accent: Mapped[str] = mapped_column(String(11))
    thumbnail: Mapped[str] = mapped_column(String(4096))
    tags: Mapped[List["DocumentTag"]] = relationship(
        secondary=document_tag_association_table, back_populates="documents"
    )
    hearts: Mapped[int] = mapped_column(default=0)
    status: Mapped[Literal["featured", "public", "unlisted", "private"]] = (
        mapped_column(String(16), default="private")
    )
    component_lib_version: Mapped[str] = mapped_column(Text(), nullable=False)


class DocumentTag(db.Model):
    __tablename__ = "blogtags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(32), unique=True)
    description: Mapped[str] = mapped_column(String(1024))
    accent: Mapped[str] = mapped_column(String(11), nullable=True)

    documents: Mapped[List["GuidanceDocument"]] = relationship(
        secondary=document_tag_association_table, back_populates="tags"
    )


documents_schema = {
    "name": "documents",
    "fields": [
        {"name": "title", "type": "string"},
        {"name": "description", "type": "string"},
        {"name": "body", "type": "string", "stem": True},
        {"name": "date_created", "type": "int64"},
        {"name": "tags", "type": "string[]", "facet": True},
        {"name": "doc_id", "type": "int64", "index": False},
    ],
}


class DocumentFeedback(db.Model):
    __tablename__ = "blogfeedbacks"

    id: Mapped[int] = mapped_column(primary_key=True)
    blog_id: Mapped[int] = mapped_column(ForeignKey("blogs.id"))
    body: Mapped[str] = mapped_column(Text())
    email: Mapped[str] = mapped_column(String(100))


component_tag_association_table = Table(
    "component_tag_association_table",
    db.Model.metadata,
    Column("component_id", ForeignKey("savedcomponents.id")),
    Column("tag_id", ForeignKey("savedcomponenttags.id")),
)


class SavedComponent(db.Model):
    __tablename__ = "savedcomponents"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(32))
    description: Mapped[str] = mapped_column(String(512))
    content: Mapped[str] = mapped_column(Text())
    parts: Mapped[str] = mapped_column(String(1024))

    tags: Mapped[List["SavedComponentTag"]] = relationship(
        secondary=component_tag_association_table, back_populates="components"
    )
    tags_str: Mapped[str] = mapped_column(String(1024), default="")

    library_id = mapped_column(ForeignKey("savedcomponentlibraries.id"))
    library: Mapped["SavedComponentLibrary"] = relationship(back_populates="components")


class SavedComponentTag(db.Model):
    __tablename__ = "savedcomponenttags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(32))
    components: Mapped[List["SavedComponent"]] = relationship(
        secondary=component_tag_association_table, back_populates="tags"
    )


class SavedComponentLibrary(db.Model):
    __tablename__ = "savedcomponentlibraries"

    id: Mapped[int] = mapped_column(primary_key=True)
    components: Mapped[list["SavedComponent"]] = relationship(back_populates="library")
    name: Mapped[str] = mapped_column(String(32))
    latest_version: Mapped[str] = mapped_column(Text(), nullable=False)


class SavedComponentDiff(db.Model):
    __tablename__ = "savedcomponentdiffs"

    id: Mapped[int] = mapped_column(primary_key=True)
    version: Mapped[str] = mapped_column(Text(), nullable=False)
    next_version: Mapped[str] = mapped_column(Text(), nullable=True)
    diff: Mapped[str] = mapped_column(Text())
