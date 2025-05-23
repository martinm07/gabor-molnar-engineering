import collections
import json
import re
import urllib.parse
from collections.abc import Iterable
from typing import Any

import requests
from bs4 import BeautifulSoup
from diff_match_patch import diff_match_patch
from flask import Blueprint, Response, render_template, request, stream_with_context
from fnv128a import compute_fnv128a
from sqlalchemy import select

from ..extensions import db
from ..helper import cors_enabled
from ..models import (  # noqa: F401
    GuidanceDocument,
    SavedComponent,
    SavedComponentDiff,
    SavedComponentLibrary,
    SavedComponentTag,
)

"""
blogcreate.py
This module provides a Flask Blueprint for managing and editing document components and guidance documents
within a web application. It includes endpoints for retrieving, updating, and versioning component libraries,
as well as synchronizing and patching document content. Additionally, it offers utilities for integrating
iframe-resizer functionality with cross-origin HTML content.
Blueprint:
    bp (Blueprint): Flask Blueprint registered under the URL prefix "/documents".
Functions:
    onfalsey(val, fallback)
        Returns val if it is truthy, otherwise returns fallback.
    items_equal(a, b)
        Compares two items for equality, supporting strings and iterables.
    get_component_lib()
        Retrieves the base SavedComponentLibrary instance from the database.
    get_version(version: str)
        Retrieves a SavedComponentDiff instance by version string.
    create_version(comps: list[SavedComponent])
        Generates a version hash string for a list of SavedComponent instances.
    apply_diff(components: list[dict[str, Any]], diff: str)
        Applies a diff string to a list of component dictionaries and returns the updated list.
    get_library_components(lib: SavedComponentLibrary)
        Returns the components of a library, sorted by ID for consistency.
    savedcomponents_currentversion()
        GET endpoint: Returns the latest version string of the component library.
    get_component_library()
        GET endpoint: Returns the components of the library at a specified version.
    fill_tag_names(names: str | None)
        Converts a comma-separated string of tag names into a list of SavedComponentTag instances,
        creating new tags as needed.
    update_components()
        POST endpoint: Updates, adds, or removes components in the library, handling versioning and diffs.
    get_document_edit()
        GET endpoint: Retrieves editable fields of a GuidanceDocument by ID.
    sync_document_full()
        POST endpoint: Replaces the full body of a GuidanceDocument.
    sync_document_patch()
        POST endpoint: Applies a list of patch operations to the body of a GuidanceDocument.
    iframeresizer()
        GET endpoint: Fetches an external HTML page, injects iframe-resizer and service worker scripts,
        and returns the modified HTML.
    iframeresizer_serviceworker()
        Serves the JavaScript for the iframe-resizer service worker.
    iframeresizer_cors()
        Proxies HTTP requests to external URLs, forwarding the request and streaming the response back.
    iframeresizer_test()
        Renders a test page for iframe-resizer integration.
Dependencies:
    - Flask
    - SQLAlchemy
    - requests
    - BeautifulSoup
    - diff_match_patch
    - fnv128a
    - Custom models and extensions from the parent package
Notes:
    - The module handles versioning of component libraries using hash-based version strings and diffs.
    - It supports collaborative editing of document content via patch operations.
    - The iframe-resizer integration allows embedding and resizing of cross-origin iframes with injected scripts.
"""

bp = Blueprint("blogcreate", __name__, url_prefix="/documents")


def onfalsey(val, fallback):
    return val if val else fallback


def items_equal(a, b):
    if type(a) is not type(b):
        return False
    if type(a) is str:
        return a == b
    if isinstance(a, Iterable):
        return collections.Counter(a) == collections.Counter(b)
    return a == b


def get_component_lib():
    library = db.session.scalars(
        select(SavedComponentLibrary).filter_by(name="base")
    ).first()
    return library


def get_version(version: str):
    diff = db.session.scalars(
        select(SavedComponentDiff).filter_by(version=version)
    ).first()
    return diff


dmp = diff_match_patch()
dmp.Patch_Margin = 1


