// Master timeline, derived from the ElevenLabs narration (silence detection on the supplied MP3).
// Every caption is the narration sentence verbatim.

const SENTENCES = [
  { a: 0.00, b: 7.45, text: '1983’te bir Boeing 767’nin 12 bin metre yüksekte yakıtı bitti ve iki motoru da durdu.',
    marks: [{ phrase: 'iki motoru da durdu.', t: 5.75 }] },
  { a: 8.50, b: 13.85, text: 'Air Canada’nın 143 sefer sayılı uçağında yakıt göstergeleri düzgün çalışmıyordu.',
    marks: [{ phrase: 'düzgün çalışmıyordu.', t: 12.1 }] },
  { a: 14.70, b: 22.96, text: 'Uçağa ne kadar yakıt konulacağını hesaplarken yanlış dönüşüm değeri kullanıldı ve uçak ihtiyacından çok daha az yakıtla havalandı.',
    marks: [{ phrase: 'yanlış dönüşüm değeri', t: 17.55 }, { phrase: 'çok daha az yakıtla', t: 20.9 }] },
  { a: 23.97, b: 29.19, text: 'Uçuş sırasında önce bir motor, kısa süre sonra da ikinci motor yakıtsızlıktan durdu.',
    marks: [{ phrase: 'önce bir motor,', t: 24.7 }, { phrase: 'ikinci motor', t: 27.3 }] },
  { a: 29.90, b: 32.84, text: 'Dev yolcu uçağı artık tamamen motorsuzdu.',
    marks: [{ phrase: 'tamamen motorsuzdu.', t: 31.3 }] },
  { a: 33.84, b: 40.12, text: 'Pilotlar uçağı dev bir planör gibi süzdürerek eski bir askerî hava üssü olan Gimli’ye yöneldi.',
    marks: [{ phrase: 'dev bir planör gibi', t: 35.0 }, { phrase: 'Gimli’ye', t: 38.9 }] },
  { a: 40.86, b: 49.07, text: 'Ama bilmedikleri bir şey vardı: pistin bir bölümü artık otomobil yarışları için kullanılıyordu ve yerde insanlar vardı.',
    marks: [{ phrase: 'otomobil yarışları', t: 44.8 }, { phrase: 'insanlar', t: 48.0 }] },
  { a: 50.13, b: 54.12, text: 'Pilotlar motorsuz Boeing 767’yi piste indirmeyi başardı.',
    marks: [{ phrase: 'başardı.', t: 53.3 }] },
  { a: 54.93, b: 60.88, text: 'Uçaktaki hiç kimse hayatını kaybetmedi ve olay tarihe “Gimli Glider” olarak geçti.',
    marks: [{ phrase: 'hiç kimse hayatını kaybetmedi', t: 55.5 }, { phrase: '“Gimli Glider”', t: 59.3 }] },
  { a: 61.71, b: 64.72, text: 'İnanması güç ama bu gerçekten yaşandı.', finale: true, splitAt: 62.85 },
];

const END = 66.4; // narration ends 64.99 s; short hold on the channel ending

module.exports = { SENTENCES, END };
