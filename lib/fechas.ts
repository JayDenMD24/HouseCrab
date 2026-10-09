// dd/mm/aaaa → aaaa-mm-dd (null si no es una fecha válida o es futura)
export function fechaISO(texto: string) {
  const m = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const f = new Date(`${y}-${mo}-${d}T00:00:00`);
  if (isNaN(f.getTime()) || f.getDate() !== Number(d) || f > new Date()) return null;
  return `${y}-${mo}-${d}`;
}

// aaaa-mm-dd → dd/mm/aaaa
export function isoAFecha(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
