import datetime
import functools
import os
import smtplib
import socket
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import urlparse

import click
from flask import (
    Blueprint,
    current_app,
    make_response,
    render_template,
    request,
)
from werkzeug.datastructures import HeaderSet

from .extensions import csrf

bp = Blueprint("tools", __name__)


old_samesite = None


# TODO: Add config for "Partitioned" attribute after Flask adds it: https://github.com/pallets/flask/pull/5499
def cors_enabled(methods=["POST"], allow_credentials=True, development_only=False):
    def decorator(view):
        if (not development_only) or (
            development_only and os.environ.get("FLASK_ENV") == "development"
        ):

            @csrf.exempt
            @functools.wraps(view)
            def wrapped_view(*args, **kwargs):
                global old_samesite
                old_samesite = current_app.config.get("SESSION_COOKIE_SAMESITE")

                current_app.config.update(SESSION_COOKIE_SAMESITE="None")
                if request.method == "OPTIONS":
                    resp = make_response()
                    if allow_credentials:
                        resp.access_control_allow_origin = request.origin
                        resp.vary = HeaderSet(["origin"])
                    else:
                        resp.access_control_allow_origin = "*"
                    resp.access_control_allow_credentials = allow_credentials
                    resp.access_control_allow_headers = HeaderSet(["Content-Type"])
                    resp.access_control_allow_methods = HeaderSet(methods)
                else:
                    resp = make_response(view(*args, **kwargs))
                    if allow_credentials:
                        resp.access_control_allow_origin = request.origin
                        resp.vary = HeaderSet(["origin"])
                    else:
                        resp.access_control_allow_origin = "*"
                    resp.access_control_allow_credentials = allow_credentials
                return resp
        else:

            @functools.wraps(view)
            def wrapped_view(**kwargs):
                return make_response(view(**kwargs))

        return wrapped_view

    return decorator


@bp.teardown_app_request
def reset_session_config(_):
    if old_samesite:
        current_app.config.update(SESSION_COOKIE_SAMESITE=old_samesite)


def host_is_local(host):
    """returns True if the hostname points to the localhost, otherwise False."""
    o = urlparse(host)
    hostname = o.hostname
    port = o.port
    if port is None:
        port = 22  # no port specified, lets just use the ssh port
    hostname = socket.getfqdn(hostname)
    if hostname in ("localhost", "0.0.0.0"):
        return True
    localhost = socket.gethostname()
    localaddrs = socket.getaddrinfo(localhost, port)
    targetaddrs = socket.getaddrinfo(hostname, port)
    for family, socktype, proto, canonname, sockaddr in localaddrs:
        for rfamily, rsocktype, rproto, rcanonname, rsockaddr in targetaddrs:
            if rsockaddr[0] == sockaddr[0]:
                return True
    return False


