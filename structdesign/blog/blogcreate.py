import os

from flask import Blueprint, current_app, render_template, send_from_directory
from sqlalchemy import select

from ..extensions import db
from ..models import GuidanceDocument, SavedComponentLibrary

bp = Blueprint("blogcreate", __name__, url_prefix="/documents")


# If docid does NOT convert to an integer (say you pass in an arbitrary string),
#  Flask will not consider it matching this view at all and return a 404 without calling the function body
@bp.route("/media/<int:docid>/<path:subpath>")
def get_media_file(docid, subpath):
    return send_from_directory(os.path.join(current_app.instance_path, "documentmedia", f"{docid}"), subpath)


@bp.route("/edit/<id>")
def edit_document(id):
    return render_template("blog/create.html", document_or_component_id=id)

@bp.route("/edit/component/<id>")
def edit_component(id):
    return render_template("blog/create.html", document_or_component_id=id)


#####################

@bp.cli.command("create_component_lib_base")
def create_component_lib_base():
    if (
        db.session.scalars(select(SavedComponentLibrary).filter_by(name="base")).first()
        is not None
    ):
        print("Already found component library by the name of 'base'. Doing nothing.")
        return
    base = SavedComponentLibrary(name="base", latest_version="")
    db.session.add(base)
    db.session.commit()
    print("Added new component library with the name of 'base'.")


@bp.cli.command("reset_document_1")
def reset_document_1():
    document = db.session.get(GuidanceDocument, (1, 1))
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
    print("Successfully reset body text of document with ID 1.")
