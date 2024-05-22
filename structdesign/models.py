import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .extensions import db


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