def create_version(comps: list[SavedComponent]):
    versions = []
    for comp in comps:
        columns = ["name", "description", "content", "parts", "tags_str"]
        comp_str = "".join([f"{key.upper()}{getattr(comp, key)}" for key in columns])
        bytes_hash = compute_fnv128a(str.encode(comp_str))
        versions.append(bytes_hash.hex())
    return ",".join(versions)


def apply_diff(
    components: list[dict[str, Any]],
    diff: str,
) -> list[dict[str, Any]]:
    final = []
    diffs = diff.split("\\")
    for i, diffparts in enumerate(diffs):

        def find_part(part: str):
            # Matches a string of non-^ (caret) characters preceded by e.g. ^NAME^
            diff_encoded = re.search(r"(?<=\^" + part.upper() + r"\^)[^^]*", diffparts)
            if not diff_encoded:
                return None
            diff_encoded = diff_encoded.group(0)
            return urllib.parse.unquote_plus(diff_encoded)

        if find_part("remove") is not None:
            continue

        final.append({})
        adding = find_part("add") is not None

        for part in ["name", "description", "tags", "parts", "content"]:
            if adding:
                final[-1][part] = find_part(part) or ""
                continue

            # Otherwise, what we have is a diff string

            diff_raw = find_part(part)
            # If this part (property) is not in the diff, then nothing has changed about it
            if not diff_raw:
                final[-1][part] = components[i][part] if i < len(components) else ""
                continue
            patches = dmp.patch_fromText(diff_raw)
            if i < len(components):
                new_content, _ = dmp.patch_apply(patches, components[i][part])
            else:
                new_content, _ = dmp.patch_apply(patches, "")
            final[-1][part] = new_content
    return final


def get_library_components(lib: SavedComponentLibrary) -> list[SavedComponent]:
    """
    Returns a reference to lib.components, after making sure the order is consistent.\n
    WHEN REFFERING TO THE COMPONENTS OF A LIBRARY. ALWAYS USE THIS FUNCTION
    """
    # It seems the order of elements in lib.components is completely consistent across
    #  all instances of the library in the application lifetime (but not across lifetimes,
    #  as the order is not saved in the database)
    # Still, it is vital that the order of components is consistent always, so that diffs
    #  always make sense and never go 'rotten'.
    lib.components.sort(key=lambda x: x.id)
    return lib.components


@bp.route("/savedcomponents_currentversion")
@cors_enabled(methods=["GET"])
def savedcomponents_currentversion():
    return get_component_lib().latest_version


@bp.route("/get_component_library")
@cors_enabled(methods=["GET"])
def get_component_library():
    version = request.args.get("ver")
    if not version:
        return f"Key 'ver' required. Got an empty {type(version)}", 400
    lib = get_component_lib()
    components = [
        {
            "name": comp.name,
            "description": comp.description,
            "tags": comp.tags_str,
            "parts": comp.parts,
            "content": comp.content,
        }
        for comp in get_library_components(lib)
    ]

    if not version or version == lib.latest_version:
        return components

    # The version (of at least one of the components) is not the latest, thus we need to take
    #  steps back in history (of diffs) until we find the requested version(s)

    current = get_version(lib.latest_version)
    current_version = current.version
    comp_versions = version.split(",")

    # ver = current
    # while True:
    #     if not ver:
    #         break

    #     print(ver.version.split(","), " -> ", ver.next_version.split(","))
    #     print("🎈", urllib.parse.unquote_plus(ver.diff))
    #     ver = get_version(ver.next_version)
    # print("---")

    final = [None for _ in range(len(comp_versions))]
    while True:
        current_comp_vers = current_version.split(",")
        for i in range(len(comp_versions)):
            if comp_versions[i] is None:
                continue

            # print(i, len(current_comp_vers), comp_versions[i], current_comp_vers[i])
            # If we have found the match for this part of the version string
            if i < len(current_comp_vers) and comp_versions[i] == current_comp_vers[i]:
                # We cannot outright .pop() these resolved version strings, as that messes up
                #  the indices relative to current_comp_vers
                comp_versions[i] = None
                final[i] = components[i]
        # If all requested versions have been resolved, then finish
        if not any(comp_versions):
            break

        if current is None:
            return (
                f"Version history exhausted without finding the following component versions: {', '.join([ver for ver in comp_versions if ver is not None])}",
                400,
            )

        components = apply_diff(components, current.diff)
        current_version = current.next_version
        # This will be None when at the very base of the library history, but
        #  we should still give one final check before saying the history was exhausted
        # This is why we need a separate current_version variable instead of saying
        #  current.version when defining current_comp_vers at the top of this while loop
        current = get_version(current.next_version)

    print(final)
    return final