def country_code_to_prefix(countrycode):
    mapping = {
        "SK": 421,
        "KI": 686,
        "LV": 371,
        "GH": 233,
        "JP": 81,
        "SA": 966,
        "TD": 235,
        "SX": 1,
        "CY": 357,
        "CH": 41,
        "EG": 20,
        "PA": 507,
        "KP": 850,
        "CO": 57,
        "GW": 245,
        "KG": 996,
        "AW": 297,
        "FM": 691,
        "SB": 677,
        "HR": 385,
        "PY": 595,
        "BG": 359,
        "IQ": 964,
        "ID": 62,
        "GQ": 240,
        "CA": 1,
        "CG": 242,
        "MO": 853,
        "SL": 232,
        "LA": 856,
        "OM": 968,
        "MP": 1,
        "DK": 45,
        "FI": 358,
        "DO": 1,
        "BM": 1,
        "GN": 224,
        "NE": 227,
        "ER": 291,
        "DE": 49,
        "UM": 0,
        "CM": 237,
        "PR": 1,
        "RO": 40,
        "AZ": 994,
        "DZ": 213,
        "BW": 267,
        "MK": 389,
        "HN": 504,
        "IS": 354,
        "SJ": 47,
        "ME": 382,
        "NR": 674,
        "AD": 376,
        "BY": 375,
        "RE": 262,
        "PG": 675,
        "SO": 252,
        "NO": 47,
        "CC": 61,
        "EE": 372,
        "BN": 673,
        "AU": 61,
        "HM": 0,
        "ML": 223,
        "BD": 880,
        "GE": 995,
        "US": 1,
        "UY": 598,
        "SM": 378,
        "NG": 234,
        "BE": 32,
        "KY": 1,
        "AR": 54,
        "CR": 506,
        "VA": 39,
        "YE": 967,
        "TR": 90,
        "CV": 238,
        "DM": 1,
        "ZM": 260,
        "BR": 55,
        "MG": 261,
        "BL": 590,
        "FJ": 679,
        "SH": 290,
        "KN": 1,
        "ZA": 27,
        "CF": 236,
        "ZW": 263,
        "PL": 48,
        "SV": 503,
        "QA": 974,
        "MN": 976,
        "SE": 46,
        "JE": 44,
        "PS": 970,
        "MZ": 258,
        "TK": 690,
        "PM": 508,
        "CW": 599,
        "HK": 852,
        "LB": 961,
        "SY": 963,
        "LC": 1,
        "IE": 353,
        "RW": 250,
        "NL": 31,
        "MA": 212,
        "GM": 220,
        "IR": 98,
        "AT": 43,
        "SZ": 268,
        "GT": 502,
        "MT": 356,
        "BQ": 599,
        "MX": 52,
        "NC": 687,
        "CK": 682,
        "SI": 386,
        "VE": 58,
        "IM": 44,
        "AM": 374,
        "SD": 249,
        "LY": 218,
        "LI": 423,
        "TN": 216,
        "UG": 256,
        "RU": 7,
        "DJ": 253,
        "IL": 972,
        "TM": 993,
        "BF": 226,
        "GF": 594,
        "TO": 676,
        "GI": 350,
        "MH": 692,
        "UZ": 998,
        "PF": 689,
        "KZ": 7,
        "GA": 241,
        "PE": 51,
        "TV": 688,
        "BT": 975,
        "MQ": 596,
        "MF": 590,
        "AF": 93,
        "IN": 91,
        "AX": 358,
        "BH": 973,
        "JM": 1,
        "MY": 60,
        "BO": 591,
        "AI": 1,
        "SR": 597,
        "ET": 251,
        "ES": 34,
        "TF": 0,
        "GU": 1,
        "BJ": 229,
        "SS": 211,
        "KE": 254,
        "BZ": 501,
        "IO": 246,
        "MU": 230,
        "CL": 56,
        "MD": 373,
        "LU": 352,
        "TJ": 992,
        "EC": 593,
        "VG": 1,
        "NZ": 64,
        "VU": 678,
        "FO": 298,
        "LR": 231,
        "AL": 355,
        "GB": 44,
        "AS": 1,
        "IT": 39,
        "TC": 1,
        "TW": 886,
        "BI": 257,
        "HU": 36,
        "TL": 670,
        "GG": 44,
        "PN": 0,
        "SG": 65,
        "LS": 266,
        "KH": 855,
        "FR": 33,
        "BV": 0,
        "CX": 61,
        "AE": 971,
        "LT": 370,
        "PT": 351,
        "KR": 82,
        "BB": 1,
        "TG": 228,
        "AQ": 0,
        "EH": 212,
        "AG": 1,
        "VN": 84,
        "CI": 225,
        "BS": 1,
        "GL": 299,
        "MW": 265,
        "NU": 683,
        "NF": 672,
        "LK": 94,
        "MS": 1,
        "GP": 590,
        "NP": 977,
        "PW": 680,
        "PK": 92,
        "WF": 681,
        "BA": 387,
        "KM": 269,
        "JO": 962,
        "CU": 53,
        "GR": 30,
        "YT": 262,
        "RS": 381,
        "NA": 264,
        "ST": 239,
        "SC": 248,
        "CN": 86,
        "CD": 243,
        "GS": 0,
        "KW": 965,
        "MM": 95,
        "AO": 244,
        "MV": 960,
        "UA": 380,
        "TT": 1,
        "FK": 500,
        "WS": 685,
        "CZ": 420,
        "PH": 63,
        "VI": 1,
        "TZ": 255,
        "MR": 222,
        "MC": 377,
        "SN": 221,
        "HT": 509,
        "VC": 1,
        "NI": 505,
        "GD": 1,
        "GY": 592,
        "TH": 66,
    }
    return mapping[countrycode]


@bp.cli.command("emailsend")
@click.argument("subdir")
def emailsend(subdir):
    """Sends a test HTML email from "developing-email/" """
    python_path = "C:/Users/marti/anaconda3/envs/pythongeneral/python.exe"
    script_path = "C:/Users/marti/OneDrive/Desktop/Martin/projects/webmaking_flask/gabor-molnar-engineering/developing-email/send_index.py"
    res = os.system(f"{python_path} {script_path} {subdir}")
    if res == 2:
        print("Script wasn't found.")


@bp.cli.command("emailbuild")
@click.argument("subdir")
def emailbuild(subdir):
    """Builds all the parts of the email into a single file in "templates/" """
    python_path = "C:/Users/marti/anaconda3/envs/pythongeneral/python.exe"
    script_path = "C:/Users/marti/OneDrive/Desktop/Martin/projects/webmaking_flask/gabor-molnar-engineering/developing-email/build_email_file.py"
    res = os.system(f"{python_path} {script_path} {subdir}")
    if res == 2:
        print("Build script wasn't found.")


def find_index(string, substring, end=False):
    if end:
        return string.find(substring) + len(substring)
    else:
        return string.find(substring)


def strip_strings(*args):
    return tuple([str_.strip() for str_ in args])


def send_email_info(email_filename, address, **kwargs):
    email_filename += ".html" if not email_filename.endswith(".html") else ""
    email = render_template(f"email/{email_filename}", **kwargs)

    title = email[
        find_index(email, "<!--emailtitlesection-->", True) : find_index(
            email, "<!--/emailtitlesection-->"
        )
    ]
    text = email[
        find_index(email, "<!--emailplainsection-->", True) : find_index(
            email, "<!--/emailplainsection-->"
        )
    ]
    html = email[
        find_index(email, "<!--emailhtmlsection-->", True) : find_index(
            email, "<!--/emailhtmlsection-->"
        )
    ]
    title, text, html = strip_strings(title, text, html)

    port = 465
    context = ssl.create_default_context()

    sender_email = "info@structural-design.eu"

    message = MIMEMultipart("alternative")
    message["Subject"] = title
    message["From"] = sender_email
    message["To"] = address
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("koala.serveriai.lt", port, context=context) as server:
        server.login(sender_email, "PaledzygavimaiGrafologijos")
        server.sendmail(sender_email, address, message.as_string())
    return


def collection_exists(client, collection_name: str):
    return collection_name in [
        schema["name"] for schema in client.collections.retrieve()
    ]


def get_unix_timestamp(d: datetime.date):
    return int(datetime.datetime(d.year, d.month, d.day).timestamp())
