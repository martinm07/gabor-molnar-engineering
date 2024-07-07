from __future__ import annotations

import datetime
from typing import List

from sqlalchemy import Column, ForeignKey, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .extensions import db

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
    hearts: Mapped[int]


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
