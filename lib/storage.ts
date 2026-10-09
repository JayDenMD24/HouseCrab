import { supabase } from "./supabase";

const BUCKET = "pensiones";

// `existente`: la foto ya está en el Storage (modo edición) y no hay que volver a subirla.
export type Foto = { uri: string; mime: string; existente?: boolean };

// Sube una foto a <userId>/<nombre-único> y devuelve su URL pública.
export async function subirFoto(userId: string, foto: Foto): Promise<string> {
  if (foto.existente) return foto.uri;
  const ext = foto.mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = await (await fetch(foto.uri)).arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: foto.mime });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Borra archivos a partir de sus URLs públicas (los que no sean del bucket se ignoran).
export async function borrarFotos(urls: (string | null | undefined)[]) {
  const marca = `/object/public/${BUCKET}/`;
  const rutas = urls
    .filter((u): u is string => !!u && u.includes(marca))
    .map((u) => decodeURIComponent(u.split(marca)[1]));
  if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas);
}
