/** Prix en FCFA, identique sur tous les téléphones (ex: 600 000 000 F CFA). */
export function formatFcfa(price: number): string {
  const n = Math.round(Number(price) || 0);
  const grouped = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return `${grouped} F CFA`;
}
