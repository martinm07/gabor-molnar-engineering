FLASK_APP=structdesign
FLASK_SQLALCHEMY_TRACK_MODIFICATIONS=false
FLASK_SQLACHEMY_ENGINE_OPTIONS={"pool_recycle": 280}
VERIFY_TOKEN_EXPIRE_MINS=120
FLASK_SESSION_TYPE=sqlalchemy
FLASK_SESSION_COOKIE_PARTITIONED=true
FLASK_SESSION_COOKIE_SAMESITE=null
FLASK_SESSION_COOKIE_SECURE=true

FLASK_WTF_CSRF_TIME_LIMIT=null
# https://flask-wtf.readthedocs.io/en/0.15.x/config/
# When true (the default), this checks the Referer header of the request to make sure it matches the host.
# go-away is a reverse proxy sitting in front of our web app in production, and it currently strips the Referer header for
# any request that matches a rule in go-away-policy.yml (passing through all rules without a hit to trigger default behaviour will keep it).
# Looking at the source code, this is because go-away tries to bake the original referer into the URL as a query parameter __goaway_referer,
# so that it can recover it when redirecting traffic from challenge successes. First it strips the Referer header it *would* send in the request,
# then applies the __goaway_referer value from the URL if it finds one. However, for rules that have an `action: pass`, there is no challenge and
# hence no __goaway_referer, so it strips the Referer header without replacing it with anything. There is a PR for this already on the go-away repo:
#  https://git.gammaspectra.live/git/go-away/pulls/34
# however the project seems relatively dead (no activity in over a year). Perhaps picking go-away wasn't the best choice, and I should've gone with Anubis...
FLASK_WTF_CSRF_SSL_STRICT=false

FLASK_PDFPASS_MARKER=GABMOLENG
