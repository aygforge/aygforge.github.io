#!/usr/bin/env python3
"""Read-only package preflight. Runs the supplied v2.0 audit against a temporary copy."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from shutil import copytree

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'Kayip_Ufuk_GDD_v2_0'


def main():
    required = [
        'ProductionTruth_v2.0.json', 'ContentIndex_v2.0.json',
        'DB/ItemDB.json', 'DB/RecipeDB.json', 'DB/BuildDB.json',
        'Art/SpriteCatalog.json', 'Art/AtlasLayout.json',
        'Contracts/AcceptanceTests.json', 'Art/AssetAcceptanceTests.json',
        'QA/audit_v20.py',
    ]
    missing = [name for name in required if not (SRC / name).is_file()]
    if missing:
        print('FAIL: referans pakette eksik dosya:', *missing, sep='\n- ')
        return 1
    print('Reference root:', SRC)
    print('Ana kaynak değiştirilmeden statik denetim başlatılıyor.')
    with tempfile.TemporaryDirectory(prefix='kayip-ufuk-check-') as temp:
        dst = Path(temp) / 'spec'
        copytree(SRC, dst)
        process = subprocess.run([sys.executable, str(dst / 'QA/audit_v20.py')], cwd=dst, capture_output=True, text=True)
        print(process.stdout)
        if process.stderr:
            print(process.stderr, file=sys.stderr)
        if process.returncode:
            return process.returncode
        report = json.loads((dst / 'QA/Validation_v2.0.json').read_text(encoding='utf8'))
        if report['failed'] != 0 or report['passed'] != 79:
            print('FAIL: beklenen kaynak denetimi 79/79 değil:', report['passed'], report['failed'])
            return 1
    print('PASS: GDD v2.0 statik kaynak denetimi 79/79. Bu bir oyun/browser testi değildir.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
