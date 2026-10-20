import pymysql
from dotenv import find_dotenv, load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix

from structdesign import create_app

load_dotenv()
load_dotenv(find_dotenv(".flaskenv"))

pymysql.install_as_MySQLdb()

app = create_app()
# The app sits behind three proxies; Kamal-proxy, go-away and nginx
app.wsgi_app = ProxyFix(app.wsgi_app, 3)
