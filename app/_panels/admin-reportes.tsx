import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Chips } from "@/components/chips";
import { Reporte, listarReportes, resolverReporte } from "@/lib/admin";
import { Boton, EstadoVacio } from "@/components/ui";
import { MOTIVOS_REPORTE, MotivoReporte } from "@/lib/resenas";
import { useColores } from "@/lib/tema";

const FILTROS: { estado: Reporte["estado"]; nombre: string }[] = [
  { estado: "abierto", nombre: "Abiertos" },
  { estado: "resuelto", nombre: "Eliminados" },
  { estado: "descartado", nombre: "Descartados" },
];

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

// Reportes de comentarios y respuestas de reseñas hechos por los usuarios.
export default function ReportesPanel({ onCambio }: { onCambio: () => void }) {
  const styles = useStyles();
  const [estado, setEstado] = useState<Reporte["estado"]>("abierto");
  const [reportes, setReportes] = useState<Reporte[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setReportes(null);
    setError(null);
    try {
      setReportes(await listarReportes(estado));
    } catch (e: any) {
      setError(e.message);
    }
  }, [estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resolver = async (r: Reporte, eliminar: boolean) => {
    if (eliminar && !window.confirm(`¿Eliminar ${r.tipo === "comentario" ? "el comentario" : "la respuesta"} de ${r.autor_nombre}? No se puede deshacer.`)) return;
    setOcupado(r.id);
    try {
      await resolverReporte(r.id, eliminar);
      await cargar();
      onCambio();
    } catch (e: any) {
      window.alert(e.message);
    } finally {
      setOcupado(null);
    }
  };

  const nombre = FILTROS.find((f) => f.estado === estado)!.nombre;

  return (
    <View style={styles.box}>
      <Chips
        opciones={FILTROS.map((f) => f.nombre)}
        seleccion={[nombre]}
        onToggle={(n) => setEstado(FILTROS.find((f) => f.nombre === n)!.estado)}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {reportes === null && !error && <Text style={styles.empty}>Cargando…</Text>}
      {reportes?.length === 0 && (
        <EstadoVacio icono="shield-checkmark-outline" titulo="Sin reportes" texto="No hay reportes en este estado." />
      )}

      {reportes?.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.titulo}>
            {r.tipo === "comentario" ? "Comentario" : "Respuesta del propietario"} ·{" "}
            {MOTIVOS_REPORTE[r.motivo as MotivoReporte] ?? r.motivo}
          </Text>
          <Text style={styles.meta}>
            Pensión: {r.pension_nombre} · Autor: {r.autor_nombre}
          </Text>
          {r.oculto && r.estado === "abierto" && (
            <Text style={styles.oculto}>
              Oculto al público por superar los {r.umbral} reportes. «Descartar» lo vuelve a mostrar.
            </Text>
          )}
          <Text style={styles.contenido}>
            {r.contenido ? `“${r.contenido}”` : "(contenido ya eliminado)"}
          </Text>
          {r.detalle ? <Text style={styles.detalle}>Detalle del reporte: {r.detalle}</Text> : null}
          <Text style={styles.meta}>
            Reportado por {r.reportante_nombre} · {fecha(r.created_at)}
            {r.reportes_del_mismo_contenido > 1 ? ` · ${r.reportes_del_mismo_contenido} reportes del mismo contenido` : ""}
          </Text>

          {r.estado === "abierto" && (
            <View style={styles.acciones}>
              <Boton
                titulo="Eliminar contenido"
                icono="trash-outline"
                variante="peligro"
                chico
                deshabilitado={ocupado === r.id}
                onPress={() => resolver(r, true)}
                style={{ flex: 1 }}
              />
              <Boton
                titulo="Descartar"
                variante="secundario"
                chico
                deshabilitado={ocupado === r.id}
                onPress={() => resolver(r, false)}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        box: { gap: 12 },
        empty: { textAlign: "center", color: col.textoTer, marginTop: 16 },
        error: { color: "#D32F2F", fontSize: 13 },
        card: {
          backgroundColor: col.tarjeta,
          borderRadius: 14,
          padding: 14,
          gap: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
          borderWidth: col.oscuro ? 1 : 0,
          borderColor: col.borde,
        },
        titulo: { fontSize: 15, fontWeight: "700", color: col.texto },
        meta: { fontSize: 12, color: col.textoTer },
        contenido: { fontSize: 14, color: col.textoSec, lineHeight: 20, marginVertical: 4 },
        oculto: { fontSize: 12, fontWeight: "700", color: "#F9A825" },
        detalle: { fontSize: 13, color: col.textoSec, fontStyle: "italic" },
        acciones: { flexDirection: "row", gap: 10, marginTop: 8 },
        btn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: "center" },
        btnNo: { backgroundColor: "#E53935" },
        btnGris: { backgroundColor: "#757575" },
        btnTexto: { color: "#fff", fontWeight: "700" },
      }),
    [col],
  );
};
