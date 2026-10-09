import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Chips } from "@/components/chips";
import { PensionAdmin, listarParaRevision, listarReportes, revisarPension } from "@/lib/admin";
import { Boton, EstadoVacio } from "@/components/ui";
import { EstadoPension, formatoPrecio } from "@/lib/pensiones";
import { radios, useColores } from "@/lib/tema";
import ReportesPanel from "./admin-reportes";

const FILTROS: { estado: EstadoPension; nombre: string }[] = [
  { estado: "pendiente", nombre: "Pendientes" },
  { estado: "aprobada", nombre: "Aprobadas" },
  { estado: "rechazada", nombre: "Rechazadas" },
];

// Panel exclusivo del rol admin: revisa pensiones antes de publicarlas y atiende los reportes de reseñas.
export default function AdminPanel({ onChange }: { onChange?: () => void }) {
  const styles = useStyles();
  const [seccion, setSeccion] = useState<"pensiones" | "reportes">("pensiones");
  const [abiertos, setAbiertos] = useState(0);

  const contarAbiertos = useCallback(async () => {
    try {
      setAbiertos((await listarReportes("abierto")).length);
    } catch {
      setAbiertos(0);
    }
  }, []);

  useEffect(() => {
    contarAbiertos();
  }, [contarAbiertos]);

  const nombres = ["Pensiones", abiertos > 0 ? `Reportes (${abiertos})` : "Reportes"];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Administración</Text>
      <Chips
        opciones={nombres}
        seleccion={[seccion === "pensiones" ? nombres[0] : nombres[1]]}
        onToggle={(n) => setSeccion(n === nombres[0] ? "pensiones" : "reportes")}
      />
      {seccion === "pensiones" ? <RevisionPensiones onChange={onChange} /> : <ReportesPanel onCambio={contarAbiertos} />}
    </ScrollView>
  );
}

function RevisionPensiones({ onChange }: { onChange?: () => void }) {
  const styles = useStyles();
  const [estado, setEstado] = useState<EstadoPension>("pendiente");
  const [pensiones, setPensiones] = useState<PensionAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setPensiones(null);
    setError(null);
    try {
      setPensiones(await listarParaRevision(estado));
    } catch (e: any) {
      setError(e.message);
    }
  }, [estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resolver = async (p: PensionAdmin, aprobar: boolean) => {
    let motivo: string | undefined;
    if (aprobar) {
      if (!window.confirm(`¿Aprobar y publicar "${p.nombre}"? Ya debiste verificar que es real.`)) return;
    } else {
      const m = window.prompt(
        p.estado === "aprobada"
          ? `Motivo para revocar la aprobación de "${p.nombre}":`
          : `Motivo del rechazo de "${p.nombre}" (lo verá el propietario):`,
      );
      if (m === null) return;
      if (!m.trim()) return window.alert("Debes indicar un motivo.");
      motivo = m;
    }
    setOcupada(p.id);
    try {
      await revisarPension(p.id, aprobar, motivo);
      await cargar();
      onChange?.();
    } catch (e: any) {
      window.alert(e.message);
    } finally {
      setOcupada(null);
    }
  };

  const nombreFiltro = useMemo(() => FILTROS.find((f) => f.estado === estado)!.nombre, [estado]);

  return (
    <>
      <Chips
        opciones={FILTROS.map((f) => f.nombre)}
        seleccion={[nombreFiltro]}
        onToggle={(n) => setEstado(FILTROS.find((f) => f.nombre === n)!.estado)}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {pensiones === null && !error && <Text style={styles.empty}>Cargando…</Text>}
      {pensiones?.length === 0 && (
        <EstadoVacio icono="checkmark-done-outline" titulo="Todo al día" texto="No hay pensiones en este estado." />
      )}

      {pensiones?.map((p) => (
        <TarjetaRevision key={p.id} p={p} ocupada={ocupada === p.id} onResolver={(a) => resolver(p, a)} />
      ))}
    </>
  );
}

