// Minúsculas y sin acentos: "MARÍA", "maria" y "  María " encuentran lo mismo
export const normalizeText = (value) =>
  String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Precio más bajo entre las modalidades del médico (el mismo criterio del buscador avanzado)
export const lowestPrice = (doctor) => {
  const prices = [doctor.consultation_price_in_person, doctor.consultation_price_online]
    .map((p) => parseFloat(p))
    .filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : 0;
};
