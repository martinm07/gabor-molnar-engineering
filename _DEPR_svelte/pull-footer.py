from bs4 import BeautifulSoup
import re

with open("../structdesign/templates/intro/base.html", "r+", encoding="utf8") as f:
    html_file = f.read()
with open("../structdesign/static/intro/css/general.css", "r+", encoding="utf8") as f:
    css_file : str = f.read()
with open("../structdesign/static/intro/css/general-query.css", "r+", encoding="utf8") as f:
    css_query_file : str = f.read()


soup = BeautifulSoup(html_file, "html.parser")
footer_html : str = soup.find(id="footer").prettify()

footer_css = css_file[css_file.index("/*general.cssFooter309123*/"):css_file.index("/*endGeneral.cssFooter309123*/")]

footer_query = css_query_file[css_query_file.index("/*general-query.cssFooter512241*/"):css_query_file.index("/*endGeneral-query.cssFooter512241*/")]

route_regex = re.compile(r"{{[ ]*url_for\((?P<quotation>\"|')(?P<route>.+?)(?P=quotation)\)[ ]*}}")
matches = [match for match in route_regex.finditer(footer_html)]
matches.reverse()
for match in matches:
    footer_html = footer_html[:match.start()] + "{ globalThis.urlRoutes[\""+ match.group("route") +"\"] }" + footer_html[match.end():]

filepath = "src/shared/lib/Footer.svelte"
with open(filepath, "w") as f:
    f.write(footer_html + "\n<style>\n" + footer_css + footer_query + "\n</style>\n")