from datetime import date

from structdesign.extensions import db
from structdesign.models import User, UserLoginOption

# def test_new_user(client):
#     """
#     GIVEN a User model
#     WHEN a new user is created
#     THEN check the email, hashed password, and role fields are defined correctly
#     """
#     user = User('patkennedy12@gmail.com', 'FlaskIsAwesome')
#     assert user.email == 'patkennedy13@gmail.com'

# def test_test(client):
#     assert 0


def test_user(client):
    user = User(name="brutha", title="138, Prophet", about="Bane of Vorbis")
    db.session.add(user)
    db.session.commit()

    print(user.__table__.c.date_created, user.date_created)

    assert user.name == "brutha"
    assert user.title == "138, Prophet"
    assert user.about == "Bane of Vorbis"
    assert user.date_created == date.today()
    assert user.display_date_created is True


def test_userloginoption(client):
    loginoption = UserLoginOption(
        info="aliens@rock.com", type="email", precedence=1, isrecovery=False
    )
