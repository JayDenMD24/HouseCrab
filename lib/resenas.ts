import { useCallback, useEffect, useState } from "react";

import { supabase } from "./supabase";

export type Resena = {
  id: string;
  autor_id: string;
  autor_nombre: string;
  estrellas: number;
  comentario: string | null;
  moderada: boolean;
  respuesta: string | null;
  respuesta_en: string | null;
  respuesta_moderada: boolean;
  // Ocultos temporalmente al superar el umbral de reportes, a la espera de la decisión de un admin.
  comentario_en_revision: boolean;
  respuesta_en_revision: boolean;
  created_at: string;
};

export type DatosResenas = {
  resenas: Resena[]; // de la más reciente a la más antigua
  promedio: number; // 0 si no hay calificaciones
  total: number;
  mia: Resena | null; // la reseña del usuario actual, si existe
};

export const MAX_COMENTARIO = 1000;

export async function obtenerResenas(pensionId: string, userId: string): Promise<DatosResenas> {
  const { data, error } = await supabase
    .from("resenas")
    .select("id, autor_id, estrellas, comentario, moderada, respuesta, respuesta_en, respuesta_moderada, comentario_en_revision, respuesta_en_revision, created_at, autor:profiles(nombre)")
    .eq("pension_id", pensionId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const resenas: Resena[] = (data as any[]).map((r) => ({
    id: r.id,
    autor_id: r.autor_id,
    autor_nombre: r.autor?.nombre ?? "Estudiante",
    estrellas: r.estrellas,
    comentario: r.comentario,
    moderada: r.moderada,
    respuesta: r.respuesta,
    respuesta_en: r.respuesta_en,
    respuesta_moderada: r.respuesta_moderada,
    comentario_en_revision: r.comentario_en_revision,
    respuesta_en_revision: r.respuesta_en_revision,
    created_at: r.created_at,
  }));
  const total = resenas.length;
  const promedio = total ? resenas.reduce((suma, r) => suma + r.estrellas, 0) / total : 0;
  return { resenas, promedio, total, mia: resenas.find((r) => r.autor_id === userId) ?? null };
}

// Crea o actualiza la reseña del estudiante para esa pensión.
export async function guardarResena(pensionId: string, userId: string, estrellas: number, comentario: string) {
  const texto = comentario.trim() || null;
  const { data: actualizadas, error } = await supabase
    .from("resenas")
    .update({ estrellas, comentario: texto })
    .eq("pension_id", pensionId)
    .eq("autor_id", userId)
    .select("id");
  if (error) throw error;
  if (actualizadas?.length) return;

  const { error: errIns } = await supabase
    .from("resenas")
    .insert({ pension_id: pensionId, autor_id: userId, estrellas, comentario: texto });
  if (errIns) throw errIns;
}

export async function moderarResena(id: string) {
  const { error } = await supabase.rpc("admin_moderar_resena", { resena: id });
  if (error) throw error;
}

// El propietario responde (o edita su respuesta). Un texto vacío la elimina.
export async function responderResena(id: string, texto: string) {
  const { error } = await supabase.rpc("responder_resena", { p_resena: id, p_texto: texto });
  if (error) throw error;
}

export async function moderarRespuesta(id: string) {
  const { error } = await supabase.rpc("admin_moderar_respuesta", { resena: id });
  if (error) throw error;
}

export type MotivoReporte = "ofensivo" | "spam" | "falso" | "otro";
export const MOTIVOS_REPORTE: Record<MotivoReporte, string> = {
  ofensivo: "Ofensivo o acoso",
  spam: "Spam o publicidad",
  falso: "Información falsa",
  otro: "Otro",
};

export async function reportarResena(
  id: string,
  tipo: "comentario" | "respuesta",
  motivo: MotivoReporte,
  detalle: string,
) {
  const { error } = await supabase.rpc("reportar_resena", {
    p_resena: id,
    p_tipo: tipo,
    p_motivo: motivo,
    p_detalle: detalle.trim() || null,
  });
  if (error) throw error;
}

// Carga las reseñas de una pensión y permite recargarlas tras guardar o moderar.
export function useResenas(pensionId: string, userId: string) {
  const [datos, setDatos] = useState<DatosResenas | null>(null);

  const recargar = useCallback(async () => {
    try {
      setDatos(await obtenerResenas(pensionId, userId));
    } catch {
      setDatos(null);
    }
  }, [pensionId, userId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, recargar };
}
