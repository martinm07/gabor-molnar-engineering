from typing import Any

from flask.testing import FlaskClient
from sqlalchemy import func, select

from structdesign.extensions import db
from structdesign.models import (
    GuidanceDocument,
    SavedComponent,
    SavedComponentDiff,
    SavedComponentTag,
)

from .populate_dbs import create_component_lib, populate_blogs, populate_components


def test_savedcomponents_currentversion(client: FlaskClient):
    lib = create_component_lib()
    _, ver = populate_components(5, lib)

    resp = client.get("/documents/savedcomponents_currentversion").text

    assert resp == ver


def test_update_components_update(client: FlaskClient):
    lib = create_component_lib()
    comps, ver = populate_components(5, lib)

    def post(version: str, data: dict[str, dict[str, Any]]):
        return client.post(
            "/documents/update_components", json={"version": version, "update": data}
        ).text

    # new_ver = post({comps[0].name: {"name": "altered name"}})
    new_ver = post(
        ver, {comps[0].name: {"name": "altered name", "content": "altered content"}}
    )
    comp = db.session.scalars(select(SavedComponent).filter_by(id=comps[0].id)).first()

    assert comp.content == "altered content"
    assert comp.name == "altered name"
    assert len(new_ver.split(",")) == 5
    assert new_ver != ver
    assert lib.latest_version == new_ver
    assert (
        db.session.scalar(select(func.count("*")).select_from(SavedComponentDiff)) == 1
    )

    new_ver = post(new_ver, {comps[4].name: {"tags": "tag1,tag2"}})
    comp = db.session.scalars(select(SavedComponent).filter_by(id=comps[4].id)).first()

    assert (
        db.session.scalar(select(func.count("*")).select_from(SavedComponentTag)) == 2
    )
    assert len(comp.tags) == 2
    assert lib.latest_version == new_ver

    new_ver = post(new_ver, {comps[3].name: {"tags": "tag2"}})
    assert (
        db.session.scalar(select(func.count("*")).select_from(SavedComponentTag)) == 2
    )


def test_update_components_add(client: FlaskClient):
    def post(data: list[dict[str, Any]]):
        return client.post("/documents/update_components", json={"add": data}).text

    lib = create_component_lib()

    new_ver = post(
        [{"name": "new-comp1", "content": "content", "parts": ["1", "1,1", "2"]}]
    )
    assert new_ver != ""
    assert len(lib.components) == 1
    assert lib.components[0].name == "new-comp1"
    assert lib.components[0].content == "content"
    assert lib.components[0].parts == "1|1,1|2"

    new_ver2 = post(
        [
            {
                "name": "new-comp2",
                "content": "",
                "parts": "1|2",
                "tags": "new-tag1,tag2",
                "description": "desc",
            }
        ]
    )
    assert new_ver2 != new_ver
    print(new_ver2, lib.components)
    # NOTE: This isn't using the get_library_components() function defined in blogcreate
    #       It should still work (that is, get the right component), but if not, this is worth revisiting
    assert lib.components[1].name == "new-comp2"
    assert lib.components[1].parts == "1|2"
    assert lib.components[1].description == "desc"
    assert lib.components[1].tags_str == "new-tag1,tag2"
    assert len(lib.components[1].tags) == 2

    new_ver3 = post(
        [
            {"name": "new-comp3", "content": "", "parts": ""},
            {"name": "new-comp4", "content": "", "parts": ""},
        ]
    )
    assert new_ver3 != new_ver2
    assert len(lib.components) == 4


def test_update_components_remove(client: FlaskClient):
    def post(version: str, data: list[str]):
        resp = client.post(
            "/documents/update_components", json={"version": version, "remove": data}
        )
        return resp.text, resp.status_code

    lib = create_component_lib()
    _, ver = populate_components(5, lib)

    _, code = post("invalid-version", [lib.components[0].name])
    assert code == 400
    assert len(lib.components) == 5

    new_ver, _ = post(ver, [lib.components[0].name])
    assert new_ver != ver
    assert len(lib.components) == 4

    new_ver, _ = post(new_ver, [lib.components[0].name, lib.components[2].name])
    assert new_ver != ver
    assert len(lib.components) == 2


