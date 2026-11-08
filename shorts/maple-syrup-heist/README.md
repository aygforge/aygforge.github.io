# Büyük Kanada Akçaağaç Şurubu Soygunu — vertical short

`buyuk-kanada-akcaagac-surubu-soygunu.mp4` — 1080×1920, 30 fps, 73.5 s, H.264 + AAC 256k, mastered to −14 LUFS / −1.5 dBTP.

- Timeline is driven by the supplied ElevenLabs narration (unaltered); captions are the 12 narration sentences verbatim.
- Music: supplied Suno track, crossfaded into its own ending, ducked under the voice with lifts in pauses/reveals.
- SFX synthesized in `src/mix.py`; visuals drawn procedurally with skia in `src/` (fonts: Kalam, Google Fonts OFL).

Rebuild: `python render.py seg <f0> <f1> out.mp4` for video, `python mix.py <audio_dir>` for the mix.