# Convert tags_str to list of database instances, creating tags that don't yet exist
def fill_tag_names(names: str | None) -> list[SavedComponentTag]:
    if not names:
        return []
    names_list = names.split(",")
    final: list[SavedComponentTag] = []
    for name in names_list:
        tag = db.session.scalars(select(SavedComponentTag).filter_by(name=name)).first()
        if not tag:
            tag = SavedComponentTag(name=name)
            db.session.add(tag)
        final.append(tag)
    return final


@bp.route("/update_components", methods=["OPTIONS", "POST"])
@cors_enabled()
def update_components():
    """
    Handles updates, additions, and removals of components in the component library.

    This endpoint receives a JSON payload describing which components to update, add, or remove,
    verifies version consistency, applies the requested changes, generates a diff string for versioning,
    and updates the component library accordingly.

    Request (POST/OPTIONS):
        JSON body with the following keys:
            - version (str): The current version string of the component library (required for updates/removals).
            - update (dict): Mapping of component names to dictionaries of updated fields.
                Allowed fields: "name", "description", "content", "parts" (list or str), "tags" (comma-separated str).
            - add (list): List of dictionaries describing new components to add.
                Required fields: "name", "content", "parts" (list or str). Optional: "description", "tags".
            - remove (list): List of component names (str) to remove.

    Returns:
        - 200 OK with the new latest version string if changes were made.
        - 400 Bad Request with an error message if input is invalid or version mismatch occurs.
        - 200 OK with the current latest version string if no changes were made.

    Side Effects:
        - Updates the database with new, updated, or removed components.
        - Creates a new SavedComponentDiff entry for version history.
        - Updates the latest_version field of the component library.

    Example usage:
        POST /documents/update_components
        {
            "version": "abc123,def456",
            "update": {"ComponentA": {"content": "new content"}},
            "add": [{"name": "ComponentB", "content": "body", "parts": ["1"]}],
            "remove": ["ComponentC"]
        }
    """
    data: dict[str, Any] = json.loads(request.data.decode("utf-8"))
    acting_version: str = data.get("version", "")
    # Update: dictionary with names as keys and fields with new values. The following fields are allowed:
    #       "name": Name of the component as a string
    #       "description": Description of the component as a string
    #       "content": Content of the component as a string
    #       "parts": A list of strings of the parts of the component content (e.g. '["1", "1,1", "1,2"]')
    #       "tags": Comma-seperated list of component tag names as a string (e.g. '"tag1,tag2,tag3"')
    update: dict[str, dict[str, str | list[str]]] = data.get("update", {})
    # Add: list of dictionaries with keys like in 'update', for adding new components
    add: list[dict[str, str | list[str]]] = data.get("add", [])
    # Remove: list of strings of the names of components to remove
    remove: list[str] = data.get("remove", [])

    if (len(update) > 0 or len(remove) > 0) and acting_version is None:
        return (
            "'version' key is required when updating components (key 'update' exists) or removing components (key 'remove' exists)",
            400,
        )

    lib = get_component_lib()
    # We need the full component library, not just the ones that will be updated/removed,
    #  so that we may generate the correct diff and version string at the end
    components = get_library_components(lib)

    lib_version = lib.latest_version.split(",")
    acting_versions = acting_version.split(",")
    try:
        # If the component is one the user wants to update/remove, then we check that their version is correct
        vers_correct = [
            lib_version[i] == acting_versions[i]
            for i, comp in enumerate(components)
            if update.get(comp.name) or comp.name in remove
        ]
        if not all(vers_correct):
            errors = [
                f"'({components[i].name}' where {acting_versions[i][:8]} != {lib_version[i][:8]})"
                for i, correct in enumerate(vers_correct)
                if not correct
            ]
            return (
                f"Cannot update or remove components that aren't on their latest version. Attempted ('component' where PROVIDED_VERSION != LATEST_VERSION): {'  '.join(errors)}",
                400,
            )
    except IndexError:
        # The acting_versions may be smaller than the lib_version list
        return (
            f"Attempted to update or remove components without a provided version; provided version list (length {len(acting_versions)}) was shorter than latest version list (length {len(lib_version)})",
            400,
        )

    modified = False
    diff_parts = []

    for comp in components:
        diff_parts.append({})

        if comp.name in remove:
            # Remember, the diffs should be telling us how to get back to older versions,
            #  not how to get to this newer version
            diff_parts[-1]["ADD"] = ""
            for attr in ["name", "description", "content", "parts"]:
                diff_parts[-1][attr] = getattr(comp, attr)
            diff_parts[-1]["tags"] = comp.tags_str

            # The object will still exist in the lib.components list until committed, which
            #  luckily means no potentially weird stuff with the for loop
            db.session.delete(comp)
            modified = True
            # No need to potentially update this component when we are removing it
            continue

        comp_new_data = update.get(comp.name)
        if not comp_new_data:
            continue

        for attr in ["name", "description", "content", "parts"]:
            newval = comp_new_data.get(attr)
            if newval is not None and attr == "parts":
                newval = "|".join(newval)

            curval = getattr(comp, attr)

            if newval is not None and newval != curval:
                modified = True
                setattr(comp, attr, newval)
                diff_parts[-1][attr] = dmp.patch_toText(dmp.patch_make(newval, curval))

        # Handle "tags" separately
        newval = comp_new_data.get("tags")
        curval = comp.tags_str
        if newval is not None and newval != curval:
            modified = True
            # The order when we request "tags" is unreliable, thus we need to separate
            #  table column "tags_str" that gives the order. It's also useful for being
            #  the same as what's generated from the diffs
            comp.tags_str = newval
            comp.tags = fill_tag_names(newval)
            diff_parts[-1][attr] = dmp.patch_toText(dmp.patch_make(newval, curval))

    for new_comp_data in add:
        if (
            new_comp_data.get("name") is None
            or new_comp_data.get("content") is None
            or new_comp_data.get("parts") is None
        ):
            return (
                f"'name', 'content' and 'parts' are required when adding new components. Attempted to add {new_comp_data}",
                400,
            )
        if type(new_comp_data["parts"]) is list:
            new_comp_data["parts"] = "|".join(new_comp_data["parts"])

        new_comp = SavedComponent(
            name=new_comp_data.get("name"),
            description=new_comp_data.get("description", ""),
            content=new_comp_data.get("content"),
            parts=new_comp_data.get("parts"),
            tags=fill_tag_names(new_comp_data.get("tags")),
            tags_str=new_comp_data.get("tags", ""),
            library=lib,
        )
        # This will make the assumption that the new component will have the highest ID and so
        #  *should* appear at the end. Perhaps more shaky an assumption is that when adding
        #  multiple components at once, the given IDs by SQLAlchemy will monotonically ascend
        #  with the order in which we are appending them to lib.components
        db.session.add(new_comp)
        diff_parts.append({"REMOVE": ""})
        modified = True

    if not modified:
        return lib.latest_version

    # Create new SavedComponentDiff with
    #  version: newly created components version hash
    #  next_version: the current latest version of the library
    #  diff: patch string to get from new values to old values

    diff_str = "\\".join(
        [
            "".join(
                [
                    f"^{key.upper()}^{urllib.parse.quote_plus(val)}"
                    for key, val in dict_.items()
                ]
            )
            for dict_ in diff_parts
        ]
    )
    new_version = create_version(components)

    diff = SavedComponentDiff(
        version=new_version, next_version=lib.latest_version, diff=diff_str
    )
    db.session.add(diff)

    # Update latest_version of the library
    lib.latest_version = new_version

    db.session.commit()

    return lib.latest_version


