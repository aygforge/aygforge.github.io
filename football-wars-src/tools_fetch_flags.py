# One-time build helper: downloads public-domain national flag thumbnails from Wikimedia Commons
# (upload.wikimedia.org) and stores small PNG data URIs in assets/flags.json.
import hashlib, urllib.request, time, json, io, base64, sys
from PIL import Image
FLAGS = {
"NAT_SPAIN":"Flag of Spain.svg","NAT_FRANCE":"Flag of France.svg","NAT_ENGLAND":"Flag of England.svg",
"NAT_PORTUGAL":"Flag of Portugal.svg","NAT_BELGIUM":"Flag of Belgium.svg","NAT_NETHERLANDS":"Flag of the Netherlands.svg",
"NAT_SWITZERLAND":"Flag of Switzerland.svg","NAT_GERMANY":"Flag of Germany.svg","NAT_CROATIA":"Flag of Croatia.svg",
"NAT_ITALY":"Flag of Italy.svg","NAT_NORWAY":"Flag of Norway.svg","NAT_DENMARK":"Flag of Denmark.svg",
"NAT_AUSTRIA":"Flag of Austria.svg","NAT_TURKIYE":"Flag of Turkey.svg","NAT_SWEDEN":"Flag of Sweden.svg",
"NAT_RUSSIA":"Flag of Russia.svg","NAT_UKRAINE":"Flag of Ukraine.svg","NAT_POLAND":"Flag of Poland.svg",
"NAT_HUNGARY":"Flag of Hungary.svg","NAT_WALES":"Flag of Wales.svg","NAT_GREECE":"Flag of Greece.svg",
"NAT_SCOTLAND":"Flag of Scotland.svg","NAT_SERBIA":"Flag of Serbia.svg","NAT_SLOVAKIA":"Flag of Slovakia.svg",
"NAT_CZECHIA":"Flag of the Czech Republic.svg","NAT_SLOVENIA":"Flag of Slovenia.svg","NAT_REPUBLIC_OF_IRELAND":"Flag of Ireland.svg",
"NAT_BOSNIA_AND_HERZEGOVINA":"Flag of Bosnia and Herzegovina.svg","NAT_ROMANIA":"Flag of Romania.svg",
"NAT_ALBANIA":"Flag of Albania.svg","NAT_NORTH_MACEDONIA":"Flag of North Macedonia.svg","NAT_ICELAND":"Flag of Iceland.svg",
"NAT_GEORGIA":"Flag of Georgia.svg","NAT_FINLAND":"Flag of Finland.svg","NAT_KOSOVO":"Flag of Kosovo.svg",
"NAT_ISRAEL":"Flag of Israel.svg","NAT_MONTENEGRO":"Flag of Montenegro.svg","NAT_BULGARIA":"Flag of Bulgaria.svg",
"NAT_BELARUS":"Flag of Belarus.svg","NAT_LUXEMBOURG":"Flag of Luxembourg.svg","NAT_ARMENIA":"Flag of Armenia.svg",
"NAT_KAZAKHSTAN":"Flag of Kazakhstan.svg","NAT_ESTONIA":"Flag of Estonia.svg","NAT_CYPRUS":"Flag of Cyprus.svg",
"NAT_FAROE_ISLANDS":"Flag of the Faroe Islands.svg","NAT_AZERBAIJAN":"Flag of Azerbaijan.svg","NAT_LATVIA":"Flag of Latvia.svg",
"NAT_LITHUANIA":"Flag of Lithuania.svg","NAT_MOLDOVA":"Flag of Moldova.svg","NAT_MALTA":"Flag of Malta.svg",
"NAT_ANDORRA":"Flag of Andorra.svg","NAT_GIBRALTAR":"Flag of Gibraltar.svg","NAT_LIECHTENSTEIN":"Flag of Liechtenstein.svg",
"NAT_SAN_MARINO":"Flag of San Marino.svg"}
UA = "FootballWars-offline-asset-builder/1.0 (one-time build; python-urllib)"
out = {}
for tid, fname in FLAGS.items():
    n = fname.replace(' ', '_')
    h = hashlib.md5(n.encode('utf-8')).hexdigest()
    url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{urllib.parse.quote(n)}/250px-{urllib.parse.quote(n)}.png"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        data = urllib.request.urlopen(req, timeout=30).read()
        im = Image.open(io.BytesIO(data)).convert('RGBA')
        w, hh = im.size; nw = 96; nh = max(1, round(hh * nw / w))
        im = im.resize((nw, nh), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
        out[tid] = {"file": fname, "page": "https://commons.wikimedia.org/wiki/File:" + n,
                    "src": url, "w": nw, "h": nh,
                    "data": "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()}
        print(tid, 'ok', len(b.getvalue()), nw, nh, flush=True)
    except Exception as e:
        print(tid, 'FAIL', e, flush=True)
    time.sleep(1.0)
json.dump(out, open('assets/flags.json', 'w'))
print('total', len(out))
