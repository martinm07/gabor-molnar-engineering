import pymysql
from dotenv import load_dotenv

# from werkzeug.middleware.proxy_fix import ProxyFix
from structdesign import create_app

load_dotenv()

pymysql.install_as_MySQLdb()

app = create_app()
# TODO: Determine whether there are any proxies in front of the app in production
#        (chiefly Kamal Proxy, or DigitalOcean)
# app.wsgi_app = ProxyFix(app.wsgi_app, 1)
