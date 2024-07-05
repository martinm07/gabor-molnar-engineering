import datetime

from flask.testing import FlaskClient
from sqlalchemy import select

from structdesign.extensions import db
from structdesign.helper import collection_exists, get_unix_timestamp
from structdesign.models import DocumentTag, GuidanceDocument, documents_schema


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


def populate_tags(num: int, docs, **kwargs) -> list[DocumentTag]:
    def getval(name: str, i: int, default=None):
        return (
            kwargs.get(name)[i]
            if kwargs.get(name) and kwargs.get(name)[i:]
            else default
        )

    blogs = db.session.scalars(select(GuidanceDocument)).all() if not docs else docs

    tags = []
    for i in range(num):
        tag = DocumentTag(
            name=getval("name", i, f"tag{i}"),
            description=getval("description", i, f"tagdescription{i}"),
            accent=getval("accent", "0 0 0"),
        )
        if getval("doc_ids", i):
            doc_ids = getval("doc_ids", i)
            [blog.tags.append(tag) for blog in blogs if blog.id in doc_ids]
        tags.append(tag)
        db.session.add(tag)
    db.session.commit()
    return tags


def import_docs(docs, client):
    docs_ = [
        {
            "id": str(doc.id),
            "title": doc.title,
            "description": doc.description,
            "body": doc.body,
            "date_created": get_unix_timestamp(doc.date_created),
            "tags": [tag.name for tag in doc.tags],
            "doc_id": doc.id,
        }
        for doc in docs
    ]
    client.collections["documents"].documents.import_(docs_, {"action": "create"})


def test_get_latest_blogs(client: FlaskClient):
    populate_blogs(25)
    resp = client.get("documents/get_latest").json
    assert len(resp) == 25

    assert resp[0].get("id")
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

    assert resp[0].get("id")
    assert resp[0].get("title")
    assert resp[0].get("description")
    assert resp[0].get("accent")
    assert resp[0].get("thumbnail")

    tag2 = DocumentTag(name="tag2", description="")
    [doc.tags.append(tag2) for doc in docs[1:]]
    db.session.commit()

    resp = get_resp("tag2")
    assert len(resp) == 4
    assert [f"title{i}" for i in range(1, 5)] == [doc["title"] for doc in resp]


def test_query(client: FlaskClient, typesense_client, mocker):
    def get(**kwargs):
        return client.get("/documents/query", query_string=kwargs).json

    # This is necessary of all tests for all collections they interact with,
    #  in order to maintain test atomicity.
    if collection_exists(typesense_client, "documents"):
        typesense_client.collections["documents"].delete()
    typesense_client.collections.create(documents_schema)

    mocker.patch("structdesign.blog.typesense_client", typesense_client)

    docs = populate_blogs(5)
    import_docs(docs, typesense_client)

    resp = get(q="title1")
    assert len(resp["hits"]) == 1

    docs = populate_blogs(
        5,
        title=[
            "banana muffins",
            "apple shoes",
            "cake",
            "bottle of sake",
            "candy apples",
        ],
        date_created=[
            "2024-06-20",
            "2023-06-20",
            "2024-06-21",
            "2024-05-22",
            "2025-01-01",
        ],
    )
    import_docs(docs, typesense_client)
    resp = get(q="apple", sort="date_created", desc=True)
    assert len(resp["hits"]) == 2
    assert resp["hits"][0]["document"]["title"] == "candy apples"
    assert resp["hits"][1]["document"]["title"] == "apple shoes"


def test_advanced_query(client: FlaskClient, typesense_client, mocker):
    def get(**kwargs):
        return client.get("/documents/advanced_query", query_string=kwargs).json

    if collection_exists(typesense_client, "documents"):
        typesense_client.collections["documents"].delete()
    typesense_client.collections.create(documents_schema)

    mocker.patch("structdesign.blog.typesense_client", typesense_client)

    docs = populate_blogs(5)
    populate_tags(2, docs, doc_ids=[[1, 2, 3], [3, 4]])
    import_docs(docs, typesense_client)

    resp = get(q="title1")
    assert len(resp["hits"]) == 1
    assert len(resp["facet_counts"]) == 1