@bp.route("/get_document_edit")
@cors_enabled(methods=["GET"])
def get_document_edit():
    id_ = int(request.args.get("id"))
    doc = db.session.get(GuidanceDocument, id_)
    return {
        "id": doc.id,
        "title": doc.title,
        "description": doc.description,
        "body": doc.body,
        "accent": doc.accent,
        "thumbnail": doc.thumbnail,
        "tags": [tag.name for tag in doc.tags],
        "status": doc.status,
    }


@bp.route("/sync_document_full", methods=["OPTIONS", "POST"])
@cors_enabled()
def sync_document_full():
    data = json.loads(request.data.decode("utf-8"))
    id_: int = data.get("id")
    if id_ is None:
        return "Missing required 'id' key", 400
    body: str = data.get("body")
    if body is None:
        return "Missing required 'body' key", 400

    document = db.session.get(GuidanceDocument, int(id_))
    document.body = body
    db.session.commit()
    return ""


@bp.route("/sync_document_patch", methods=["OPTIONS", "POST"])
@cors_enabled()
def sync_document_patch():
    """
    Synchronizes a guidance document's content by applying a list of patch operations.
    This endpoint expects a JSON payload with the following structure:
        {
            "id": int,                # The ID of the guidance document to patch (required)
            "patches": [              # A list of patch objects (required)
                {
                    "index": int,     # The starting index in the document body to apply the patch (required)
                    "length": int,    # The number of characters to replace (optional, defaults to 0)
                    "value": str      # The string to insert at the specified index (optional, defaults to "")
                },
                ...
            ]
        }
    The function applies each patch in reverse order of their indices to avoid index shifting issues.
    Each patch replaces `length` characters at `index` with `value`.
    Returns:
        - The updated document content as a string on success.
        - A 400 error with a descriptive message if required data is missing or invalid.
    """
    data = json.loads(request.data.decode("utf-8"))
    id_: int = data.get("id")
    if not id_:
        return "Missing required 'id' key", 400
    patches: list[dict[str, str | int]] = data.get("patches", "")

    # print(patches)
    if type(patches) is not list:
        return "'patches' must be an array", 400

    # document = db.session.scalars(
    #     select(GuidanceDocument).filter_by(id=int(id_))
    # ).first()
    document = db.session.get(GuidanceDocument, int(id_))
    if not document:
        return f"No guidance document of id '{id_}'", 400
    content = document.body
    old_len = len(content)

    # Sync the content of a document by sending a minimal amount of data
    #  for the server to then figure out how to patch in.
    # To speed up this view more it would be cool if database syncs could be "debounced"
    #  someway, though this is probably beyond scope (would involve an in-memory db e.g. Redis, DragonFly, Valkey)

    # patch_str will be set up as a list of change objects, each one with the content to insert, the index
    #  to insert it at, and how many characters to replace
    # patches.sort(key=lambda x: x.get("index", float("inf")), reverse=True)
    print(patches)
    for patch in patches:
        value = patch.get("value", "")
        length = patch.get("length", 0)
        index = patch.get("index")
        if type(index) is not int:
            return "Each patch object requires an index", 400
        content = content[:index] + value + content[index + length :]

    print(f"Content length: {old_len} -> {len(content)}")
    document.body = content
    db.session.commit()

    return content


