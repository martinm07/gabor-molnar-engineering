import pymysql
from dotenv import load_dotenv

from structdesign import create_app

load_dotenv()

pymysql.install_as_MySQLdb()

app = create_app()
