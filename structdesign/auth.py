import json, warnings, os, time, asyncio
from validate_email import validate_email

from flask import Blueprint, render_template, request, session
from sqlalchemy.exc import NoResultFound
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from twilio.base.exceptions import TwilioException

from .extensions import db
from .models import User, UserBackupFactor
from .helper import cors_enabled, host_is_local

bp = Blueprint("auth", __name__)

try:
    account_sid = os.environ.get("FLASK_TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("FLASK_TWILIO_AUTH_TOKEN")
    client = Client(account_sid, auth_token)
except TwilioException:
    warnings.warn("No credentials and thus no Twilio client created.")

@bp.route("/login")
def login():
    return "<h1>Hello, world!</h1>"

############################################################
###                  REGISTRATION                        ###
############################################################

@bp.route("/register")
def register():
    render_template("auth/register.html", user=None, bool=bool)

### API ###

# Note, "simple requests" don't trigger a CORS preflight, the requirements for which are here:
#  https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
# This means we don't need to support the "OPTIONS" method here.
@bp.route("/api/register/is_name_taken", methods=["POST"])
@cors_enabled(methods=["POST"])
def is_name_taken():
    username : str = json.loads(request.data.decode("utf-8"))
    try:
        db.session.execute(db.select(User).filter_by(username=username)).one()
    except NoResultFound:
        return {"is_taken": False}
    return {"is_taken": True}

@bp.route("/api/register/set_name", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def set_name():
    if request.method != "POST":
        return {}
    data : dict = json.loads(request.data.decode("utf-8"))
    username : str = data["username"]
    if " " in username:
        return 400

    new_user = User(username)
    db.session.add(new_user)
    db.session.commit()
    session["register_username"] = username
    session["register_userid"] = new_user.id
    return {}

def checkout_phone_number(number):
    return client.lookups.v2.phone_numbers(number).fetch()
def is_email_valid(email):
    print(email)
    # print(validate_email(email_address=email, dns_timeout=0.5, smtp_timeout=0.5))
    return not (validate_email(email_address=email) == False) # `not (... == False)` to evaluate ambiguous results as True

@bp.route("/api/register/is_valid_phone_number", methods=["POST"])
@cors_enabled(methods=["POST"])
def is_valid_phone_number():
    number : str = json.loads(request.data.decode("utf-8"))
    phone_number = checkout_phone_number(number)
    return {"is_valid": phone_number.valid}
@bp.route("/api/register/is_valid_email", methods=["POST"])
@cors_enabled(methods=["POST"])
def is_valid_email():
    email : str = json.loads(request.data.decode("utf-8"))
    is_valid = is_email_valid(email) # this takes up to 20 freaking seconds...
    if is_valid: # We don't want legitimate users having to wait for validation again in "/set_info"
        session["register_valid_emails"] = session.get("register_valid_emails", []) + [email]
    return {"is_valid": is_valid}

@bp.route("/api/register/is_email_taken", methods=["POST"])
@cors_enabled(methods=["POST"])
def is_email_taken():
    email : str = json.loads(request.data.decode("utf-8"))
    try:
        user = db.session.execute(db.select(User).filter_by(email=email)).one()[0]
        if user.id == session.get("register_userid"):
            raise NoResultFound
    except NoResultFound:
        return {"is_taken": False}
    return {"is_taken": True}
@bp.route("/api/register/is_phone_taken", methods=["POST"])
@cors_enabled(methods=["POST"])
def is_phone_taken():
    phone_number : str = json.loads(request.data.decode("utf-8"))
    try:
        user = db.session.execute(db.select(User).filter_by(phone_number=phone_number)).one()[0]
        if user.id == session.get("register_userid"):
            raise NoResultFound
    except NoResultFound:
        return {"is_taken": False}
    return {"is_taken": True}

@bp.route("/api/register/set_info", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def set_info():
    if request.method != "POST":
        return {}
    data : dict = json.loads(request.data.decode("utf-8"))
    type_, info = data["type"], data["data"]

    user = db.session.get(User, session["register_userid"])
    # Do nothing if we're not making any changes to the info
    if (type_ == "email" and user.email == info) or (type_ == "phone" and user.phone_number == info):
        return {}

    user.email = None; user.phone_number = None
    if (type_ == "email") and ((info in session.get("register_valid_emails", [])) or is_email_valid(info)):
        user.email = info
    elif (type_ == "phone") and checkout_phone_number(info).valid:
        user.phone_number = info
    db.session.commit()
    return {}


@bp.route("/api/register/phone_number_has_country_code", methods=["POST"])
@cors_enabled(methods=["POST"])
def phone_number_has_country_code():
    number : str = json.loads(request.data.decode("utf-8"))
    phone_number = checkout_phone_number(number)
    return {"has_country_code": bool(phone_number.country_code)}