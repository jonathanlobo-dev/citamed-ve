/**
 * Campos de números con decimales (signos vitales). Los navegadores en español
 * ignoran la coma en un campo numérico: "36,5" quedaba como 365. Por eso los campos
 * son de texto y aquí se acepta coma o punto, siempre guardando punto.
 */
export function toDecimalInput(raw) {
  const s = String(raw ?? '').replace(/,/g, '.').replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  return dot === -1 ? s : s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
}
