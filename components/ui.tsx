import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

import { radios, sombra, useColores } from "@/lib/tema";

type Icono = keyof typeof Ionicons.glyphMap;

// ── Botón ────────────────────────────────────────────────────────────────────
export function Boton({
  titulo,
  onPress,
  variante = "primario",
  icono,
  cargando,
  deshabilitado,
  chico,
  style,
}: {
  titulo: string;
  onPress?: () => void;
  variante?: "primario" | "secundario" | "peligro" | "exito" | "fantasma";
  icono?: Icono;
  cargando?: boolean;
  deshabilitado?: boolean;
  chico?: boolean;
  style?: ViewStyle;
}) {
  const col = useColores();
  const estilos = useMemo(() => {
    const fondos = {
      primario: col.primario,
      secundario: col.superficie,
      peligro: "#E53935",
      exito: "#2E7D32",
      fantasma: "transparent",
    } as const;
    const textos = {
      primario: "#fff",
      secundario: col.texto,
      peligro: "#fff",
      exito: "#fff",
      fantasma: col.primario,
    } as const;
    return {
      fondo: fondos[variante],
      texto: textos[variante],
    };
  }, [col, variante]);

  const inactivo = cargando || deshabilitado;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactivo}
      activeOpacity={0.8}
      style={[
        base.boton,
        chico && base.botonChico,
        { backgroundColor: estilos.fondo },
        inactivo && { opacity: 0.55 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={estilos.texto} />
      ) : (
        <>
          {icono && <Ionicons name={icono} size={chico ? 16 : 18} color={estilos.texto} />}
          <Text style={[base.botonTexto, chico && { fontSize: 13 }, { color: estilos.texto }]}>{titulo}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Tarjeta ──────────────────────────────────────────────────────────────────
export function Tarjeta({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const col = useColores();
  return (
    <View style={[{ backgroundColor: col.tarjeta, borderRadius: radios.lg, padding: 14 }, sombra(col), style]}>
      {children}
    </View>
  );
}

// ── Insignia (estado) ────────────────────────────────────────────────────────
export function Insignia({
  texto,
  tono = "neutro",
  icono,
}: {
  texto: string;
  tono?: "ok" | "aviso" | "error" | "info" | "neutro";
  icono?: Icono;
}) {
  const col = useColores();
  const tonos = {
    ok: { fg: "#2E7D32", bg: col.oscuro ? "#15301A" : "#E6F4EA" },
    aviso: { fg: col.oscuro ? "#FFB74D" : "#B26A00", bg: col.oscuro ? "#3A2A10" : "#FFF3E0" },
    error: { fg: col.oscuro ? "#FF8A80" : "#C62828", bg: col.oscuro ? "#3A1515" : "#FDECEA" },
    info: { fg: col.primario, bg: col.azulSuave },
    neutro: { fg: col.textoSec, bg: col.superficie },
  } as const;
  const t = tonos[tono];
  return (
    <View style={[base.insignia, { backgroundColor: t.bg }]}>
      {icono && <Ionicons name={icono} size={13} color={t.fg} />}
      <Text style={[base.insigniaTexto, { color: t.fg }]}>{texto}</Text>
    </View>
  );
}

// ── Estado vacío ─────────────────────────────────────────────────────────────
export function EstadoVacio({ icono, titulo, texto }: { icono: Icono; titulo: string; texto?: string }) {
  const col = useColores();
  return (
    <View style={base.vacio}>
      <View style={[base.vacioIcono, { backgroundColor: col.azulSuave }]}>
        <Ionicons name={icono} size={30} color={col.primario} />
      </View>
      <Text style={[base.vacioTitulo, { color: col.texto }]}>{titulo}</Text>
      {texto ? <Text style={[base.vacioTexto, { color: col.textoTer }]}>{texto}</Text> : null}
    </View>
  );
}

const base = StyleSheet.create({
  boton: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botonChico: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18 },
  botonTexto: { fontSize: 15, fontWeight: "700" },
  insignia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  insigniaTexto: { fontSize: 12, fontWeight: "700" },
  vacio: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24, gap: 8 },
  vacioIcono: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  vacioTitulo: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  vacioTexto: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
