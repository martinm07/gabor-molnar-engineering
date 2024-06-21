import datetime

from flask.testing import FlaskClient

from structdesign.extensions import db
from structdesign.models import DocumentTag, GuidanceDocument


def populate_blogs(num: int, **kwargs) -> list[GuidanceDocument]:
    def getval(name: str, i: int, default=None):
        return (
            kwargs.get(name)[i]
            if kwargs.get(name) and kwargs.get(name)[i:]
            else default
        )

    docs = []
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
        docs.append(doc)
        db.session.add(doc)
    db.session.commit()
    return docs


def test_get_latest_blogs(client: FlaskClient):
    populate_blogs(25)
    resp = client.get("documents/get_latest")
    print(resp)
    print(resp.json)
    resp = resp.json
    assert len(resp) == 25

    assert resp[0].get("title")
    assert resp[0].get("description")
    assert resp[0].get("accent")
    assert resp[0].get("thumbnail")


def test_get_latest_blogs_paginate(client: FlaskClient):
    resp = client.get("/documents/get_latest", query_string={"p": 0, "l": 10}).json
    assert len(resp) == 0

    populate_blogs(5)
    resp = client.get("/documents/get_latest", query_string={"p": 0, "l": 0}).json
    assert len(resp) == 0

    resp1 = client.get("/documents/get_latest", query_string={"p": 0, "l": 10}).json
    assert len(resp1) == 5
    resp1 = client.get("/documents/get_latest", query_string={"l": 10}).json
    assert len(resp1) == 5

    populate_blogs(10)
    resp2 = client.get("/documents/get_latest", query_string={"p": 0, "l": 10}).json
    assert len(resp2) == 10

    assert resp1 == resp2[:5]

    populate_blogs(5)
    fulllist = client.get("/documents/get_latest", query_string={"p": 1, "l": 10}).json
    resp1 = client.get("/documents/get_latest", query_string={"p": 2, "l": 5}).json
    resp2 = client.get("/documents/get_latest", query_string={"p": 3, "l": 5}).json
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
    resp = client.get("/documents/get_latest").json
    new_order = [4, 2, 0, 3, 1]
    for i, doc in enumerate(resp):
        assert doc["title"].find(f"{new_order[i]}") != -1


def test_get_tagnames(client: FlaskClient):
    resp = client.get("/documents/get_tagnames").json
    iter(resp)
    assert len(resp) == 0

    [db.session.add(DocumentTag(name=f"tag{i}", description="")) for i in range(5)]
    db.session.commit()
    resp = client.get("/documents/get_tagnames").json
    assert len(resp) == 5


def test_get_blogs_tag(client: FlaskClient):
    def get_resp(name: str):
        return client.get("/documents/get_blogs_tag", query_string={"name": name}).json

    resp = get_resp("nonexistent")
    assert len(resp) == 0

    docs = populate_blogs(5)
    tag1 = DocumentTag(name="tag1", description="")
    [doc.tags.append(tag1) for doc in docs[:4]]
    db.session.commit()

    resp = get_resp("tag1")
    assert len(resp) == 4

    tag2 = DocumentTag(name="tag2", description="")
    [doc.tags.append(tag2) for doc in docs[1:]]
    db.session.commit()

    resp = get_resp("tag2")
    assert len(resp) == 4
    assert [f"title{i}" for i in range(1, 5)] == [doc["title"] for doc in resp]
