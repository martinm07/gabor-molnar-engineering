import re

from flask import (
    Blueprint, render_template, request, jsonify
)
from .extensions import db
from .models import User, NewsletterEmail

bp = Blueprint('home', __name__)

@bp.route('/')
@bp.route('/home')
def home():
    return render_template('intro/home.html', nav_type="home")

@bp.route('/about')
def about():
    return render_template('intro/about.html')

@bp.route("/gallery")
def gallery():
    return render_template("intro/gallery.html", nav_type="home")

@bp.route("/_signup_newsletter")
def signup_newsletter():
    email = request.args.get("email", "", type=str)

    # Check for anything wrong with submission
    news_email_error = ""
    news_success = True
    ## Check if email is missing
    if email == "":
        news_success = False
        news_email_error = "Missing email"
    ## Check if email is valid
    elif re.match(r"""(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])""", email) == None:
        news_success = False
        news_email_error = "Invalid email"

    # If email is present and valid, save email in some database
    if news_success:
        # TODO: Save email to some database
        new_user = NewsletterEmail(email=email.strip())
        db.session.add(new_user)
        db.session.commit()
        print("New valid email accepted to send newsletter to!")

    return jsonify(news_success=news_success, news_error_msgs={"email":news_email_error})

@bp.route('/user/<name>')
def create_user(name):
    user = User(name=name)
    db.session.add(user)
    db.session.commit()

    return 'Created user!'