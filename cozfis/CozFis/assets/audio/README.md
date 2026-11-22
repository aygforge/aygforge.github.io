# assets/audio

CozFis'te ses dosyası yoktur: müzik, ortam ve efektlerin tamamı `src/systems/08_save_audio.js` içindeki
`Sound` nesnesi tarafından Web Audio API ile **çalışma anında sentezlenir** (osilatör + gürültü tamponu).
Bu aşamada müziğe dokunulmadı. İleride kayıtlı ses dosyaları eklenirse bu klasöre konur ve
`AssetManager` ile aynı göreli yol kuralı izlenir.
