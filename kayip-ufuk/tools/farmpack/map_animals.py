"""Animals that exist among the GDD's 25 species: rabbit, frog, seagull (ANIMAL_SEABIRD), crow (ANIMAL_FOREST_BIRD)
and the green turtle (MARINE_TURTLE, drawn semi-transparent underwater by the renderer).
Frames stored at x1 (bottom-centred, native x2) in the 48x48 / 64x64 rects; right/left are mirrors.
Pack side views face LEFT except frog and turtle (face RIGHT). Birds only have side views; up/down reuse them.
Farm animals, pets, deer, fox, capybara, hippo, penguin, dolphins etc. are not GDD species and are not used."""
from PIL import Image
from core import cell, load, trim

F = 'Animals/Forest/'
DIRS = ['down', 'left', 'right', 'up']


def mirror(im):
    return im.transpose(Image.FLIP_LEFT_RIGHT)


def sheet_frames(rel, cw, ch, rows, cols):
    im = load(rel)
    return [[cell(im, c, r, cw, ch) for c in cols] for r in rows]


def run(atlas, log):
    n = 0

    def put_clip(species, clip, d, frames, src):
        nonlocal n
        for i, fr in enumerate(frames):
            atlas.put(f'animal/{species}/{clip}/{d}/{i}', trim(fr), scale=1, native=2, anchor='bottom', source=src); n += 1

    def fill(species, clip, count, by_dir, src):
        for d in DIRS:
            fr = by_dir[d]
            put_clip(species, clip, d, [fr[i % len(fr)] for i in range(count)], src)

    # rabbit: rows side(left)/front/back; idle rows 0-2, hop rows 3-5, sit rows 6-8
    R = F + 'Rabbit/Rabbit Brown.png'; im = load(R)
    row = lambda r: [cell(im, c, r) for c in range(4)]
    for clip, base, count in [('idle', 0, 4), ('move', 3, 6), ('react', 6, 3)]:
        side = row(base)
        fill('ANIMAL_RABBIT', clip, count, {'left': side, 'right': [mirror(f) for f in side], 'down': row(base + 1), 'up': row(base + 2)}, R)
    # frog: rows front/side(right)/back; frames 0-2 idle, 3-7 jump
    FR = F + 'Frog/Frogs-Sheet.png'; im = load(FR)
    fr = lambda r, cols: [cell(im, c, r) for c in cols]
    for clip, cols, count in [('idle', [0, 1, 2, 1], 4), ('move', [3, 4, 5, 6, 7, 3], 6), ('react', [4, 5, 6], 3)]:
        side = fr(1, cols)
        fill('ANIMAL_FROG', clip, count, {'right': side, 'left': [mirror(f) for f in side], 'down': fr(0, cols), 'up': fr(2, cols)}, FR)
    # seagull: side views only (left); row 0 idle, row 1 flight, row 4 take-off
    SG = F + 'Beach/seagull.png'; im = load(SG)
    sg = lambda r, cols: [cell(im, c, r) for c in cols]
    for clip, r, cols, count in [('idle', 0, [0, 1, 2, 3], 4), ('move', 1, [0, 1, 2, 3], 6), ('react', 4, [0, 1, 2], 3)]:
        side = sg(r, cols)
        fill('ANIMAL_SEABIRD', clip, count, {'left': side, 'right': [mirror(f) for f in side], 'down': side, 'up': [mirror(f) for f in side]}, SG)
    # crow (forest bird): 32px cells, row 0 hop/peck, row 2 flight
    CR = F + 'Crow/Crow.png'; im = load(CR)
    cr = lambda r, cols: [cell(im, c, r, 32, 32) for c in cols]
    for clip, r, cols, count in [('idle', 0, [0, 1, 2, 3], 4), ('move', 2, [0, 1, 2, 3, 4], 6), ('react', 0, [2, 3, 4], 3)]:
        side = cr(r, cols)
        fill('ANIMAL_FOREST_BIRD', clip, count, {'left': side, 'right': [mirror(f) for f in side], 'down': side, 'up': [mirror(f) for f in side]}, CR)
    # turtle: 32px cells, rows side(right)/front/back; walk = swim cycle, hide = turn
    TW, TH = F + 'Turttle/Green/Walk.png', F + 'Turttle/Green/Sleep, hide.png'
    w, h = load(TW), load(TH)
    tw = lambda r: [cell(w, c, r, 32, 32) for c in range(4)]
    th = lambda r: [cell(h, c, r, 32, 32) for c in range(3)]
    fill('MARINE_TURTLE', 'swim', 6, {'right': tw(0), 'left': [mirror(f) for f in tw(0)], 'down': tw(1), 'up': tw(2)}, TW)
    fill('MARINE_TURTLE', 'turn', 3, {'right': th(0), 'left': [mirror(f) for f in th(0)], 'down': th(1), 'up': th(2)}, TH)
    # codex portraits (front/side idle frame)
    for sp, im_ in [('ANIMAL_RABBIT', cell(load(R), 0, 1)), ('ANIMAL_SEABIRD', cell(load(SG), 0, 0)), ('ANIMAL_FOREST_BIRD', trim(cell(load(CR), 0, 0, 32, 32))), ('MARINE_TURTLE', trim(cell(w, 0, 0, 32, 32)))]:
        im_ = trim(im_)
        k = 2 if im_.width * 2 <= 32 and im_.height * 2 <= 32 else 1
        atlas.put(f'codex/{sp}', im_, scale=k, anchor='center', source='codex portrait'); n += 1
    log['animalFrames'] = n
