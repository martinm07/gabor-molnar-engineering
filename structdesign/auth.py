from math import ceil
import os
import time
import json
from urllib.parse import urljoin
import warnings
import smtplib, ssl
from markupsafe import escape
from flask import (Blueprint, current_app, flash, g, redirect, render_template, request, session,
                   url_for, jsonify, )
from werkzeug.security import generate_password_hash, check_password_hash
from flask_wtf.csrf import CSRFError
import hashlib
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from twilio.base.exceptions import TwilioException

from .extensions import db
from .models import User, UserSecret, UserRecover
from .helper import cors_enabled, host_is_local

bp = Blueprint("auth", __name__)

try:
    account_sid = os.environ.get("FLASK_TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("FLASK_TWILIO_AUTH_TOKEN")
    client = Client(account_sid, auth_token)
except TwilioException:
    warnings.warn("No credentials and thus no Twilio client created.")


@bp.route('/register')
def register():
    return render_template("auth/register.html")

@bp.route('/auth/twiml_voice/<text>')
def twiml_voice(text):
    resp = VoiceResponse()
    resp.say(text)
    return str(resp)

def send_sms(number, text):
    message = client.messages.create(
        messaging_service_sid="MGb29522b3d4037ba35b366e6f0c9f0334", body=text, to=number
    )
    return message.sid
@bp.route("/send_voice", methods=["GET", "POST"]) # TEMP URL ROUTE
def send_voice(text="Hello world, this was generated on a Python Flask server.", to="+353877211985", from_="+19706458553"):
    if host_is_local(request.url_root):
        url = "http://legoboy7.pythonanywhere.com/auth/twiml_voice/" + text.replace(" ", "%20")
    else:
        url = urljoin(request.url_root, url_for('auth.twiml_voice', text=text))
    
    client.calls.create(
        url=url,
        to=to,
        from_=from_
    )
    return "Call sent! " + url

def token_penalty(attempt_num):
    retry_timeouts = {
        1: 30,
        2: 40,
        3: 60,
        4: 90,
        5: 120
    }
    return retry_timeouts.get(attempt_num, 600)
def token_attempt(method):
    print(session.get("attempt_num"), session.get("last_attempt"), session.get("tokentimeoffset"))
    no_penalty_methods = ["email"]
    last_attempt = session.get("last_attempt", 0.)
    attempt_num = session.get("attempt_num", 0)
    if method not in no_penalty_methods and time.time() - token_penalty(attempt_num) <= last_attempt:
        return False

    user = User.query.get(session["user_id"])
    if method in ["sms", "voice"]:
        session["twofa_data"] = user.phone_number
    elif method in ["email"]:
        session["twofa_data"] = user.email
    else:
        session["twofa_data"] = None

    if session["twofa_data"] == None:
        print("No data")
        return True # Stop here; no penalty time but no data

    session["last_attempt"] = time.time()
    session["attempt_num"] = attempt_num + 1
    session["twofa_method"] = method

    if method in ["email"]:
        session["last_attempt"] = 0
        # If this is `0` then session.get() recognizes it as nothing, and uses default instead.
        session["attempt_num"] = 1 

    curtime = int(time.time())
    expire_time = float(os.environ["VERIFY_TOKEN_EXPIRE_MINS"]) * 60
    # Number of minutes (including decimal) from last time token would normally change
    session["tokentimeoffset"] = (curtime % expire_time) / 60

    return True

sha256 = lambda x: hashlib.sha256(str.encode(x)).hexdigest()
def compute_token():
    """
    Take current time and registering user's details (user salt) to generate a hash.
    "Time" only updates once every SMS_VERIFY_EXPIRE minutes.
    """
    user = User.query.get(session.get("user_id"))
    secret = UserSecret.query.get(user.secret_id)
    curtime = str(int(
        (time.time() / 60 - session["tokentimeoffset"])
        // float(os.environ["VERIFY_TOKEN_EXPIRE_MINS"])
    ))
    method = session.get("twofa_method")
    data = user.phone_number if method in ["sms", "voice"] else user.email
    # Token changes if 2fa method or phone number/email change, or when some time passes
    token = str(int(sha256(secret.secret + curtime + method + data), 16))[-7:]  # int(..., 16) converts hex to decimal
    print(curtime, token)
    return token

def get_method_type(method):
    return "number" if method in ["sms", "voice"] else "email" if method in ["email"] else None

@bp.route("/api/register_details", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def register_details():
    if request.method == "POST":
        try:
            data: dict = json.loads(request.data.decode("utf-8"))
        # <ERROR HANDLING>
        except BaseException:
            return {"message": "Unable to decode accepted data"}, 400

        if type(data) != dict:
            return {"message": "Decoded data was not object of key/value pairs"}, 400

        required_fields = ["username", "email", "phonenumber"]
        missing_fields = set(required_fields).difference(set(data.keys()))
        if len(missing_fields) != 0:
            return {
                "message": "Missing fields in accepted data! Not found: "
                + str(missing_fields)
            }, 400

        email = data["email"] if data["email"] != "" else None
        phonenumber = data["phonenumber"] if data["phonenumber"] != "" else None

        name_taken = json.loads(is_name_taken(data["username"]).data.decode('utf-8'))
        if name_taken['is_taken']:
            return {"message": f"[username_taken] User of name \"{data['username']}\" already exists in database."}, 400
        email_taken = json.loads(is_email_taken(data["email"]).data.decode('utf-8'))
        if email_taken['is_taken']:
            return {"message": f"[email_taken] Email \"{data['email']}\" already exists in database."}, 400
        
        if phonenumber:
            number = client.lookups.v2.phone_numbers(data["phonenumber"]).fetch()
            if not number.valid:
                return {"message": "[invalid_phone] Invalid phone number."}, 400
        # </ERROR HANDLING>
        try:
            time.sleep(4)
            if session.get("user_id") and session.get("registering"):
                # Update user
                new_user = User.query.get(session.get("user_id"))

                if (new_user.email != email and new_user.twofa_method == "email") or \
                    (new_user.phone_number != phonenumber and new_user.twofa_method in ["sms", "voice"]):
                    new_user.twofa_method = None

                new_user.name = data["username"]
                new_user.email = email
                new_user.phone_number = phonenumber
            else:
                new_user = User(data["username"], email, phonenumber)
            db.session.add(new_user)
            db.session.commit()

            session["user_id"] = new_user.id
            session["registering"] = True
            # if data['secondfactor'] == 'sms':
            #     send_sms(data['phonenumber'],
            #              'Here is your verification token: ' + compute_token())
            return {"foo": "bar", "baz": session.get("user_id")}

        except Exception as err:
            return {"message": err.__str__()}, 500
@bp.route("/api/is_taken/username/<username>")
@cors_enabled(methods=["GET"])
def is_name_taken(username):
    name = getattr(User.query.filter_by(name=username).first(), "name", None)
    current_name = getattr(User.query.get(session.get("user_id")), "name", "")
    print(name != current_name, name, current_name)
    if name and (name != current_name or not session.get("registering")):
        return {"is_taken": True}
    else:
        return {"is_taken": False}
@bp.route("/api/is_taken/email/<email>")
@cors_enabled(methods=["GET"])
def is_email_taken(email):
    email = getattr(User.query.filter_by(email=email).first(), "email", None)
    current_email = getattr(User.query.get(session.get("user_id")), "email", "")
    if email and (email != current_email or not session.get("registering")):
        return {"is_taken": True}
    else:
        return {"is_taken": False}
@bp.route("/api/register_get_details", methods=["OPTIONS", "GET"])
@cors_enabled(methods=["GET"])
def register_get_details():
    if not session.get("registering"):
        return {"messsage": "Not registering a new account."}, 403
    if not session.get("user_id"):
        return {"message": "No user ID found in cookie storage"}, 400
    
    user = User.query.get(session.get("user_id"))
    return {"username": user.name, "email": user.email, "phonenumber": user.phone_number}


@bp.route("/api/register_add_password", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def register_add_password():
    if request.method == "POST":
        try:
            if not session.get("registering"):
                return {"messsage": "Not registering a new account."}, 403
            data: dict = json.loads(request.data.decode("utf-8"))

            user = User.query.get(session["user_id"])
            if user.password_hash != None:
                return {"message": "Password has already been set."}, 400
            user.password_hash = generate_password_hash(data["password"])
            db.session.add(user)
            db.session.commit()
            return {"passwords_hash": user.password_hash}
        except Exception as err:
            return {"message": err.__str__()}, 500

@bp.route("/api/send_token_sms", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def send_token_sms():
    if request.method == "POST":
        try:
            if not session.get("registering"):
                return {"messsage": "Not registering a new account."}, 403
            if not token_attempt("sms"):
                return {"message": "Buffer time still active, thus not sending token."}, 403
            if not session.get("twofa_data"):
                return {"message": "[no_phone] No phone number was provided!"}, 400
            
            # send_sms(session["twofa_data"],
            #          "Here is your verification token: " + compute_token())

            number = client.lookups.v2.phone_numbers(session["twofa_data"]).fetch()
            return {"buffer_penalty": token_penalty(session.get("attempt_num")), 
                    "twofa_data": number.national_format, "twofa_method": "sms"}
        except Exception as err:
            return {"message": err.__str__()}, 500
@bp.route("/api/send_token_voice", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def send_token_voice():
    if request.method == "POST":
        try:
            if not session.get("registering"):
                return {"messsage": "Not registering a new account."}, 403
            if not token_attempt("voice"):
                return {"message": "Buffer time still active, thus not sending token."}, 403
            if not session.get("twofa_data"):
                return {"message": "[no_phone] No phone number was provided!"}, 400

            code = "   ".join(list(compute_token()))
            send_voice("Here is your verification token: " + code, to=session["twofa_data"])

            number = client.lookups.v2.phone_numbers(session["twofa_data"]).fetch()
            return {"buffer_penalty": token_penalty(session.get("attempt_num")), 
                    "twofa_data": number.national_format , "twofa_method": "voice"}
        except Exception as err:
            return {"message": err.__str__()}, 500
@bp.route("/api/send_token_email", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def send_token_email():
    if request.method == "POST":
        try:
            if not session.get("registering"):
                return {"messsage": "Not registering a new account."}, 403
            if not token_attempt("email"):
                return {"message": "Buffer time still active, thus not sending token."}, 403
            if not session.get("twofa_data"):
                return {"message": "[no_email] No email was provided!"}, 400
            
            return {"buffer_penalty": -1, "twofa_data": session["twofa_data"], "twofa_method": "email"}
        except Exception as err:
            return {"message": err.__str__()}, 500
@bp.route("/api/send_token_nothing", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def send_token_nothing():
    if not session.get("registering"):
        return {"messsage": "Not registering a new account."}, 403
    session["twofa_method"] = "nothing"
    user = User.query.get(session.get("user_id"))
    user.twofa_method = "nothing"
    db.session.add(user)
    db.session.commit()
    return {}

@bp.route("/api/check_token", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def check_token():
    if request.method == "POST":
        try:
            if not session.get("registering"):
                return {"messsage": "Not registering a new account."}, 403
            data: dict = json.loads(request.data.decode("utf-8"))
            
            token_valid = data["token"] == compute_token()
            if token_valid:
                user = User.query.get(session.get("user_id"))
                user.twofa_method = session.get("twofa_method")
                db.session.add(user)
                db.session.commit()

            if not token_valid:
                return {"message": "[incorrect_token] Incorrect token."}
            return {"token_valid": token_valid}
        except Exception as err:
            return {"message": err.__str__()}, 500

@bp.route("/api/register_get_secure", methods=["OPTIONS", "GET"])
@cors_enabled(methods=["GET"])
def register_get_secure():
    if not session.get("registering"):
        return {"messsage": "Not registering a new account."}, 403
    if not session.get("user_id"):
        return {"message": "No user ID found in cookie storage"}, 400
    
    # if session.get("attempt_num"):
    #     session.pop("attempt_num")
    is_password_made = bool(User.query.get(session["user_id"]).password_hash)
    is_token_sent = bool(session.get("attempt_num", False)) # If a token has been sent
    is_2fa_made = bool(User.query.get(session["user_id"]).twofa_method)

    if is_token_sent:
        retry_buffer = token_penalty(session["attempt_num"]) - ceil(time.time() - session["last_attempt"])
    else:
        retry_buffer = 0

    twofa_method = session.get("twofa_method")
    twofa_data = session.get("twofa_data")
    if twofa_method in ["sms", "voice"]:
        twofa_data = client.lookups.v2.phone_numbers(twofa_data).fetch().national_format

    return {"is_password_made": is_password_made, "is_token_sent": is_token_sent,"is_2fa_made": is_2fa_made, 
            "retry_buffer": retry_buffer, "twofa_data": twofa_data, "twofa_method": twofa_method}


@bp.route("/api/register_recovery", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def register_recovery():
    if not session.get("registering"):
        return {"messsage": "Not registering a new account."}, 403
    user = User.query.get(session.get("user_id"))
    try:
        data: dict = json.loads(request.data.decode("utf-8"))
    except BaseException:
        return {"message": "Unable to decode accepted data"}, 400
    try:
        recover_method = data["recovermethod"]
        recover_type = get_method_type(recover_method)
        if recover_type == "number":
            number = client.lookups.v2.phone_numbers(data["phonenumber"]).fetch()
            if not number.valid:
                return {"message": "[invalid_phone] Invalid phone number."}, 400
            number_inuse = json.loads(is_number_inuse(data["phonenumber"]).data.decode('utf-8'))
            if number_inuse["is_inuse"]:
                return {"message": "[number_inuse] Phone number has already been registered for normal 2FA."}, 400
            
            recover_data = data["phonenumber"]
        elif recover_type == "email":
            email_inuse = json.loads(is_email_inuse(data["email"]).data.decode('utf-8'))
            if email_inuse["is_inuse"]:
                return {"message": "[email_inuse] Email has already been registered for normal 2FA."}, 400
            
            recover_data = data["email"]
        recovery = UserRecover(method=recover_method, data=recover_data)
        user.recovery_options.append(recovery)
        db.session.add(recovery, user)
        db.session.commit()
        return { "data": number.national_format if recover_type == "number" else recover_data,
                 "method": recover_method, "id": recovery.id }

    except Exception as err:
        return {"message": err.__str__()}, 500
@bp.route("/api/is_inuse/email/<email>")
@cors_enabled(methods=["GET"])
def is_email_inuse(email):
    if not session.get("user_id"):
        return {"message": "No current user"}, 400
    user = User.query.get(session.get("user_id"))
    datatype = "number" if user.twofa_method in ["sms", "voice"] else "email"

    if datatype != "email":
        return {"is_inuse": False}
    if user.email == email:
        return {"is_inuse": True}
    return {"is_inuse": False}
@bp.route("/api/is_inuse/number/<number>")
@cors_enabled(methods=["GET"])
def is_number_inuse(number):
    if not session.get("user_id"):
        return {"message": "No current user"}, 400
    user = User.query.get(session.get("user_id"))
    datatype = "number" if user.twofa_method in ["sms", "voice"] else "email"

    if datatype != "number":
        return {"is_inuse": False}
    if user.phone_number == number:
        return {"is_inuse": True}
    return {"is_inuse": False}
@bp.route('/api/delete_recovery', methods=['OPTIONS', 'POST'])
@cors_enabled(methods=['POST'])
def delete_recovery():
    if not session.get("registering"):
        return {"messsage": "Not registering a new account."}, 403
    try:
        data: dict = json.loads(request.data.decode("utf-8"))
    except BaseException:
        return {"message": "Unable to decode accepted data"}, 400
    recovery = UserRecover.query.get(int(data['id']))
    db.session.delete(recovery)
    db.session.commit()
    return {}

@bp.route("/api/register_get_recovery", methods=["OPTIONS", "GET"])
@cors_enabled(methods=["GET"])
def register_get_recovery():
    if not session.get("registering"):
        return {"messsage": "Not registering a new account."}, 403
    if not session.get("user_id"):
        return {"message": "No user ID found in cookie storage"}, 400
    
    user = User.query.get(session.get("user_id"))
    return jsonify([{"data": opt.data, "method": opt.method, "id": opt.id} 
                    for opt in user.recovery_options])

@bp.route("/api/finish_registration", methods=["OPTIONS", "POST"])
@cors_enabled(methods=["POST"])
def finish_registration():
    try:
        session["user_id"]; session["twofa_method"]; session["registering"]
        user = User.query.get(session["user_id"])
        if not (user.password_hash and user.twofa_method):
            raise Exception()
        for key in ["twofa_method", "registering", "twofa_data", "attempt_num", "last_attempt", "tokentimeoffset"]:
            session.pop(key, None)
        return {}
    except Exception as err:
        return {"message": err.__str__()}, 500


@bp.errorhandler(CSRFError)
@cors_enabled()
def handle_csrf_error(e):
    if request.path.find("/api/") != -1:
        return {"message": e.description}, 400
    return e.description, 400


########################################################


def send_email(email):
    message = """\
Subject: Hi there

This message is sent from Python."""
    port = 465
    password = "_devaccount_"

    context = ssl.create_default_context()
    # with smtplib.SMTP_SSL("smtp.gmail.com", port, context=context) as server:
    #     server.login("dm4013290@gmail.com", password)
    #     # Send email

    port = 587
    try:
        server = smtplib.SMTP("smtp.gmail.com", port)
        server.ehlo() # Can be omitted
        server.starttls(context=context) # Secure the connection
        server.ehlo() # Can be omitted
        server.login("dm4013290@gmail.com", password)
        
        server.sendmail("dm4013290@gmail.com", email, message)
    except Exception as e:
        # Print any error messages to stdout
        print(e)
    finally:
        server.quit() 
    return

@bp.route("/email")
def email():
    send_email("martin.github07@gmail.com")
    return "Email sent!"
