# Vasa — "Bu Gerçekten Yaşandı"

Procedural colored-pencil animation (skia-python) + audio mix (numpy/scipy), 1080×1920 @ 30 fps.

- `lib.py` – paper, crayon texture, wobbly pencil outlines, handwritten text helpers
- `ship.py` – Vasa in stern-quarter view, cross-section and side view
- `world.py` – Stockholm harbor, crowd, water, wind, underwater, recovery rig
- `scenes.py` – narration-locked timeline (sentence onsets 0.00 / 7.68 / 15.53 / 20.84 / 24.76 / 29.67 / 34.62 s)
- `audio.py` – bar-aligned rearrangement of the supplied music, ducking, synthesized SFX
- `render.py` – renders frames and muxes `mix_raw.f32` (from `audio.py`)

Fonts: Kalam (OFL) from `@expo-google-fonts/kalam`. Input audio (narration + music) is not included.
