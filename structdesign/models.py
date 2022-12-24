from datetime import datetime
import secrets
from sqlalchemy.sql import func

from .extensions import db


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    # IMP: the `secret` of a user should NEVER be sent to the frontend
    secret_id = db.Column(db.Integer, db.ForeignKey('usersecrets.id'), nullable=False, unique=True)

    username = db.Column(db.String(50), nullable=False, unique=True)
    avatar_image = db.Column(db.String(256))
    email = db.Column(db.String(100), nullable=True, unique=True)
    phone_number = db.Column(db.String(64), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)

    password_hash = db.Column(db.String(256), nullable=True)
    is_2fa = db.Column(db.Boolean)

    backup_factors = db.relationship("UserBackupFactor", back_populates="user")
    comments = db.relationship("Comment", back_populates="user")
    # phone number, 2FA method, recover data (phone number OR email), recover method

    def __init__(self, username, email=None, phone_number=None):
        if email and phone_number:
            raise AttributeError("A User can't have both an email and phone number.")

        secret = UserSecret()
        db.session.add(secret)
        db.session.commit()

        self.secret_id = secret.id
        self.username = username
        self.email = email
        self.phone_number = phone_number

    def __repr__(self) -> str:
        return f'<User {self.username}>'

class UserSecret(db.Model):
    __tablename__ = 'usersecrets'
    id = db.Column(db.Integer, primary_key=True)
    secret = db.Column(db.String(200))

    def __init__(self):
        self.secret = secrets.token_hex()
    def __repr__(self) -> str:
        return f'<UserSecret {self.secret}>'

class UserBackupFactor(db.Model):
    __tablename__ = 'userrecoveries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    method = db.Column(db.String(16))
    data = db.Column(db.String(128))
    user = db.relationship("User", back_populates="backup_factors")

    def __repr__(self) -> str:
        return f'<UserBackupFactor {self.data}>'

class RequestStamp(db.Model):
    __tablename__ = "requeststamps"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime(timezone=True), server_default=func.now())
    ipaddress = db.Column(db.String(15))
    address_pool = db.Column(db.String(33))
    address_lifespan = db.Column(db.Integer)
    cookie_id = db.Column(db.String(256))
    request = db.Column(db.String(32))

class NewsletterEmail(db.Model):
    __tablename__ = 'newsletteremails'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200))

    def __repr__(self) -> str:
        return f'<NewsletterEmail {self.email}>'

class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)

    time_created = db.Column(db.DateTime)
    is_edited = db.Column(db.Boolean)
    content = db.Column(db.UnicodeText)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user = db.relationship("User", back_populates="comments")

    # to load the comments of a guidance document, it needs to have a list of all the comments on it.
    # each comment also has a list of all comments on *it* (i.e. replies).
    # a comment is either the parent of a guidance document, or a comment, thus the two mutually exclusive (though not officially) foreign keys.
    # our system only wants the "reply hole" to go 1 level deep (i.e. comments and replies, no replies to replies, etc.)
    #  though technically with this structure we the reply hole could go on, recursively, forever.

    # comments
    # parent_comment_id, parent_comment                 # Mutually Exclusive
    # parrent_document_id, parrent_document             # Mutually Exclusive
    parent_comment_id = db.Column(db.Integer, db.ForeignKey("comments.id"), nullable=True)
    #                                    `remote_side` makes it so the "other" side of the relationship is actually here, making a Many to One
    comments = db.relationship("Comment", backref=db.backref("parent_comment", remote_side=[id]))
    parent_document_id = db.Column(db.Integer, db.ForeignKey("documents.id"), nullable=True)
    parent_document = db.relationship("GuidanceDocument", back_populates="comments")


    def __init__(self, content) -> None:
        self.content = content
        self.time_created = datetime.now().astimezone()
        self.is_edited = False

    def __repr__(self) -> str:
        content_char_amount = 15
        return f'<Comment {self.time_created.strftime("%d/%m/%Y %H:%M")} - "'+\
               f'{self.content[:content_char_amount]}{"..." if len(self.content)-1 > content_char_amount else ""}">'
        
# documents and tags have a Many to Many relationship- a document can have many tags and a tag can be on many documents
document_tag = db.Table("document_tag",
    db.Column("document_id", db.Integer, db.ForeignKey("documents.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id"), primary_key=True)
)

class GuidanceDocument(db.Model):
    __tablename__ = 'documents'
    id = db.Column(db.Integer, primary_key=True)
    time_created = db.Column(db.DateTime)
    title = db.Column(db.String(128))
    thumbnail = db.Column(db.String(256))
    content = db.Column(db.UnicodeText)

    comments = db.relationship("Comment", back_populates="parent_document")
    tags = db.relationship("Tag", secondary=document_tag, back_populates="documents")

    def __init__(self, content) -> None:
        self.time_created = datetime.now().astimezone()
        self.content = content

class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(32))
    color = db.Column(db.String(16), default="#fff")
    description = db.Column(db.String(1024))

    documents = db.relationship("GuidanceDocument", secondary=document_tag, back_populates="tags")