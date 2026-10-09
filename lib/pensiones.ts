import { borrarFotos } from "./storage";
import { supabase } from "./supabase";

export const TIPOS_PENSION = ["Casa familiar", "Apartamento", "Residencia", "Casa independiente"];
export const COMODIDADES = ["Aire acondicionado", "Lavado", "Wifi", "Ventilador", "Baño privado", "Cocina"];
export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const TIPOS_CAMA = ["Individual", "Doble", "Litera"];

export type Habitacion = {
  id: string;
  pension_id: string;
  tipo_cama: string | null;
  cantidad_personas: number;
  precio: number;
  foto_url: string | null;
};

// borrador → pendiente (enviada a revisión) → aprobada | rechazada. Solo las aprobadas se pueden publicar.
export type EstadoPension = "borrador" | "pendiente" | "aprobada" | "rechazada";

export type Pension = {
  id: string;
  propietario_id: string;
  nombre: string;
  tipo: string;
  direccion: string;
  telefono: string | null;
  comentarios: string | null;
  comodidades: string[];
  dias_alimentacion: string[];
  latitud: number;
  longitud: number;
  foto_url: string | null;
  publicada: boolean;
  estado: EstadoPension;
  motivo_rechazo: string | null;
  habitaciones: Habitacion[];
};

export type NuevaPension = {
  nombre: string;
  tipo: string;
  direccion: string;
  telefono: string;
  comentarios: string;
  comodidades: string[];
  dias_alimentacion: string[];
  latitud: number;
  longitud: number;
  foto_url: string | null;
  habitaciones: { tipo_cama: string; cantidad_personas: number; precio: number; foto_url: string | null }[];
};

const SELECT = "*, habitaciones(*)";

export async function listarPublicadas(): Promise<Pension[]> {
  const { data, error } = await supabase
    .from("pensiones")
    .select(SELECT)
    .eq("publicada", true)
    .eq("estado", "aprobada");
  if (error) throw error;
  return data as Pension[];
}

export async function listarMias(userId: string): Promise<Pension[]> {
  const { data, error } = await supabase
    .from("pensiones")
    .select(SELECT)
    .eq("propietario_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Pension[];
}

export async function crearPension(userId: string, p: NuevaPension) {
  const { habitaciones, ...datos } = p;
  const { data, error } = await supabase
    .from("pensiones")
    .insert({ ...datos, propietario_id: userId, publicada: false })
    .select("id")
    .single();
  if (error) throw error;

  if (habitaciones.length) {
    const { error: errHab } = await supabase
      .from("habitaciones")
      .insert(habitaciones.map((h) => ({ ...h, pension_id: data.id })));
    if (errHab) throw errHab;
  }
}

export async function actualizarPension(id: string, p: NuevaPension) {
  const { habitaciones, ...datos } = p;
  const { data: antes } = await supabase
    .from("pensiones")
    .select("foto_url, habitaciones(id, foto_url)")
    .eq("id", id)
    .maybeSingle();
  const habsAntes = (antes?.habitaciones ?? []) as { id: string; foto_url: string | null }[];

  const { error } = await supabase.from("pensiones").update(datos).eq("id", id);
  if (error) throw error;

  // Primero se insertan las habitaciones nuevas y solo después se borran las anteriores,
  // para no dejar la pensión sin habitaciones si algo falla a la mitad.
  if (habitaciones.length) {
    const { error: errIns } = await supabase
      .from("habitaciones")
      .insert(habitaciones.map((h) => ({ ...h, pension_id: id })));
    if (errIns) throw errIns;
  }
  if (habsAntes.length) {
    const { error: errDel } = await supabase.from("habitaciones").delete().in("id", habsAntes.map((h) => h.id));
    if (errDel) throw errDel;
  }

  // Borra del Storage las fotos que ya no se usan.
  const vigentes = new Set([datos.foto_url, ...habitaciones.map((h) => h.foto_url)]);
  const huerfanas = [antes?.foto_url, ...habsAntes.map((h) => h.foto_url)].filter((u) => u && !vigentes.has(u));
  await borrarFotos(huerfanas).catch(() => {});
}

export async function solicitarRevision(id: string) {
  const { error } = await supabase.from("pensiones").update({ estado: "pendiente" }).eq("id", id);
  if (error) throw error;
}

export async function cambiarPublicacion(id: string, publicada: boolean) {
  const { error } = await supabase.from("pensiones").update({ publicada }).eq("id", id);
  if (error) throw error;
}

export async function eliminarPension(id: string) {
  const { data } = await supabase.from("pensiones").select("foto_url, habitaciones(foto_url)").eq("id", id).maybeSingle();
  const { error } = await supabase.from("pensiones").delete().eq("id", id);
  if (error) throw error;
  // Limpia las fotos del Storage (si falla no es crítico: la pensión ya se eliminó).
  const fotos = [data?.foto_url, ...((data?.habitaciones as { foto_url: string | null }[] | undefined) ?? []).map((h) => h.foto_url)];
  await borrarFotos(fotos).catch(() => {});
}

export function precioDesde(p: Pension): number | null {
  const precios = p.habitaciones.map((h) => Number(h.precio));
  return precios.length ? Math.min(...precios) : null;
}

export const formatoPrecio = (n: number) => `$${n.toLocaleString("es-CO")}`;

// Geocodificación inversa (Nominatim): arma una dirección legible a partir del punto elegido.
export async function direccionDesde(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "es" } },
    );
    const json = await res.json();
    const a = json.address ?? {};
    const calle = [a.road, a.house_number].filter(Boolean).join(" ");
    const zona = a.neighbourhood ?? a.suburb;
    return [calle, zona].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

export type Filtros = {
  texto: string;
  tipo: string | null;
  precioMax: number | null;
  comodidades: string[];
};

export const FILTROS_VACIOS: Filtros = { texto: "", tipo: null, precioMax: null, comodidades: [] };

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filtrarPensiones(lista: Pension[], f: Filtros): Pension[] {
  const q = normalizar(f.texto.trim());
  return lista.filter((p) => {
    if (q && !normalizar(`${p.nombre} ${p.direccion} ${p.tipo}`).includes(q)) return false;
    if (f.tipo && p.tipo !== f.tipo) return false;
    if (f.precioMax !== null && !p.habitaciones.some((h) => Number(h.precio) <= f.precioMax!)) return false;
    if (f.comodidades.some((c) => !p.comodidades.includes(c))) return false;
    return true;
  });
}
