import secrets

from .extensions import db


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    # IMP: the `secret` of a user should NEVER be sent to the frontend
    secret_id = db.Column(db.Integer, db.ForeignKey('usersecrets.id'), nullable=False, unique=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=True, unique=True)
    phone_number = db.Column(db.String(64), nullable=True)
    password_hash = db.Column(db.String(256), nullable=True)

    twofa_method = db.Column(db.String(32))
    recovery_options = db.relationship("UserRecover")
    # phone number, 2FA method, recover data (phone number OR email), recover method

    def __init__(self, name, email=None, phone_number=None):
        secret = UserSecret()
        db.session.add(secret)
        db.session.commit()

        self.secret_id = secret.id
        self.name = name
        self.email = email
        self.phone_number = phone_number

    def __repr__(self) -> str:
        return f'<User {self.name}>'

class UserSecret(db.Model):
    __tablename__ = 'usersecrets'
    id = db.Column(db.Integer, primary_key=True)
    secret = db.Column(db.String(200))

    def __init__(self):
        self.secret = secrets.token_hex()
    def __repr__(self) -> str:
        return f'<UserSecret {self.secret}>'

class UserRecover(db.Model):
    __tablename__ = 'userrecoveries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    method = db.Column(db.String(16))
    data = db.Column(db.String(128))
    
    def __repr__(self) -> str:
        return f'<UserRecover {self.data}>'

class NewsletterEmail(db.Model):
    __tablename__ = 'newsletteremails'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200))

    def __repr__(self) -> str:
        return f'<NewsletterEmail {self.email}>'