function TarjetaRevision({
  p,
  ocupada,
  onResolver,
}: {
  p: PensionAdmin;
  ocupada: boolean;
  onResolver: (aprobar: boolean) => void;
}) {
  const styles = useStyles();
  const col = useColores();
  const mapaUrl = `https://www.openstreetmap.org/?mlat=${p.latitud}&mlon=${p.longitud}#map=18/${p.latitud}/${p.longitud}`;

  return (
    <View style={styles.card}>
      {p.foto_url && <Image source={{ uri: p.foto_url }} style={styles.photo} resizeMode="cover" />}
      <Text style={styles.cardTitle}>{p.nombre}</Text>
      <Text style={styles.text}>{p.tipo} · {p.direccion}</Text>

      <Text style={styles.section}>Propietario</Text>
      <Text style={styles.text}>{p.propietario_nombre}</Text>
      <TouchableOpacity onPress={() => Linking.openURL(`mailto:${p.propietario_email}`)}>
        <Text style={styles.link}>{p.propietario_email}</Text>
      </TouchableOpacity>
      {p.telefono ? (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${p.telefono}`)} style={styles.phoneRow}>
          <Ionicons name="call" size={16} color={col.primario} />
          <Text style={styles.link}>{p.telefono}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.warn}>Sin teléfono registrado</Text>
      )}

      <TouchableOpacity onPress={() => Linking.openURL(mapaUrl)}>
        <Text style={styles.link}>Ver ubicación en OpenStreetMap ↗</Text>
      </TouchableOpacity>

      {p.comentarios ? <Text style={styles.text}>“{p.comentarios}”</Text> : null}
      {p.comodidades.length > 0 && <Text style={styles.text}>Comodidades: {p.comodidades.join(", ")}</Text>}
      {p.dias_alimentacion.length > 0 && <Text style={styles.text}>Comidas: {p.dias_alimentacion.join(", ")}</Text>}

      <Text style={styles.section}>Habitaciones</Text>
      {p.habitaciones.map((h) => (
        <Text key={h.id} style={styles.text}>
          {h.tipo_cama ?? "Habitación"} · {h.cantidad_personas} persona(s) · {formatoPrecio(Number(h.precio))}
        </Text>
      ))}

      {p.estado === "rechazada" && p.motivo_rechazo ? (
        <Text style={styles.warn}>Motivo del rechazo: {p.motivo_rechazo}</Text>
      ) : null}

      <View style={styles.actions}>
        {p.estado !== "aprobada" && (
          <Boton titulo="Aprobar" icono="checkmark" variante="exito" deshabilitado={ocupada} onPress={() => onResolver(true)} style={{ flex: 1 }} />
        )}
        {p.estado !== "rechazada" && (
          <Boton
            titulo={p.estado === "aprobada" ? "Revocar" : "Rechazar"}
            icono="close"
            variante="peligro"
            deshabilitado={ocupada}
            onPress={() => onResolver(false)}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1 },
        content: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
        title: { fontSize: 24, fontWeight: "800", color: col.texto },
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
        photo: { width: "100%", aspectRatio: 16 / 9, maxHeight: 240, borderRadius: radios.md, marginBottom: 6 },
        cardTitle: { fontSize: 18, fontWeight: "700", color: col.texto },
        section: { fontSize: 14, fontWeight: "700", color: col.texto, marginTop: 8 },
        text: { fontSize: 14, color: col.textoSec },
        link: { fontSize: 14, color: col.primario, fontWeight: "600" },
        warn: { fontSize: 13, color: "#E53935" },
        phoneRow: { flexDirection: "row", alignItems: "center", gap: 6 },
        actions: { flexDirection: "row", gap: 10, marginTop: 10 },
        btn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: "center" },
        btnOk: { backgroundColor: "#2E7D32" },
        btnNo: { backgroundColor: "#E53935" },
        btnText: { color: "#fff", fontWeight: "700" },
      }),
    [col],
  );
};