@bp.route("/reset_114", methods=["GET"])
def reset_114():
    document = db.session.get(GuidanceDocument, 114)
    if document:
        document.body = """<h1>Introducing a Light, Visual HTML Editor</h1>
<p>
  Embracing HTML and CSS directly, rather than overshadow it with our own
  limited, unintuitive idea of document editing.
</p>
<div>
  <p>
    <em>Lorem ipsum</em> dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
    incididunt ut labore et dolore magna aliqua. Gravida in fermentum et
    sollicitudin ac orci phasellus. Ultricies integer quis auctor elit sed
    vulputate mi sit amet. Ultrices sagittis orci a scelerisque purus semper eget
    duis at. Sociis natoque penatibus et magnis dis parturient. Ac odio tempor
    orci dapibus ultrices in. Accumsan sit amet nulla facilisi morbi tempus
    iaculis urna. Commodo nulla facilisi nullam vehicula ipsum a arcu. Quam nulla
    porttitor massa id neque aliquam vestibulum. Parturient montes nascetur
    ridiculus mus mauris vitae <strong>ultricies</strong>. Vitae elementum curabitur vitae nunc sed
    velit dignissim sodales ut. Odio pellentesque diam volutpat commodo sed
    egestas. Et ligula ullamcorper malesuada proin libero nunc consequat interdum.
    Pretium fusce id velit ut. Pellentesque habitant morbi tristique senectus. Sit
    amet luctus venenatis lectus magna fringilla urna porttitor.
  </p>
  <p>
    Massa placerat duis ultricies lacus sed turpis tincidunt id. Nunc faucibus a
    pellentesque sit amet porttitor. Tellus molestie nunc non blandit massa enim.
    Mauris rhoncus aenean vel elit scelerisque mauris pellentesque pulvinar
    pellentesque. Diam volutpat commodo sed egestas egestas fringilla phasellus.
    Eget sit amet tellus cras. Curabitur vitae nunc sed velit dignissim sodales ut
    eu. Sed velit dignissim sodales ut eu sem integer vitae. Nunc sed blandit
    libero volutpat. Cursus sit amet dictum sit amet justo donec enim diam. Magnis
    dis parturient montes nascetur ridiculus mus. Consequat id porta nibh
    venenatis cras sed. Risus feugiat in ante metus dictum at tempor. Justo eget
    magna fermentum iaculis. Quis blandit turpis cursus in hac habitasse.
  </p>
</div>
<p>
  Faucibus turpis in eu mi bibendum neque. Elementum curabitur vitae nunc sed.
  Adipiscing tristique risus nec feugiat in fermentum posuere. Nec tincidunt
  praesent semper feugiat nibh sed. Elit scelerisque mauris pellentesque
  pulvinar pellentesque habitant morbi tristique senectus. Lorem ipsum dolor sit
  amet consectetur. Arcu vitae elementum curabitur vitae nunc sed velit
  dignissim. Elementum integer enim neque volutpat ac tincidunt vitae. Libero
  justo laoreet sit amet cursus sit amet. In ante metus dictum at tempor.
  Curabitur vitae nunc sed velit dignissim. Augue interdum velit euismod in.
  Commodo quis imperdiet massa tincidunt nunc pulvinar. Magnis dis parturient
  montes nascetur ridiculus. Lectus urna duis convallis convallis tellus id
  interdum. A condimentum vitae sapien pellentesque habitant morbi tristique
  senectus. Ultricies integer quis auctor elit sed. Suspendisse faucibus
  interdum posuere lorem ipsum dolor sit. Et malesuada fames ac turpis egestas
  maecenas <em>pharetra</em> convallis.
</p>
<img src="/intro/home/img1.png">
<p>
  Mi sit amet mauris commodo quis imperdiet massa tincidunt nunc. Nisl purus in
  mollis nunc sed id. In aliquam sem fringilla ut morbi. Tincidunt augue
  interdum velit euismod. At imperdiet dui accumsan sit amet nulla. Erat velit
  scelerisque in dictum. Sodales ut eu sem integer vitae justo eget magna
  fermentum. Luctus venenatis lectus magna fringilla urna. Lacus laoreet non
  curabitur gravida arcu ac tortor. Lobortis scelerisque fermentum dui faucibus
  in ornare. Quisque id diam vel quam elementum pulvinar etiam non quam. Vivamus
  at augue eget arcu dictum varius duis.
</p>"""
        db.session.commit()
    return ""


