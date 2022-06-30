from flask import (
    Blueprint, render_template
)
from .extensions import db
from .models import User

bp = Blueprint('home', __name__)

@bp.route('/')
@bp.route('/home')
def home():
    return render_template('intro/home.html')

@bp.route('/about')
def about():
    return render_template('intro/about.html')

@bp.route('/user/<name>')
def create_user(name):
    user = User(name=name)
    db.session.add(user)
    db.session.commit()

    return 'Created user!'