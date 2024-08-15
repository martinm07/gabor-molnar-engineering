import json

import requests

# This scraper needs the list of CSS property names to check to already be provided.
# This has been done by collating the results of calls to 'handlecss.ts's getAllAllowedPropNames()
#  function on multiple browsers, for example with this one-liner:
### Array(...(new Set([...firefoxList, ...chromeList]))).toSorted()
#  and copying the resulting object message into the JSON file


with open("mdn_links.json", "r") as f:
    propnames: list[str | dict[str, str]] = json.load(f)

URL1 = "https://developer.mozilla.org/en-US/docs/Web/CSS/"
URL2 = "https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/"


def get_url(propname: str):
    final_url = None
    for URL in [URL1, URL2]:
        page = requests.get(URL + propname)
        if "page not found" not in page.text.lower():
            final_url = URL + propname
            break
    return {"name": propname, "url": final_url}


nameurls = []
for prop in propnames:
    if isinstance(prop, dict):
        if prop.get("url"):
            nameurls.append(prop)
        elif prop.get("name"):
            # Try again to find a URL
            nameurls.append(get_url(prop["name"]))
            print(nameurls[-1])
    else:
        nameurls.append(get_url(prop))
        print(nameurls[-1])


with open("mdn_links.json", "w+") as f:
    f.write(json.dumps(nameurls))
