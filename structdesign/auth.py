import json, warnings, os, hashlib, time, requests
from validate_email import validate_email
from datetime import datetime

from flask import Blueprint, render_template, request, session
from sqlalchemy.exc import NoResultFound
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from twilio.base.exceptions import TwilioException

from .extensions import db
from .models import User, UserSecret, UserBackupFactor, RequestStamp
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
    return render_template("auth/register.html", user=None, bool=bool)

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
        session["register_info_type"] = "email"
    elif (type_ == "phone") and checkout_phone_number(info).valid:
        user.phone_number = info
        session["register_info_type"] = "phone"
    db.session.commit()
    session["register_info"] = info
    return {}

sha256 = lambda x: hashlib.sha256(str.encode(x)).hexdigest()
true_rand = lambda: sha256("".join([str(item) for item in list(os.urandom(5))]))
def get_ipaddress():
    if host_is_local(request.url_root):
        return "51.171.46.235"
    else:
        return request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)

@bp.before_app_request
def generate_cookie_hash():
    if not session.get("cookie_hash"):
        ipaddress = get_ipaddress()
        same_addresses = db.session.execute(db.select(RequestStamp).filter_by(ipaddress=ipaddress)).all()
        latest_request = same_addresses[-1][0] if same_addresses != [] else None
        if (same_addresses != []) and ((datetime.now() - latest_request.timestamp).seconds <= latest_request.address_lifespan):
            session["cookie_hash"] = latest_request.cookie_id
        else:
            session["cookie_hash"] = true_rand()

def stamp_request(name):
    ipaddress = get_ipaddress()
    
    URL = 'https://rdap.db.ripe.net/ip/' + ipaddress
    resp = requests.get(url=URL)
    data = resp.json()
    operator_name = data["name"]
    address_pool = data["startAddress"] + " - " + data["endAddress"]

    if ("dynamic" in operator_name.lower()) and ("nat" in operator_name.lower()):
        address_lifespan = 3600
    else:
        address_lifespan = 86400

    new_stamp = RequestStamp(ipaddress=ipaddress, address_pool=address_pool, address_lifespan=address_lifespan, 
                             cookie_id=session["cookie_hash"], request=name)
    db.session.add(new_stamp)
    db.session.commit()

def compute_token():
    user = db.session.get(User, session["register_userid"])
    usersecret = db.session.get(UserSecret, user.secret_id)
    curtime = str(int(
        (time.time() - session.get("register_tokentimeoffset", 0))
        // (float(os.environ.get("VERIFY_TOKEN_EXPIRE_MINS")) * 60)
     ))
    info = user.email or user.phone_number
    ipaddress = get_ipaddress()
    token = str(int(sha256(usersecret.secret + curtime + info + ipaddress), 16))[-6:]
    print("Computed token of: " + token)
    return token
def token_penalty(attempt_num):
    retry_timeouts = {
        0: 0,
        1: 30,
        2: 40,
        3: 60,
        4: 90,
        5: 120
    }
    return retry_timeouts.get(attempt_num, 600)
def can_sendtoken_info():
    requests = db.session.execute(db.select(RequestStamp).filter_by(cookie_id=session["cookie_hash"], request="send_token")).all()
    # TODO: Ignore requests before completed login/registration cycles OR that have been there more than 24 hours ago
    timeout = token_penalty(len(requests))
    if requests != []:
        delta = datetime.now() - requests[-1][0].timestamp
        return (delta.days*86400 + delta.seconds) >= timeout, len(requests), delta.days*86400 + delta.seconds
    return True, len(requests), 365*86400

def send_token_email(token):
    user = db.session.get(User, session["register_userid"])
    print(f"Sent the token to email address {user.email}: {token}")
def send_token_sms(token):
    user = db.session.get(User, session["register_userid"])
    print(f"Sent the token to phone number {user.phone_number}: {token}")

@bp.route("/api/register/send_token", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def send_token():
    if request.method != "POST":
        return {}
    data : dict = json.loads(request.data.decode("utf-8")) # Might raise error if there's no data
    first_send_only = data["firstSendOnly"]

    user = db.session.get(User, session["register_userid"])
    info = user.email or user.phone_number

    can_send, attempts, last_attempt = can_sendtoken_info() # last_attempt -> seconds since last attempt
    def returnMsg():
        if (first_send_only and session.get("first_token_sent")):
            return {"msgType": "neutral", "message": "first_token_already_sent"}
        if not can_send:
            return {"msgType": "error", "message": "resend_timeout_not_finished"}

        curtime = time.time()
        cycle_len = float(os.environ["VERIFY_TOKEN_EXPIRE_MINS"]) * 60
        # The amount of time it's been (in seconds) since this token cycle started
        session["register_tokentimeoffset"] = curtime % cycle_len

        if session["register_info_type"] == "email":
            return_msg = send_token_email(compute_token())
        elif session["register_info_type"] == "phone":
            return_msg = send_token_sms(compute_token())

        if return_msg:
            return return_msg

        session["first_token_sent"] = True
        stamp_request("send_token")
        nonlocal last_attempt
        last_attempt = 0
        return {"msgType": "success", "message": ""}
    # timeout has to be the timeout of the next attempt only if this one was successful
    return_data = returnMsg()|{"info": info, "infoType": session["register_info_type"], 
                               "timeout": max(0, token_penalty(attempts + (1 if last_attempt == 0 else 0)) - last_attempt)}
    return return_data, (400 if return_data["msgType"] == "error" else 200)

@bp.route("/api/register/phone_number_has_country_code", methods=["POST"])
@cors_enabled(methods=["POST"])
def phone_number_has_country_code():
    number : str = json.loads(request.data.decode("utf-8"))
    phone_number = checkout_phone_number(number)
    return {"has_country_code": bool(phone_number.country_code)}

@bp.route("/api/register/wait_until_resend_ready", methods=["GET"])
@cors_enabled(methods=["GET"])
def wait_until_resend_ready():
    can_send, num_attempts, last_attempt = can_sendtoken_info()
    if can_send:
        return {}
    print("Going to sleep for " + str(token_penalty(num_attempts) - last_attempt) + " seconds.")
    time.sleep(token_penalty(num_attempts) - last_attempt)
    return {}
