from flask.testing import FlaskClient
from pytest_mock import MockerFixture

from structdesign.helper import collection_exists, get_unix_timestamp
from structdesign.models import (
    documents_schema,
)

from .populate_dbs import populate_blogs, populate_tags


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


def test_query(client: FlaskClient, typesense_client, mocker: MockerFixture):
    def get(**kwargs):
        return client.get("/documents/query", query_string=kwargs).json

    # This is necessary of all tests for all collections they interact with,
    #  in order to maintain test atomicity.
    if collection_exists(typesense_client, "documents"):
        typesense_client.collections["documents"].delete()
    typesense_client.collections.create(documents_schema)

    mocker.patch("structdesign.blog.blogsearch.typesense_client", typesense_client)

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


def test_advanced_query(client: FlaskClient, typesense_client, mocker: MockerFixture):
    def get(**kwargs):
        return client.get("/documents/advanced_query", query_string=kwargs).json

    if collection_exists(typesense_client, "documents"):
        typesense_client.collections["documents"].delete()
    typesense_client.collections.create(documents_schema)

    mocker.patch("structdesign.blog.blogsearch.typesense_client", typesense_client)

    docs = populate_blogs(5)
    populate_tags(2, docs, doc_ids=[[1, 2, 3], [3, 4]])
    import_docs(docs, typesense_client)

    resp = get(q="title1")
    assert len(resp["hits"]) == 1
    assert len(resp["facet_counts"]) == 1
