# Operation Paul Bunyan — "Bu Gerçekten Yaşandı"

`operation_paul_bunyan_1080x1920.mp4` — 1080×1920, 30 fps, 105.7 s, H.264 + AAC, −14 LUFS.

- Timeline is driven by the supplied ElevenLabs narration (untouched: not cut, not sped up).
  Narration ends at 100.9 s, then the archival photo holds and fades.
- On-screen captions are the 18 narration sentences verbatim, each shown while it is spoken.
- Music: the supplied track, looped with crossfades (near-silent intro skipped), automated per section.
- SFX are synthesized (wind, rotors, flyovers, boots, radio static, paper, chainsaw, creak, fall). No gunfire, explosions or combat audio.

## Archival photograph
"판문점 도끼만행사건 관련 미루나무 제거 작업" (poplar tree removal related to the Panmunjom axe incident),
Government of the Republic of Korea, August 1976. Source: Wikimedia Commons
(https://commons.wikimedia.org/wiki/File:판문점_도끼만행사건_관련_미루나무_제거_작업.jpg), tagged PD-South Korea.
Commons gives the date as 21 Aug 1976; the Korean caption gives 20 Aug 1976.

## Rebuild
`source/` contains the procedural renderer (Python + pycairo, numpy, scipy, Pillow; fonts Kalam).
`python3 render.py video out.mp4` renders frames; `python3 audio.py` builds the mix (paths to the narration and music files are at the top of audio.py).
