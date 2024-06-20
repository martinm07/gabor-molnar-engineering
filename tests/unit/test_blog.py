import datetime

from flask.testing import FlaskClient

from structdesign.extensions import db
from structdesign.models import GuidanceDocument


def populate_blogs(num: int, **kwargs):
    def getval(name: str, i: int, default=None):
        return (
            kwargs.get(name)[i]
            if kwargs.get(name) and kwargs.get(name)[i:]
            else default
        )

    for i in range(num):
        doc = GuidanceDocument(
            title=getval("title", i, f"title{i}"),
            description=getval("description", i, f"desc{i}"),
            body=getval("body", i, f"body{i}"),
            accent=getval("accent", i, "0 0 0"),
            thumbnail=getval("thumnail", i, "<svg-path>"),
        )
        if getval("date_created", i):
            doc.date_created = datetime.date.fromisoformat(kwargs["date_created"][i])
        db.session.add(doc)
    db.session.commit()


def test_get_latest_blogs(client: FlaskClient):
    populate_blogs(25)
    resp = client.get("guidance_documents/get_latest")
    print(resp)
    print(resp.json)
    resp = resp.json
    assert len(resp) == 25

    assert resp[0].get("title")
    assert resp[0].get("description")
    assert resp[0].get("body")
    assert resp[0].get("accent")
    assert resp[0].get("thumbnail")


def test_get_latest_blogs_paginate(client: FlaskClient):
    resp = client.get(
        "/guidance_documents/get_latest", query_string={"p": 0, "l": 10}
    ).json
    assert len(resp) == 0

    populate_blogs(5)
    resp1 = client.get(
        "/guidance_documents/get_latest", query_string={"p": 0, "l": 10}
    ).json
    assert len(resp1) == 5

    populate_blogs(10)
    resp2 = client.get(
        "/guidance_documents/get_latest", query_string={"p": 0, "l": 10}
    ).json
    assert len(resp2) == 10

    assert resp1 == resp2[:5]

    populate_blogs(5)
    fulllist = client.get(
        "/guidance_documents/get_latest", query_string={"p": 1, "l": 10}
    ).json
    resp1 = client.get(
        "/guidance_documents/get_latest", query_string={"p": 2, "l": 5}
    ).json
    resp2 = client.get(
        "/guidance_documents/get_latest", query_string={"p": 3, "l": 5}
    ).json
    assert resp1 == fulllist[:5]
    assert resp2 == fulllist[5:]


def test_get_latest_blogs_sorts(client: FlaskClient):
    populate_blogs(
        5,
        date_created=[
            "2024-06-20",
            "2023-06-20",
            "2024-06-21",
            "2024-05-22",
            "2025-01-01",
        ],
    )
    resp = client.get("/guidance_documents/get_latest").json
    new_order = [4, 2, 0, 3, 1]
    for i, doc in enumerate(resp):
        assert doc["title"].find(f"{new_order[i]}") != -1


def test_get_blogs_tag(client: FlaskClient):
    assert False
