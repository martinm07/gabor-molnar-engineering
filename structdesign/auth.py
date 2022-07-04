from flask import (Blueprint, current_app, flash, g, redirect, render_template,
                   request, session, url_for)
from werkzeug.security import generate_password_hash, check_password_hash

from .extensions import db

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=('GET', 'POST'))
def register():
    if request.method == 'POST':
        pass
    return render_template('auth/register.html')