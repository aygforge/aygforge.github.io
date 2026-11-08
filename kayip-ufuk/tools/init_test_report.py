#!/usr/bin/env python3
"""Create the factual NOT_RUN test result ledger from the canonical v2.0 catalog."""
import json
from pathlib import Path

R = Path(__file__).resolve().parent.parent
S = R / 'Kayip_Ufuk_GDD_v2_0'
O = R / 'reports/test-results.json'


def main():
    src_runtime = json.loads((S / 'Contracts/AcceptanceTests.json').read_text(encoding='utf8'))
    src_visual = json.loads((S / 'Art/AssetAcceptanceTests.json').read_text(encoding='utf8'))
    previous = {}
    if O.exists():
        previous = json.loads(O.read_text(encoding='utf8'))
    by_prev = {t['id']:t for t in previous.get('runtime', [])+previous.get('visual', [])}
    def keep(t):
        t0 = by_prev.get(t['id'], {})
        return {'id':t['id'], 'priority':t.get('priority','P0'), 'status':t0.get('status','NOT_RUN'), 'evidence':t0.get('evidence', []), 'notes':t0.get('notes','')}
    report = {'sourceVersion':'v2.0', 'runtime':[keep(x) for x in src_runtime['runtimeTests']], 'visual':[keep(x) for x in src_visual['tests']], 'environment':previous.get('environment',{'browser':None,'device':None,'build':'dist'}), 'releaseReady':False}
    O.parent.mkdir(parents=True, exist_ok=True)
    O.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n',encoding='utf8')
    print(f'QA kayıt dosyası hazır: {O}; {len(report["runtime"])} runtime, {len(report["visual"])} görsel (NOT_RUN başlangıcı).')


if __name__=='__main__':
    main()
