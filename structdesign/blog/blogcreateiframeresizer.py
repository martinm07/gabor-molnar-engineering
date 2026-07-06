import requests
from bs4 import BeautifulSoup
from flask import Blueprint, Response, render_template, request, stream_with_context

from ..helper import api_view

bp = Blueprint("blogcreateiframeresizer", __name__, url_prefix="/documents")

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
@api_view(admin_required_=False)
def iframeresizer():
    url = request.args.get("url")
    if not url:
        return "'url' search parameter required.", 400
    page = requests.get(url)
    soup = BeautifulSoup(page.content, "html.parser")

    iframeresizer_script = soup.new_tag("script")
    iframeresizer_script["type"] = "text/javascript"
    iframeresizer_script["src"] = "https://cdn.jsdelivr.net/npm/@iframe-resizer/child"
    iframeresizer_script["async"] = ""

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

    # NOTE: We could make the insertion here a little more reliable than depending
    #  on the document to have a head and body tag.
    if (head_tag := soup.head) is not None:
        head_tag.insert(0, serviceworker_script)
    if (body_tag := soup.body) is not None:
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
