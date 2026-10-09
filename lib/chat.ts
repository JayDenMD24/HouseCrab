import { supabase } from "./supabase";

export type Mensaje = {
  id: string;
  conversacion_id: string;
  autor_id: string;
  texto: string;
  leido: boolean;
  created_at: string;
};

export type Conversacion = {
  id: string;
  pension_id: string;
  estudiante_id: string;
  propietario_id: string;
  pension: { nombre: string } | null;
  estudiante: { nombre: string } | null;
  propietario: { nombre: string } | null;
  mensajes: Mensaje[];
};

// Devuelve el id de la conversación entre el estudiante y el dueño de la pensión (la crea si no existe).
export async function abrirConversacion(pensionId: string, propietarioId: string, estudianteId: string) {
  const { data: existente } = await supabase
    .from("conversaciones")
    .select("id")
    .eq("pension_id", pensionId)
    .eq("estudiante_id", estudianteId)
    .maybeSingle();
  if (existente) return existente.id as string;

  const { data, error } = await supabase
    .from("conversaciones")
    .insert({ pension_id: pensionId, estudiante_id: estudianteId, propietario_id: propietarioId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function listarConversaciones(): Promise<Conversacion[]> {
  const { data, error } = await supabase
    .from("conversaciones")
    .select(
      "*, pension:pensiones(nombre), estudiante:profiles!conversaciones_estudiante_id_fkey(nombre)," +
        " propietario:profiles!conversaciones_propietario_id_fkey(nombre), mensajes(*)",
    );
  if (error) throw error;
  return data as unknown as Conversacion[];
}

export async function listarMensajes(conversacionId: string): Promise<Mensaje[]> {
  const { data, error } = await supabase
    .from("mensajes")
    .select("*")
    .eq("conversacion_id", conversacionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Mensaje[];
}

export async function enviarMensaje(conversacionId: string, autorId: string, texto: string) {
  const { error } = await supabase
    .from("mensajes")
    .insert({ conversacion_id: conversacionId, autor_id: autorId, texto: texto.trim() });
  if (error) throw error;
}

export async function marcarLeidos(conversacionId: string, userId: string) {
  await supabase
    .from("mensajes")
    .update({ leido: true })
    .eq("conversacion_id", conversacionId)
    .neq("autor_id", userId)
    .eq("leido", false);
}

// Escucha mensajes nuevos (de las conversaciones del usuario, o de una sola). Devuelve la función para cancelar.
export function suscribirMensajes(onNuevo: (m: Mensaje) => void, conversacionId?: string) {
  const canal = supabase
    .channel(`mensajes-${conversacionId ?? "todos"}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "mensajes",
        ...(conversacionId ? { filter: `conversacion_id=eq.${conversacionId}` } : {}),
      },
      (payload) => onNuevo(payload.new as Mensaje),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}

export const noLeidos = (c: Conversacion, userId: string) =>
  c.mensajes.filter((m) => !m.leido && m.autor_id !== userId).length;

export const ultimoMensaje = (c: Conversacion): Mensaje | null =>
  c.mensajes.reduce<Mensaje | null>((a, m) => (!a || m.created_at > a.created_at ? m : a), null);