## http://localhost:5000/documents/iframeresizer?url=https://www.desmos.com/calculator/g7izucn6nn

# IFRAME-RESIZER: https://iframe-resizer.com/
# For using iframe-resizer on iframes, it needs a specific script tag in the child HTML document.
#  This route provides a helper for doing that on cross-origin domains where we don't otherwise
#  control the content. This route will have the server read the provided url, parse it, and inject
#  the iframe-resizer child script tag and return the resulting page.
# Since all resources called upon by the HTML file (e.g. css/js files, images, etc.) may
#  (and probably will be) same-origin with relative urls like "/resources/styles.css", this route
#  also needs to inject another script tag to install a Serice Worker that intercepts all network
#  requests and modifies them to instead fetch from the originally provided page url.
# Furthermore, since requests made cross-origin by JavaScript "fetch"s and the like are heavily
#  restricted by browsers unless the server explicitly provides the correct response headers,
#  the Service Worker will first try to make the CORS request, but if it fails, it will try again
#  by forwarding the request to our "/documents/iframeresizer_cors" route to have the server make it
#  instead. This will obviously not include any of the cookie and whatnot data that the user would
#  have for the page (and e.g. let the user log into their Google account through this route), and
#  there's literally nothing we can do about that without creating an XSS attack.
# This service of forwarding requests to our server (both in the inital page read and parse as well
#  as subsequently forwarded CORS requests) can get quite costly in a hurry. So we should be wary of
#  the potential premium we're paying for cross-origin iframe-resizer integration.


