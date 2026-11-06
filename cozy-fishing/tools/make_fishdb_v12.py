#!/usr/bin/env python3
"""FishDB v1.1 + genişleme türleri -> FishDB v1.2 (her bölge 10 tür, her nokta ağırlığı tam 100)."""
import json, os, copy
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = json.load(open(os.path.join(ROOT, 'src/data/CozyFishing_FishDB_v1.1.json'), encoding='utf-8'))
def F(id, name, reg, price, power, band, wx, baits, L, W, season, enc):
    return {"id": id, "name_tr": name, "home_region": reg, "base_price": price, "power": power, "minimum_rod_power": max(1, power - 1),
            "preferred_cast_band": band, "weather_boost": wx, "favored_baits": baits,
            "size_game_range": {"length_cm": L, "weight_kg": W}, "season_boost": season, "season_modifier": 1.15 if season else 1.0,
            "sprite_key": "fish_" + id, "silhouette_key": "fish_" + id + "_silhouette", "encyclopedia_tr": enc}
NEW = [
 F("hamsi","Hamsi","sakin_liman",12,1,"near","cloudy",["basic","worm"],[8,16],[0.005,0.03],"winter","Küçük, ince ve gümüş renkli bir sürü balığı. Soğuk aylarda kıyıya yaklaşan sürüleri bilinir."),
 F("kaya_baligi","Kaya balığı","sakin_liman",15,1,"near","rain",["worm","basic"],[8,18],[0.01,0.12],None,"Taşların arasında saklanan, benekli ve iri başlı küçük bir balık. İskele dibinde sık görülür."),
 F("sarpan","Sarpan","sakin_liman",24,2,"mid","sunny",["basic","shrimp"],[15,40],[0.1,1.2],"summer","Gövdesindeki altın sarısı çizgilerle tanınır. Sığ sularda yosun otlayarak dolaşır."),
 F("iskorpit","İskorpit","sakin_liman",30,2,"far","cloudy",["shrimp","fish"],[10,30],[0.05,0.6],"autumn","Dikenli yüzgeçleri ve kamuflajlı kızıl kahve rengiyle kayalara karışır. Dikkatli tutmak gerekir."),
 F("kupes","Kupes","yesil_koy",25,1,"near","sunny",["basic","worm"],[12,30],[0.05,0.4],"spring","İri gözlü, sarımsı çizgili bir sürü balığı. Koyların sığ sularında hareketli gruplar oluşturur."),
 F("mirmir","Mırmır","yesil_koy",36,2,"near","rain",["worm","shrimp"],[15,45],[0.1,1.4],None,"Gümüşi gövdesindeki koyu dikey çizgilerle tanınır. Kumlu dipleri burnuyla eşeler."),
 F("dil_baligi","Dil balığı","yesil_koy",55,2,"far","fog",["worm","shrimp"],[20,60],[0.1,2.5],"winter","Uzun oval yassı gövdesi ve kuma uyumlu rengiyle dipte gizlenir. Lezzetiyle ünlüdür."),
 F("minakop","Minakop","yesil_koy",52,3,"far","cloudy",["shrimp","fish"],[25,90],[0.3,9],"autumn","Çenesindeki kısa bıyığı ve eğik dalgalı çizgileriyle ayırt edilir. Akşamüstü kıyıya yaklaşır."),
 F("hanos","Hanos","kayalik_adalar",44,2,"near","sunny",["shrimp","worm"],[10,30],[0.05,0.4],"summer","Karnındaki mavi leke ve yanlarındaki koyu bantlarla renkli bir kaya balığıdır."),
 F("kirlangic","Kırlangıç","kayalik_adalar",66,3,"mid","wind",["shrimp","fish"],[20,70],[0.2,5],None,"Mavi kenarlı kocaman göğüs yüzgeçleri kanat gibi açılır. Dipte bu yüzgeçlerle yürüyebilir."),
 F("lahoz","Lahoz","kayalik_adalar",88,3,"mid","cloudy",["fish","shrimp"],[25,80],[0.3,8],"spring","Kuyruğa yakın altın sarısı lekesiyle tanınan bir orfoz akrabası. Mağaramsı kayalıkları sever."),
 F("orfoz","Orfoz","kayalik_adalar",145,4,"far","fog",["fish","deep"],[40,140],[1,40],None,"Kayalık derinliklerin iri, sabırlı avcısı. Benekli kahverengi gövdesiyle oyuklara saklanır."),
 F("tirsi","Tirsi","serin_akintilar",52,2,"near","rain",["lure","basic"],[25,55],[0.2,1.8],"spring","Sırtı mavimsi, yanları gümüşi bir sürü balığı. Yanındaki koyu benek sırasıyla tanınır."),
 F("dulger","Dülger","serin_akintilar",98,3,"mid","cloudy",["fish","shrimp"],[20,60],[0.3,3.5],None,"İnce ve derin gövdesinin ortasında yuvarlak koyu bir leke taşır. Uzun sırt dikenleri dikkat çeker."),
 F("kalkan","Kalkan","serin_akintilar",120,3,"far","fog",["fish","deep"],[30,90],[0.5,14],"winter","Neredeyse yuvarlak, yassı ve sırtı kemik düğmeli bir dip balığı. Değerli bir avdır."),
 F("sarikuyruk","Sarıkuyruk","serin_akintilar",175,4,"far","wind",["lure","fish"],[50,170],[2,50],"summer","Gözünden kuyruğuna uzanan kehribar renkli bantlı, çok güçlü bir avcı."),
 F("kapelin","Kapelin","sisli_kuzey",48,1,"near","fog",["basic","worm"],[10,22],[0.01,0.06],"spring","Soğuk sularda dev sürüler oluşturan küçük, yeşilimsi bir balık. Kuzeyin besin zincirinin temelidir."),
 F("topak_baligi","Topak balığı","sisli_kuzey",85,2,"near","cloudy",["shrimp","worm"],[20,55],[0.4,5],"spring","Yuvarlak, düğmeli gövdesi ve karnındaki vantuzla kayalara tutunur. Sevimli görünümlüdür."),
 F("kizil_levrek","Kızıl levrek","sisli_kuzey",98,2,"mid","fog",["fish","shrimp"],[25,60],[0.3,4],None,"Parlak kırmızı rengi ve iri gözleriyle derin ve soğuk suların balığıdır."),
 F("kurt_baligi","Kurt balığı","sisli_kuzey",135,3,"far","wind",["fish","deep"],[50,140],[1.5,20],"winter","Güçlü çeneleri ve köpek dişleriyle kabuklu avları kırar. Gri gövdesinde koyu bantlar bulunur."),
 F("mavi_cerrah","Mavi cerrah balığı","gunes_adalari",86,2,"near","sunny",["basic","shrimp"],[12,30],[0.1,0.6],None,"Canlı mavi gövdesi ve sarı kuyruğuyla resiflerin en renkli balıklarından biridir."),
 F("papagan_baligi","Papağan balığı","gunes_adalari",95,2,"near","sunny",["shrimp","basic"],[20,60],[0.3,4],"summer","Gaga gibi birleşik dişleriyle mercan yosunlarını kemirir. Yeşil, mavi ve pembe tonlarda parlar."),
 F("mercan_hanisi","Mercan hanisi","gunes_adalari",125,3,"mid","cloudy",["fish","shrimp"],[20,45],[0.3,1.8],None,"Kırmızı gövdesine serpiştirilmiş mavi beneklerle süslü küçük bir orfoz türü."),
 F("dev_trevally","Dev trevally","gunes_adalari",195,4,"far","wind",["lure","fish"],[50,170],[3,70],"summer","Resif kenarlarının iri ve inatçı avcısı. Dik alnı ve gümüşi gövdesiyle tanınır."),
 F("cizgili_orkinos","Çizgili orkinos","derin_mavi",190,3,"near","sunny",["lure","fish"],[40,100],[1.5,20],"summer","Karnındaki koyu boyuna çizgilerle tanınan, hızlı ve sürü halinde dolaşan küçük bir orkinos."),
 F("pervane_baligi","Pervane balığı","derin_mavi",240,4,"mid","sunny",["deep","fish"],[80,250],[30,500],None,"Kuyruğu kesilmiş gibi görünen yuvarlak dev gövdesiyle yüzeyde güneşlenir. Dünyanın en ağır kemikli balıklarındandır."),
 F("opah","Opah","derin_mavi",275,4,"mid","fog",["deep","fish"],[70,180],[10,90],"winter","Disk şeklindeki gümüşi kırmızı gövdesi ve beyaz beneklerle süslüdür. Kırmızı yüzgeçleri parlar."),
 F("mavi_marlin","Mavi marlin","derin_mavi",480,5,"far","sunny",["lure","deep"],[150,430],[40,400],"summer","Mızrak gibi üst çenesi ve kobalt mavisi sırtıyla açık denizin efsanevi avıdır."),
]
db = copy.deepcopy(src)
db["schema_version"] = "design-1.2"
db["notes"] = db["notes"] + ["v1.2 genişlemesi: her bölgeye 4 yeni gerçek tür eklendi (toplam 70). Noktaların eski ağırlıkları orantılı küçültüldü; her nokta yine tam 100 eder."]
db["fish"] += NEW
by_reg = {}
for f in NEW: by_reg.setdefault(f["home_region"], []).append(f)
for r in db["regions"]: r["fish_ids"] += [f["id"] for f in by_reg[r["id"]]]
BAND_IDX = {"near": 0, "mid": 1, "far": 2}
for s in db["spots"]:
    reg = s["region_id"]; si = [x["id"] for x in db["spots"] if x["region_id"] == reg].index(s["id"])
    new = by_reg[reg]; share = 26.0
    raw = {}
    for f in new:
        d = abs(BAND_IDX[f["preferred_cast_band"]] - si)
        raw[f["id"]] = [1.0, 0.6, 0.3][d] * {1: 1.3, 2: 1.0, 3: 0.75, 4: 0.5, 5: 0.35}[f["power"]]
    tot = sum(raw.values()); want = {k: share * v / tot for k, v in raw.items()}
    for k in s["weights"]: want[k] = s["weights"][k] * (100 - share) / 100
    fl = {k: max(1, int(v)) for k, v in want.items()}
    rem = 100 - sum(fl.values())
    order = sorted(want, key=lambda k: -(want[k] - int(want[k])))
    i = 0
    while rem != 0:
        k = order[i % len(order)]
        if rem > 0: fl[k] += 1; rem -= 1
        elif fl[k] > 1: fl[k] -= 1; rem += 1
        i += 1
    s["weights"] = fl
    assert sum(fl.values()) == 100, s["id"]
out = os.path.join(ROOT, 'src/data/CozyFishing_FishDB_v1.2.json')
json.dump(db, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(len(db["fish"]), "tür;", [ (s["id"], sum(s["weights"].values())) for s in db["spots"][:3]])
