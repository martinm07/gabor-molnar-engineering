import json

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = "https://developer.mozilla.org"


def get_tags():
    URL = ROOT + "/en-US/docs/Web/HTML/Element/"
    page = requests.get(URL)
    soup = BeautifulSoup(page.content, "html.parser")

    els = []
    for el in soup.select("tr td:first-child, #obsolete_and_deprecated_elements"):
        if el.attrs.get("id") == "obsolete_and_deprecated_elements":
            break
        anchor = el.find("a")
        if not anchor:
            continue
        els.extend(
            [
                {"name": tag.strip()[1:-1], "url": ROOT + anchor["href"]}
                for tag in el.text.split(",")
            ]
        )
    return els


def get_tag_attrs(url: str):
    print(url)
    page = requests.get(url)
    soup = BeautifulSoup(page.content, "html.parser")

    results = soup.find(id="individual_attributes")
    if not results:
        results = soup.find(id="attributes")
    if not results:
        raise Exception(
            f"'{url}' page has no ID 'individual_attributes' or 'attributes'. Possible 404 error."
        )
    section_content: Tag | NavigableString = results.next_sibling.find("dl")
    if not section_content:
        return []

    attributes = [child for child in section_content.children if child.name == "dt"]

    def fix_href(href: str):
        if href.startswith("#"):
            return url + href
        else:
            return ROOT + href

    attributes = [
        {"name": attr.find("code").string, "url": fix_href(attr.find("a")["href"])}
        for attr in attributes
    ]
    return attributes


def get_global_attrs():
    final = []
    for url, id_ in [
        ("/en-US/docs/Web/HTML/Global_attributes", "list_of_global_attributes"),
        (
            "/en-US/docs/Web/Accessibility/ARIA/Attributes",
            "states_and_properties_defined_on_mdn",
        ),
    ]:
        URL = ROOT + url
        page = requests.get(URL)
        soup = BeautifulSoup(page.content, "html.parser")

        results = soup.find(id=id_)
        if not results:
            raise Exception("Page has no ID 'list_of_global_attributes'.")
        dls = [child for child in results.next_sibling.children if child.name == "dl"]
        dts = []
        [
            dts.extend([child for child in dl.children if child.name == "dt"])
            for dl in dls
        ]
        attrs = [
            {"name": attr.string, "url": ROOT + attr.find("a")["href"]} for attr in dts
        ]
        final.extend(attrs)
    return final


tags = get_tags()
all_attrs = [
    {"tag": tag["name"], "url": tag["url"], "attributes": get_tag_attrs(tag["url"])}
    for tag in tags
]
all_attrs.append({"tag": "GLOBAL", "url": "", "attributes": get_global_attrs()})
with open("tag_attributes.json", "w+") as f:
    f.write(json.dumps(all_attrs))
