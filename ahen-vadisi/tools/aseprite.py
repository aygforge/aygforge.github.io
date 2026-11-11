#!/usr/bin/env python3
"""Basit .aseprite okuyucu (yalnız geliştirme aracı, Pillow gerekir).

Görünür normal katmanları birleştirip her kareyi RGBA görüntü olarak verir; etiketleri (tag) ve kare sürelerini okur.
Desteklenen: RGBA / gri / indeksli renk, ham ve zlib sıkıştırılmış cel, bağlantılı cel. Kullanım:
    from aseprite import load
    doc = load('x.aseprite')   # doc['frames'] (PIL.Image listesi), doc['tags'] [{name, from, to}], doc['durations']
    python3 tools/aseprite.py x.aseprite   → etiket listesini yazar
"""
import struct
import sys
import zlib
from PIL import Image


def load(path):
    data = open(path, 'rb').read()
    _size, magic, nframes, w, h, depth = struct.unpack_from('<IHHHHH', data, 0)
    if magic != 0xA5E0:
        raise ValueError('aseprite dosyası değil')
    transparent_index = data[28]
    pos = 128
    layers, tags, palette, durations = [], [], [(0, 0, 0, 0)] * 256, []
    cels = []  # her kare için [(layer, x, y, opacity, image)]
    for fi in range(nframes):
        fsize, fmagic, old_chunks, dur = struct.unpack_from('<IHHH', data, pos)
        new_chunks = struct.unpack_from('<I', data, pos + 12)[0]
        nchunks = new_chunks or old_chunks
        durations.append(dur)
        p = pos + 16
        frame_cels = []
        for _ in range(nchunks):
            csize, ctype = struct.unpack_from('<IH', data, p)
            body = data[p + 6:p + csize]
            if ctype == 0x2004:  # katman
                flags, ltype, child, _dw, _dh, blend, opacity = struct.unpack_from('<HHHHHHB', body, 0)
                nlen = struct.unpack_from('<H', body, 16)[0]
                name = body[18:18 + nlen].decode('utf-8', 'replace')
                layers.append({'name': name, 'visible': bool(flags & 1), 'type': ltype, 'opacity': opacity, 'child': child})
            elif ctype == 0x2019:  # palet
                psize, first, last = struct.unpack_from('<III', body, 0)
                q = 20
                for i in range(first, last + 1):
                    eflags, r, g, b, a = struct.unpack_from('<HBBBB', body, q)
                    q += 6
                    if eflags & 1:
                        nl = struct.unpack_from('<H', body, q)[0]
                        q += 2 + nl
                    palette[i] = (r, g, b, a)
            elif ctype == 0x2018:  # etiketler
                n = struct.unpack_from('<H', body, 0)[0]
                q = 10
                for _ in range(n):
                    f0, f1, _dir = struct.unpack_from('<HHB', body, q)
                    q += 17
                    nl = struct.unpack_from('<H', body, q)[0]
                    tags.append({'name': body[q + 2:q + 2 + nl].decode('utf-8', 'replace'), 'from': f0, 'to': f1})
                    q += 2 + nl
            elif ctype == 0x2005:  # cel
                li, x, y, opacity, ctype2 = struct.unpack_from('<HhhBH', body, 0)
                q = 16
                if ctype2 == 1:  # bağlantılı
                    link = struct.unpack_from('<H', body, q)[0]
                    frame_cels.append(('link', li, link))
                else:
                    cw, ch = struct.unpack_from('<HH', body, q)
                    raw = body[q + 4:]
                    if ctype2 == 2:
                        raw = zlib.decompress(raw)
                    if depth == 32:
                        img = Image.frombytes('RGBA', (cw, ch), raw[:cw * ch * 4])
                    elif depth == 16:
                        img = Image.frombytes('LA', (cw, ch), raw[:cw * ch * 2]).convert('RGBA')
                    else:
                        px = bytearray()
                        for v in raw[:cw * ch]:
                            px += bytes((0, 0, 0, 0)) if v == transparent_index else bytes(palette[v])
                        img = Image.frombytes('RGBA', (cw, ch), bytes(px))
                    frame_cels.append(('cel', li, x, y, opacity, img))
            p += csize
        cels.append(frame_cels)
        pos += fsize

    # katman görünürlüğü: grup altındaki katman, grubu görünmezse gizlidir
    visible = []
    stack = []
    for L in layers:
        while len(stack) > L['child']:
            stack.pop()
        vis = L['visible'] and all(stack)
        visible.append(vis and L['type'] == 0)
        if L['type'] == 1:
            stack.append(L['visible'] and all(stack))

    def resolve(fi, li):
        for c in cels[fi]:
            if c[1] != li:
                continue
            if c[0] == 'link':
                return resolve(c[2], li)
            return c
        return None

    frames = []
    for fi in range(nframes):
        canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        for li in range(len(layers)):
            if li >= len(visible) or not visible[li]:
                continue
            c = resolve(fi, li)
            if not c:
                continue
            _, _, x, y, opacity, img = c
            a = opacity * layers[li]['opacity'] / 255 / 255
            if a < 1:
                img = img.copy()
                img.putalpha(img.getchannel('A').point(lambda v: int(v * a)))
            layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            layer.paste(img, (x, y))
            canvas = Image.alpha_composite(canvas, layer)
        frames.append(canvas)
    return {'w': w, 'h': h, 'frames': frames, 'tags': tags, 'durations': durations, 'layers': layers}


if __name__ == '__main__':
    d = load(sys.argv[1])
    print(f"{d['w']}x{d['h']} · {len(d['frames'])} kare · katmanlar: {[l['name'] for l in d['layers']]}")
    for t in d['tags']:
        print(f"  {t['name']}: {t['from']}–{t['to']} ({t['to'] - t['from'] + 1} kare, {d['durations'][t['from']]} ms)")
