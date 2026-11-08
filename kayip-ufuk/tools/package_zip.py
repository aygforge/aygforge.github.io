#!/usr/bin/env python3
"""Pack dist/ into Kayip_Ufuk_HTML5_Tam_Surum.zip (index.html at archive root, itch.io HTML5 layout).
Refuses to pack when the delivery precheck has errors or an atlas is missing."""
import json, subprocess, sys, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
OUT = ROOT / 'Kayip_Ufuk_HTML5_Tam_Surum.zip'
pre = subprocess.run([sys.executable, str(ROOT / 'tools/validate_delivery.py')], capture_output=True, text=True)
report = json.loads(pre.stdout)
if report['errors'] or not (DIST / 'index.html').is_file():
    print('PACKAGING REFUSED:', report['errors']); sys.exit(1)
files = sorted(p for p in DIST.rglob('*') if p.is_file())
with zipfile.ZipFile(OUT, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in files:
        z.write(p, p.relative_to(DIST).as_posix())
with zipfile.ZipFile(OUT) as z:
    names = z.namelist(); bad = z.testzip()
assert 'index.html' in names and bad is None
print(f'{OUT.name}: {len(names)} files, {OUT.stat().st_size / 1048576:.2f} MiB, index.html at root, CRC ok')
