import json, warnings, os, hashlib, time, requests
from validate_email import validate_email
from datetime import datetime

from flask import Blueprint, render_template, request, session, jsonify, g
from sqlalchemy.exc import NoResultFound
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from twilio.base.exceptions import TwilioException

from .extensions import db
from .models import User, UserSecret, UserBackupFactor, RequestStamp
from .helper import cors_enabled, host_is_local, country_code_to_prefix, send_email_info

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
        user = db.session.execute(db.select(User).filter_by(username=username)).one()[0]
        if user.id == session.get("register_userid"):
            raise NoResultFound
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

    userid = session.get("register_userid")
    user = User(username) if not userid else db.session.get(User, userid)
    db.session.add(user) if not userid else setattr(user, "username", username)
    db.session.commit()
    session["register_userid"] = user.id
    return {}

def checkout_phone_number(number):
    return client.lookups.v2.phone_numbers(number).fetch()
def is_email_valid(email, fast=False):
    if not fast:
        return not (validate_email(email_address=email) == False) # `not (... == False)` to evaluate ambiguous results as True
    else:
        return validate_email(email_address=email, check_dns=False, check_smtp=False)

@bp.route("/api/register/is_valid_phone_number", methods=["POST"])
@cors_enabled(methods=["POST"])
def is_valid_phone_number():
    number : str = json.loads(request.data.decode("utf-8"))
    phone_number = checkout_phone_number(number)
    return jsonify(phone_number.valid)
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

    old_info = user.email or user.phone_number
    user.email = None; user.phone_number = None
    if (type_ == "email") and ((info in session.get("register_valid_emails", [])) or is_email_valid(info)):
        user.email = info
        session["register_info_type"] = "email"
    elif (type_ == "phone") and checkout_phone_number(info).valid:
        user.phone_number = info
        session["register_info_type"] = "phone"
    
    if old_info != info:
        user.is_verified = False
    db.session.commit()
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
    cookie_id = session["cookie_hash"]
    token = str(int(sha256(usersecret.secret + curtime + info + ipaddress + cookie_id), 16))[-6:]
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
    send_email_info("register-confirm", user.email, token=token)
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

@bp.route("/api/register/wait_until_resend_ready", methods=["GET"])
@cors_enabled(methods=["GET"])
def wait_until_resend_ready():
    can_send, num_attempts, last_attempt = can_sendtoken_info()
    if can_send:
        return {}
    print("Going to sleep for " + str(token_penalty(num_attempts) - last_attempt) + " seconds.")
    time.sleep(token_penalty(num_attempts) - last_attempt)
    return {}

def validate_token_regulated(token):
    if session.get("register_tokenguesses", 0) > 10:
        time.sleep(2.5)
    session["register_tokenguesses"] = session.get("register_tokenguesses", 0) + 1
    return token == compute_token()

@bp.route("/api/register/check_token", methods=["POST"])
@cors_enabled(methods=["POST"])
def check_token():
    token : str = json.loads(request.data.decode("utf-8"))
    if validate_token_regulated(token):
        return jsonify(True)
    else:
        return jsonify(False)