def test_get_component_library(client: FlaskClient):
    def get(ver: str):
        resp = client.get("/documents/get_component_library", query_string={"ver": ver})
        print(resp.status, resp.text)
        return resp.json

    lib = create_component_lib()
    comps, ver = populate_components(5, lib)

    resp = get(ver)

    # We don't include 'tags' in this list because the db and result represent it differently.
    #  We test tags separately at the end.
    keys_filter = ["name", "description", "parts", "content"]

    assert sorted(
        [{k: c[k] for k in c if k in keys_filter} for c in resp],
        key=lambda x: x.get("name", 0),
    ) == sorted(
        [{k: c.__dict__[k] for k in c.__dict__ if k in keys_filter} for c in comps],
        key=lambda x: x.get("name", 0),
    )

    latest_ver = client.post(
        "/documents/update_components",
        json={"version": ver, "update": {comps[0].name: {"content": "altered"}}},
    ).text
    client.post(
        "/documents/update_components",
        json={
            "version": latest_ver,
            "update": {comps[2].name: {"name": "altered2", "tags": "newtag1,tag2"}},
        },
    )

    resp: list[dict[str, Any]] = get(ver)
    print(resp)
    assert [d for d in resp if d["name"] == "name0"][0]["content"] != "altered"
    assert (
        len(
            [d for d in resp if d["name"] == "altered2" and d["tags"] == "newtag1,tag2"]
        )
        == 0
    )


def test_get_component_library_add_remove(client: FlaskClient):
    def get(ver: str):
        resp = client.get("/documents/get_component_library", query_string={"ver": ver})
        print(resp.status, resp.text)
        return resp.json

    lib = create_component_lib()
    comps, ver = populate_components(5, lib)

    # This update translates to
    # comp 1
    # = update comp 2
    # comp 3
    # - remove comp 4
    # - remove comp 5
    # + new comp
    # + new comp
    latest_ver = client.post(
        "/documents/update_components",
        json={
            "version": ver,
            "update": {comps[1].name: {"description": "altered"}},
            "add": [
                {"name": "new-comp", "content": "content", "parts": []},
                {"name": "new-comp2", "content": "", "parts": "1|1,1"},
            ],
            "remove": [comps[3].name, comps[4].name],
        },
    ).text

    resp: list[dict[str, Any]] = get(latest_ver)

    assert resp[1]["description"] == "altered"
    assert resp[3]["name"] == "new-comp"
    assert resp[4]["name"] == "new-comp2"

    resp: list[dict[str, Any]] = get(ver)

    assert resp[1]["description"] != "altered"
    assert resp[3]["name"] != "new-comp"
    assert resp[4]["name"] != "new-comp2"


def test_sync_document_patch(client: FlaskClient):
    docs = populate_blogs(
        5,
        body=[
            "blog3x@mp1econtent",
            "blog3x@mp1econtent",
            "blog3x@mp1econtent",
            "blog3x@mp1econtent",
            "blog3x@mp1econtent",
        ],
    )

    def get_resp(id_: int, patches: list[dict[str, str | int]]):
        return client.post(
            "/documents/sync_document_patch", json={"id": id_, "patches": patches}
        ).text

    resp = get_resp(docs[0].id, [{"index": 0, "value": "R", "length": 1}])
    # document = db.session.scalars(
    #     select(GuidanceDocument).filter_by(id=int(docs[0].id))
    # ).first()
    print(resp)
    document = db.session.get(GuidanceDocument, int(docs[0].id))
    assert document.body == "Rlog3x@mp1econtent"

    get_resp(docs[1].id, [{"index": 0, "value": "P", "length": 3}])
    assert docs[1].body == "Pg3x@mp1econtent"

    get_resp(docs[2].id, [{"index": 3, "value": "pOg", "length": 1}])
    assert docs[2].body == "blopOg3x@mp1econtent"

    get_resp(
        docs[3].id,
        [
            {"index": 3, "value": "pOg1", "length": 4},
            {"index": 5, "value": "42", "length": 0},
        ],
    )
    # The result depends on the order of execution of the change objects
    # I want it executed from highest index first, because I want all indexes to be in reference
    #  to the original string, not one modified from changes at previous indexes
    assert docs[3].body == "blopOg1x@mp1econtent"
    # assert docs[3].body == "blopO42g1mp1econtent"

    get_resp(
        docs[4].id,
        [
            {"index": 8, "value": "it's", "length": 2},
            {"index": 1, "value": "pOg1", "length": 4},
            {"index": 14, "value": "42", "length": 1},
        ],
    )
    assert docs[4].body == "bpOg1x@mit'secon42ent"
