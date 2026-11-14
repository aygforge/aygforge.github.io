// Pixel ikonları çalışma zamanında üretip CSS sınıfları olarak enjekte eder (harici dosya gerekmez).
import { ICONS, iconCanvas, GOOD_ICONS, goodIconCanvas } from '../rendering/icons.js';

export function injectIconStyles() {
  const rules = [];
  for (const name of Object.keys(ICONS)) {
    const c = iconCanvas(name, 1);
    rules.push(`.ic-${name}{background-image:url(${c.toDataURL()})}`);
  }
  for (const id of Object.keys(GOOD_ICONS)) {
    const c = goodIconCanvas(id, 1);
    rules.push(`.ic-${id}{background-image:url(${c.toDataURL()})}`);
  }
  const style = document.createElement('style');
  style.id = 'tof-icons';
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}