@bp.route("/api/register/validate_info", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def validate_info():
    if request.method != "POST":
        return
    data : dict = json.loads(request.data.decode("utf-8"))
    token = data["token"]
    if not validate_token_regulated(token):
        return {"message": "Incorrect token"}, 400
    user = db.session.get(User, session["register_userid"])
    user.is_verified = True
    db.session.commit()
    return {}


@bp.route("/api/register/set_password", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def set_password():
    data : dict = json.loads(request.data.decode("utf-8"))
    new_password = data["password"]
    user = db.session.get(User, session["register_userid"])
    user.set_password(new_password)
    db.session.commit()
    return {}
@bp.route("/api/register/set_is2fa", methods=["POST"])
@cors_enabled(methods=["POST"])
def set_is2fa():
    data : bool = json.loads(request.data.decode("utf-8"))
    user = db.session.get(User, session["register_userid"])
    user.is_2fa = data
    db.session.commit()
    return {}


@bp.route("/api/register/phone_number_has_country_code", methods=["POST"])
@cors_enabled(methods=["POST"])
def phone_number_has_country_code():
    number : str = json.loads(request.data.decode("utf-8"))
    phone_number = checkout_phone_number(number)
    return jsonify("INVALID_COUNTRY_CODE" not in phone_number.validation_errors)
@bp.route("/api/register/fast_is_valid_email", methods=["POST"])
@cors_enabled(methods=["POST"])
def fast_is_valid_email():
    email : str = json.loads(request.data.decode("utf-8"))
    is_valid = is_email_valid(email, fast=True)
    return jsonify(is_valid)
@bp.route("/api/register/recovery_option_isinuse", methods=["POST"])
@cors_enabled(methods=["POST"])
def recovery_option_isinuse():
    data : dict = json.loads(request.data.decode("utf-8"))
    info, type_ = data["info"], data["type"]
    user = db.session.get(User, session["register_userid"])
    info = checkout_phone_number(info).phone_number if type_ == "phone" else info
    possession = user.email or user.phone_number
    return jsonify(sum([factor.data == info for factor in user.backup_factors]) > 0 or info == possession)

@bp.route("/api/register/get_country_code", methods=["GET"])
@cors_enabled(methods=["GET"])
def get_country_code():
    user = db.session.get(User, session.get("register_userid"))
    if user and user.phone_number:
        return jsonify(checkout_phone_number(user.phone_number).calling_country_code)
    elif user:
        phones = [factor.data for factor in user.backup_factors if factor.method == "phone"]
        if phones != []:
            return jsonify(checkout_phone_number(phones[0]).calling_country_code)

    ipaddress = get_ipaddress()
    URL = 'https://rdap.db.ripe.net/ip/' + ipaddress
    resp = requests.get(url=URL)
    data = resp.json()
    return jsonify(country_code_to_prefix(data["country"]))

def new_recovery_option_checks(data, type_):
    user = db.session.get(User, session["register_userid"])
    if (type_ == "email"):
        if not is_email_valid(data, fast=True):
            return {"message": "Invalid email address."}, 400
        if data in [factor_.data for factor_ in user.backup_factors] or \
                                                    (data == user.email):
            return {"message": "Already in use by user."}, 400
    elif (type_ == "phone"):
        g.phone = checkout_phone_number(data)
        if not g.phone.valid:
            return {"message": "Invalid phone number."}, 400
        if g.phone.phone_number in [factor_.data for factor_ in user.backup_factors] or \
                                            (g.phone.phone_number == user.phone_number):
            return {"message": "Already in use by user."}, 400
    return {}, 200

@bp.route("/api/register/add_recovery_option", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def add_recovery_option():
    data : dict = json.loads(request.data.decode("utf-8"))
    info, info_type = data["info"], data["infoType"]

    checks_result = new_recovery_option_checks(info, info_type)
    if checks_result[0].get("message"):
        return checks_result

    if info_type == "phone":
        info = g.phone.phone_number

    user = db.session.get(User, session["register_userid"])
    backupfactor = UserBackupFactor(method=info_type, data=info, user=user)
    db.session.add(backupfactor)
    db.session.commit()
    return {"id": backupfactor.id}

@bp.route("/api/register/remove_recovery_option", methods=["POST", "OPTIONS"])
@cors_enabled(methods=["POST"])
def remove_recovery_option():
    data : dict = json.loads(request.data.decode("utf-8"))
    factorid = data["id"]
    user = db.session.get(User, session["register_userid"])
    factor = db.session.get(UserBackupFactor, factorid)
    if factor not in user.backup_factors:
        return {"message": "Backup factor not one of the current user's."}, 400
    db.session.delete(factor)
    db.session.commit()
    return {}

@bp.route("/api/register/edit_recovery_option", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def edit_recovery_option():
    data : dict = json.loads(request.data.decode("utf-8"))
    factorid, new_data = data["id"], data["value"]
    user = db.session.get(User, session["register_userid"])
    factor = db.session.get(UserBackupFactor, factorid)

    if factor not in user.backup_factors:
        return {"message": "Backup factor not one of the current user's."}, 400
    checks_result = new_recovery_option_checks(new_data, factor.method)
    if checks_result[0].get("message"):
        return checks_result

    if factor.method == "phone":
        new_data = g.phone.phone_number

    factor.data = new_data
    db.session.commit()
    return {}


@bp.route("/api/register/get_reg_state", methods=["GET"])
@cors_enabled(methods=["GET"])
def get_reg_state():
    def make_dict(*args):
        return {"username": args[0], "possessionType": args[1], 
                "possession": args[2], "isVerified": args[3], "is2FA": args[4], 
                "isPassword": args[5], "recovery": args[6]}
    user = db.session.get(User, session.get("register_userid", -1))
    if not user:
        return make_dict(None, None, None, None, None, None, None)
    name = user.username
    possession = user.email or user.phone_number
    possession_type = "email" if user.email else "phone"
    is_password = bool(user.password_hash)
    recovery = [{"info": factor.data, "type": factor.method, "id": factor.id} for factor in user.backup_factors]
    return make_dict(name, possession_type, possession, user.is_verified, user.is_2fa, is_password, recovery)
@bp.route("/api/register/finish_registration", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def finish_registration():
    session.pop("register_userid")
    session.pop("register_valid_emails", 1)
    session.pop("register_tokenguesses")
    session.pop("register_info_type")
    session.pop("register_tokentimeoffset")
    session.pop("first_token_sent")
    return {}
