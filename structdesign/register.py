import json
import os

from flask import Blueprint, request, session
from sqlalchemy import select
from validate_email import validate_email

from .extensions import db
from .helper import cors_enabled
from .models import User, UserLoginOption

bp = Blueprint("register", __name__, url_prefix="/register")


@bp.route("/get_session_state")
@cors_enabled()
def get_session_state():
    return {
        "username": session.get("REG-username"),
        "email": session.get("REG-email"),
        "password": session.get("REG-password"),
        "loginmode": session.get("REG-loginmode"),
    }


def is_username_valid(username: str):
    if not username or username == "":
        return {"result": False, "code": "UNM"}
    if len(username) < 3:
        return {"result": False, "code": "UNS"}
    if len(db.session.execute(select(User).filter_by(name=username)).all()) > 0:
        return {"result": False, "code": "UNT"}
    return {"result": True}


@bp.route("/add_username", methods=["POST"])
@cors_enabled()
def add_username():
    username: str = request.data.decode("utf-8")
    result = is_username_valid(username)
    if result["result"]:
        session["REG-username"] = username
    return result


@bp.route("/set_loginmode", methods=["POST"])
@cors_enabled()
def set_loginmode():
    loginmode: str = request.data.decode("utf-8")
    if loginmode not in ["password", "twofactorauth", "possession"]:
        return {"result": False, "code": "LMI"}
    session["REG-loginmode"] = loginmode
    return {"result": True}


def is_email_valid(email: str):
    if not email or email == "":
        return {"result": False, "code": "EMM"}
    docheck = json.loads(os.environ.get("FLASK_VALIDATE_EMAIL_CHECK_DNS_SMTP", "true"))
    if (
        validate_email(email_address=email, check_dns=docheck, check_smtp=docheck)
        is False
    ):
        return {"result": False, "code": "EMI"}
    if (
        len(
            db.session.execute(
                select(UserLoginOption).filter_by(
                    info=email, type="email", isrecovery=False
                )
            ).all()
        )
        > 0
    ):
        return {"result": False, "code": "EMT"}
    return {"result": True}


def is_password_valid(password: str):
    if not password or password == "":
        return {"result": False, "code": "PWM"}
    return {"result": True}


@bp.route("/add_email_password", methods=["POST"])
@cors_enabled()
def add_email_password():
    data = json.loads(request.data.decode("utf-8"))
    email: str = data.get("email")
    password: str = data.get("password")

    email_result = is_email_valid(email)
    password_result = is_password_valid(password)

    if email_result["result"] and password_result["result"]:
        session["REG-email"] = email
        session["REG-password"] = password
        return {"result": True}

    return {
        "result": False,
        "code": f'{email_result.get("code", "")}{password_result.get("code", "")}',
    }


@bp.route("/finish", methods=["POST"])
@cors_enabled()
def finish():
    loginmode = session.get("REG-loginmode")
    if not loginmode:
        return "'REG-loginmode' session variable missing.", 400
    loginfactors = []
    if loginmode == "password":
        email = session.get("REG-email")
        password = session.get("REG-password")
        if not email or not password:
            return (
                "'REG-email' or 'REG-password' session variables not provided for 'password' loginmode",
                400,
            )
        loginfactors.append(
            UserLoginOption(info=email, type="email", isloginfactor=False)
        )
        loginfactors.append(UserLoginOption(info=password, type="password"))
    elif loginmode == "twofactorauth":
        email = session.get("REG-email")
        password = session.get("REG-password")
        phone = session.get("REG-phone")
        if not email or not password or not phone:
            return (
                "'REG-email' or 'REG-password' or 'REG-phone' session variables not provided for 'twofactorauth' loginmode",
                400,
            )
        loginfactors.append(
            UserLoginOption(info=email, type="email", isloginfactor=False)
        )
        loginfactors.append(
            UserLoginOption(info=password, type="password", precedence=0)
        )
        loginfactors.append(UserLoginOption(info=phone, type="phone", precedence=1))
    elif loginmode == "possession":
        if session.get("REG-email") and session.get("REG-phone"):
            return (
                "Providing both 'REG-email' and 'REG-phone' to 'possession' loginmode is ambiguous",
                400,
            )
        elif session.get("REG-email"):
            loginfactors.append(
                UserLoginOption(info=session.get("REG-email"), type="email")
            )
        elif session.get("REG-phone"):
            loginfactors.append(
                UserLoginOption(info=session.get("REG-phone"), type="phone")
            )
        else:
            return (
                "Missing 'REG-email'/'REG-phone' session variable for 'possession' loginmode",
                400,
            )
    else:
        return (
            f"Invalid value for 'REG-loginmode'. Expected one of 'password', 'twofactorauth' or 'possession'. Got {loginmode}",
            400,
        )

    username = session.get("REG-username")
    if not username:
        return "Missing 'REG-username'", 400

    new_user = User(name=username)
    [new_user.logins_list.append(loginfactor) for loginfactor in loginfactors]
    db.session.add(new_user)
    db.session.commit()

    [
        session.pop(key)
        for key in [
            "REG-username",
            "REG-email",
            "REG-password",
            "REG-phone",
            "REG-loginmode",
        ]
        if key in session
    ]
    return {"result": True}
