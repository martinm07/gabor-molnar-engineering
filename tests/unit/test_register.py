from flask import session
from flask.testing import FlaskClient
from sqlalchemy import select

from structdesign import register
from structdesign.extensions import db
from structdesign.models import User, UserLoginOption


def test_get_session_state(client: FlaskClient):
    with client.session_transaction() as session:
        session["REG-username"] = "seanhorses"
        session["REG-email"] = "campingtrips@alfaproject.org"
        session["REG-password"] = "defc0mpʋͲᛂᚱliterat3死ぬ"
        session["REG-loginmode"] = "password"  # password, twofactorauth, possession
        session["REG-phone"] = "+35847347239"

    response = client.get("register/get_session_state").json

    assert response.get("username") == session.get("REG-username")
    assert response.get("email") == session.get("REG-email")
    assert response.get("password") == session.get("REG-password")
    assert response.get("loginmode") == session.get("REG-loginmode")

    with client.session_transaction() as session2:
        session2.update(session)
        session2.pop("REG-username")
    response = client.get("register/get_session_state").json
    assert response["username"] is None


def test_is_username_valid(client: FlaskClient):
    response = register.is_username_valid("seanhorses")
    assert response["result"] is True

    # Username is less than 3 characters
    response = register.is_username_valid("xt")
    assert response["result"] is False
    assert response["code"] == "UNS"

    # Username is missing
    for name in ["", None]:
        response = register.is_username_valid(name)
        assert response["result"] is False
        assert response["code"] == "UNM"

    # Username is taken
    db.session.add(User(name="seanhorses"))
    db.session.commit()
    response = register.is_username_valid("seanhorses")
    assert response["result"] is False
    assert response["code"] == "UNT"


def test_add_username(client: FlaskClient, monkeypatch):
    def get_resp(username):
        return client.post(
            "register/add_username", data=username, content_type="text/plain"
        ).json

    with client:
        print(get_resp("seanhorses"))
        assert session.get("REG-username") == "seanhorses"

    monkeypatch.setattr(
        register,
        "is_username_valid",
        lambda *a, **k: {"result": False, "code": "PHC"},
    )
    with client:
        response = get_resp("seanhorses2")
        assert session.get("REG-username") != "seanhorses2"
    assert response["result"] is False
    assert response["code"] == "PHC"


def test_is_email_valid():
    response = register.is_email_valid("dm4013290@gmail.com")
    assert response["result"] is True

    # Email is missing
    for email in ["", None]:
        response = register.is_email_valid(email)
        assert response["result"] is False
        assert response["code"] == "EMM"

    # Email isn't valid
    response = register.is_email_valid("test")
    assert response["result"] is False
    assert response["code"] == "EMI"

    # Email is taken
    user = User(name="sean")
    loginopt = UserLoginOption(info="sean@aughtys.ie", type="email", isrecovery=False)
    user.logins_list.append(loginopt)
    db.session.add(user)
    db.session.flush()
    response = register.is_email_valid("sean@aughtys.ie")
    assert response["result"] is False
    assert response["code"] == "EMT"

    # If the login option isn't an email or is a recovery option it doesn't count
    loginopt.type = "phone"
    db.session.flush()
    response = register.is_email_valid("sean@aughtys.ie")
    assert response["result"] is True

    loginopt.type = "email"
    loginopt.isrecovery = True
    db.session.flush()
    response = register.is_email_valid("sean@aughtys.ie")
    assert response["result"] is True


def test_is_password_valid():
    response = register.is_password_valid("abc123sosecure")
    assert response["result"] is True

    for pwd in ["", None]:
        response = register.is_password_valid(pwd)
        assert response["result"] is False
        assert response["code"] == "PWM"


