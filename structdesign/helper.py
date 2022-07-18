import functools
import os
from flask import make_response, request
from werkzeug.datastructures import HeaderSet

from .extensions import csrf


def cors_enabled(methods=['GET', 'POST'],
                 allow_credentials=True,
                 development_only=False):

    def decorator(view):

        if (not development_only) or (development_only
                                      and os.environ.get('FLASK_ENV')
                                      == 'development'):

            @csrf.exempt
            @functools.wraps(view)
            def wrapped_view(*args, **kwargs):
                if request.method == "OPTIONS":
                    resp = make_response()
                    if allow_credentials:
                        resp.access_control_allow_origin = request.origin
                        resp.vary = HeaderSet(['origin'])
                    else:
                        resp.access_control_allow_origin = "*"
                    resp.access_control_allow_credentials = allow_credentials
                    resp.access_control_allow_headers = HeaderSet(
                        ['Content-Type'])
                    resp.access_control_allow_methods = HeaderSet(methods)
                    return resp
                else:
                    resp = make_response(view(*args, **kwargs))
                    if allow_credentials:
                        resp.access_control_allow_origin = request.origin
                        resp.vary = HeaderSet(['origin'])
                    else:
                        resp.access_control_allow_origin = "*"
                    resp.access_control_allow_credentials = allow_credentials
                    return resp
        else:

            @functools.wraps(view)
            def wrapped_view(**kwargs):
                return make_response(view(**kwargs))

        return wrapped_view

    return decorator

import socket
from urllib.parse import urlparse

def host_is_local(host):
    """returns True if the hostname points to the localhost, otherwise False."""
    o = urlparse(host)
    hostname = o.hostname;
    port = o.port;
    if port is None:
        port = 22  # no port specified, lets just use the ssh port
    hostname = socket.getfqdn(hostname)
    if hostname in ("localhost", "0.0.0.0"):
        return True
    localhost = socket.gethostname()
    localaddrs = socket.getaddrinfo(localhost, port)
    targetaddrs = socket.getaddrinfo(hostname, port)
    for (family, socktype, proto, canonname, sockaddr) in localaddrs:
        for (rfamily, rsocktype, rproto, rcanonname, rsockaddr) in targetaddrs:
            if rsockaddr[0] == sockaddr[0]:
                return True
    return False