@bp.route("/iframeresizer")
@cors_enabled(methods=["GET"])
def iframeresizer():
    url = request.args.get("url")
    if not url:
        return "'url' search parameter required.", 400
    page = requests.get(url)
    soup = BeautifulSoup(page.content, "html.parser")

    iframeresizer_script = soup.new_tag("script")
    iframeresizer_script["type"] = "text/javascript"
    iframeresizer_script["src"] = "https://cdn.jsdelivr.net/npm/@iframe-resizer/child"
    iframeresizer_script["async"] = True

    serviceworker_script = soup.new_tag("script")
    serviceworker_script["type"] = "text/javascript"
    serviceworker_script.string = """
const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
        try {
        const registration = await navigator.serviceWorker.register(
            "/documents/iframeresizer_serviceworker.js",
            {
            scope: "/documents/iframeresizer",
            }
        );
        if (registration.installing) {
            console.log("Service worker installing");
        } else if (registration.waiting) {
            console.log("Service worker installed");
        } else if (registration.active) {
            console.log("Service worker active");
        }
        } catch (error) {
        console.error(`Registration failed with ${error}`);
        }
    }
};

registerServiceWorker();
"""

    head_tag = soup.head
    head_tag.insert(0, serviceworker_script)
    body_tag = soup.body
    body_tag.insert(-1, iframeresizer_script)

    return str(soup)


@bp.route("/iframeresizer_serviceworker.js")
def iframeresizer_serviceworker():
    content = render_template("blog/iframeresizer_sw.js")
    return Response(content, mimetype="application/javascript")


@bp.route(
    "/iframeresizer_cors",
    methods=[
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "DELETE",
        "CONNECT",
        "OPTIONS",
        "TRACE",
        "PATCH",
    ],
)
def iframeresizer_cors():
    url = request.args.get("url")
    if not url:
        return "'url' search parameter required.", 400

    # Prepare and send the external request using the same method and data
    # We filter the Host header to let .prepare() fill it in for us, since the
    #  value should be the domain of the server receiving the request (which would
    #  be wrong when forwarding the request).
    esreq = requests.Request(
        method=request.method,
        url=url,
        headers={key: value for key, value in request.headers if key != "Host"},
        data=request.get_data(),
    )

    session = requests.Session()
    resp = session.send(esreq.prepare(), stream=True)

    # Use Flask's Response object to stream the content back to the client
    # Note, iter_content() automatically decoded "gzip" and "deflate" transfer encodings,
    #  which is why we must filter the Content-Encoding response header to let Flask
    #  fill in the blank.
    #  https://requests.readthedocs.io/en/latest/user/quickstart/#raw-response-content
    def generate():
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                yield chunk

    # Adjust headers to avoid conflicts
    # Since we're chunking and streaming the response ourselves, the headers used for
    #  streaming (i.e. "Transfer-Encoding" and "Content-Length") should be left out
    #  to be filled in by Flask.
    headers = [
        (name, value)
        for (name, value) in resp.headers.items()
        if name.lower()
        not in ["content-encoding", "transfer-encoding", "content-length"]
    ]

    return Response(
        stream_with_context(generate()), status=resp.status_code, headers=headers
    )


@bp.route("/iframeresizer_test")
def iframeresizer_test():
    return render_template("blog/iframeresizer_test.html")