def test_add_email_password(client: FlaskClient, monkeypatch):
    def get_resp(email, password):
        return client.post(
            "/register/add_email_password", json={"email": email, "password": password}
        ).json

    with client:
        # This email address is only valid because in testing we aren't checking the DNS or SMTP servers
        get_resp("sean@aughtys.ie", "abc123")
        assert session.get("REG-email") == "sean@aughtys.ie"
        assert session.get("REG-password") == "abc123"

    monkeypatch.setattr(
        register, "is_email_valid", lambda *a, **k: {"result": False, "code": "PHC"}
    )
    monkeypatch.setattr(register, "is_password_valid", lambda *a, **k: {"result": True})
    with client:
        response = get_resp("sean2@aughtys.ie", "abc1234")
        assert response["result"] is False
        assert response["code"] == "PHC"
        assert session.get("REG-email") != "sean2@aughtys.ie"
        assert session.get("REG-password") != "abc1234"

    monkeypatch.setattr(register, "is_email_valid", lambda *a, **k: {"result": True})
    monkeypatch.setattr(
        register, "is_password_valid", lambda *a, **k: {"result": False, "code": "PHC"}
    )
    with client:
        response = get_resp("sean3@aughtys.ie", "abc12345")
        assert response["result"] is False
        assert response["code"] == "PHC"
        assert session.get("REG-email") != "sean3@aughtys.ie"
        assert session.get("REG-password") != "abc12345"

    monkeypatch.setattr(
        register, "is_email_valid", lambda *a, **k: {"result": False, "code": "PHC"}
    )
    with client:
        response = get_resp("sean@aughtys.ie", "abc123")
        assert response["code"] == "PHCPHC"


def test_set_loginmode(client: FlaskClient):
    pass


def row_exists(table, **kwargs):
    return len(db.session.execute(select(table).filter_by(**kwargs)).all()) == 1


def test_finish_pwd_loginmode(client: FlaskClient):
    with client.session_transaction() as sess:
        sess["REG-username"] = "seanhorses"
        sess["REG-email"] = "sean@bogs.ie"
        sess["REG-password"] = "abc123"
        sess["REG-loginmode"] = "password"

    with client:
        client.post("/register/finish")
        assert "REG-username" not in session
        assert "REG-password" not in session
        assert "REG-loginmode" not in session
        assert "REG-email" not in session
        assert "REG-phone" not in session

    assert row_exists(User, name="seanhorses")
    assert row_exists(
        UserLoginOption,
        info="sean@bogs.ie",
        type="email",
        isloginfactor=False,
        isrecovery=False,
    )
    assert row_exists(
        UserLoginOption,
        info="abc123",
        type="password",
        isloginfactor=True,
        isrecovery=False,
    )


def test_finish_2fa_loginmode(client: FlaskClient):
    with client.session_transaction() as sess:
        sess["REG-username"] = "seanhorses"
        sess["REG-email"] = "sean@bogs.ie"
        sess["REG-password"] = "abc123"
        sess["REG-loginmode"] = "twofactorauth"
        sess["REG-phone"] = "+35847347239"

    with client:
        client.post("/register/finish")
        assert "REG-username" not in session
        assert "REG-password" not in session
        assert "REG-loginmode" not in session
        assert "REG-email" not in session
        assert "REG-phone" not in session

    assert row_exists(User, name="seanhorses")
    assert row_exists(
        UserLoginOption,
        info="sean@bogs.ie",
        type="email",
        isloginfactor=False,
        isrecovery=False,
    )
    assert row_exists(
        UserLoginOption,
        info="abc123",
        type="password",
        isloginfactor=True,
        isrecovery=False,
    )
    assert row_exists(
        UserLoginOption,
        info="+35847347239",
        type="phone",
        isloginfactor=True,
        isrecovery=False,
    )


def test_finish_possession_loginmode(client: FlaskClient):
    # Possession factor works with email
    with client.session_transaction() as sess:
        sess["REG-username"] = "seanhorses"
        sess["REG-email"] = "sean@bogs.ie"
        sess["REG-password"] = "abc123"
        sess["REG-loginmode"] = "possession"

    with client:
        client.post("/register/finish")
        assert "REG-username" not in session
        assert "REG-password" not in session
        assert "REG-loginmode" not in session
        assert "REG-email" not in session

    assert row_exists(User, name="seanhorses")
    assert row_exists(
        UserLoginOption,
        info="sean@bogs.ie",
        type="email",
        isloginfactor=True,
        isrecovery=False,
    )

    # Possession factor works with phone number
    with client.session_transaction() as sess:
        sess["REG-username"] = "seanhorses2"
        sess["REG-phone"] = "+35847347239"
        sess["REG-loginmode"] = "possession"
    with client:
        client.post("/register/finish")
        assert "REG-phone" not in session
    assert row_exists(
        UserLoginOption,
        info="+35847347239",
        type="phone",
        isloginfactor=True,
        isrecovery=False,
    )

    # Possession factor fails from ambiguity with both email and phone number provided
    with client.session_transaction() as sess:
        sess["REG-username"] = "seanhorses3"
        sess["REG-email"] = "seanhorses2@gmail.com"
        sess["REG-phone"] = "+35847347239"
        sess["REG-loginmode"] = "possession"
    client.post("/register/finish").status_code == 400
