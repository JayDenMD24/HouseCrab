import type { EstadoPension, Pension } from "./pensiones";
import { supabase } from "./supabase";

// Pensión tal como la ve un admin: con los datos de contacto del propietario.
export type PensionAdmin = Pension & {
  propietario_nombre: string;
  propietario_email: string;
};

export async function listarParaRevision(estado: EstadoPension): Promise<PensionAdmin[]> {
  const { data, error } = await supabase.rpc("admin_listar_pensiones", { filtro: estado });
  if (error) throw error;
  return (data ?? []) as PensionAdmin[];
}

export async function revisarPension(id: string, aprobar: boolean, motivo?: string) {
  const { error } = await supabase.rpc("admin_revisar_pension", {
    pension: id,
    aprobar,
    motivo: motivo ?? null,
  });
  if (error) throw error;
}

export type Reporte = {
  id: string;
  resena_id: string;
  tipo: "comentario" | "respuesta";
  motivo: string;
  detalle: string | null;
  estado: "abierto" | "resuelto" | "descartado";
  created_at: string;
  estrellas: number;
  contenido: string | null;
  oculto: boolean; // ya está oculto al público por superar el umbral de reportes
  umbral: number;
  pension_nombre: string;
  autor_nombre: string;
  reportante_nombre: string;
  reportes_del_mismo_contenido: number;
};

export async function listarReportes(estado: Reporte["estado"]): Promise<Reporte[]> {
  const { data, error } = await supabase.rpc("admin_listar_reportes", { filtro: estado });
  if (error) throw error;
  return (data ?? []) as Reporte[];
}

// eliminar = true borra el contenido reportado; false descarta el reporte.
export async function resolverReporte(id: string, eliminar: boolean) {
  const { error } = await supabase.rpc("admin_resolver_reporte", { reporte: id, eliminar });
  if (error) throw error;
}
