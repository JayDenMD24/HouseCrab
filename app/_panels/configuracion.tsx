import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Chips } from "@/components/chips";
import CuentaPanel from "@/components/config/cuenta";
import { Encabezado, useEstilosConfig } from "@/components/config/comun";
import LegalPanel from "@/components/config/legal";
import SoportePanel from "@/components/config/soporte";
import { Boton, Insignia, Tarjeta } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { Modo, useColores, useTema } from "@/lib/tema";

type Vista = "menu" | "cuenta" | "personalizar" | "soporte" | "legal";
type Icono = keyof typeof Ionicons.glyphMap;

const ITEMS: { label: string; detalle: string; icono: Icono; color: string; vista: Vista }[] = [
  { label: "Cuenta", detalle: "Tus datos y contraseña", icono: "person", color: "#2196F3", vista: "cuenta" },
  { label: "Personalizar", detalle: "Modo claro u oscuro", icono: "color-palette", color: "#8E24AA", vista: "personalizar" },
  { label: "Soporte", detalle: "Preguntas frecuentes y contacto", icono: "help-buoy", color: "#00897B", vista: "soporte" },
  { label: "Información legal", detalle: "Términos y tratamiento de datos", icono: "shield-checkmark", color: "#F4511E", vista: "legal" },
];

const NOMBRES_MODO: Record<Modo, string> = { claro: "Claro", oscuro: "Oscuro", sistema: "Automático" };
const NOMBRE_ROL = { admin: "Administrador", arrendatario: "Arrendatario", estudiante: "Estudiante" } as const;

function PersonalizarPanel({ onBack }: { onBack: () => void }) {
  const s = useEstilosConfig();
  const { modo, setModo } = useTema();
  const porNombre = (n: string) => (Object.keys(NOMBRES_MODO) as Modo[]).find((m) => NOMBRES_MODO[m] === n)!;

  return (
    <>
      <Encabezado titulo="Personalizar" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.seccion}>Apariencia</Text>
        <Chips
          opciones={Object.values(NOMBRES_MODO)}
          seleccion={[NOMBRES_MODO[modo]]}
          onToggle={(n) => setModo(porNombre(n))}
        />
        <Text style={s.texto}>«Automático» sigue el modo claro u oscuro de tu dispositivo.</Text>
        <Text style={s.seccion}>Idioma</Text>
        <Insignia texto="Próximamente" tono="neutro" />
      </ScrollView>
    </>
  );
}

export default function ConfiguracionPanel() {
  const styles = useStyles();
  const col = useColores();
  const { profile, session, signOut } = useAuth();
  const [vista, setVista] = useState<Vista>("menu");
  const volver = () => setVista("menu");

  if (vista === "cuenta") return <CuentaPanel onBack={volver} />;
  if (vista === "personalizar") return <PersonalizarPanel onBack={volver} />;
  if (vista === "soporte") return <SoportePanel onBack={volver} />;
  if (vista === "legal") return <LegalPanel onBack={volver} />;

  const nombre = profile?.nombre ?? "Usuario";
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Perfil */}
      <Tarjeta style={styles.perfil}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciales || "?"}</Text>
        </View>
        <View style={styles.perfilInfo}>
          <Text style={styles.nombre} numberOfLines={1}>
            {nombre}
          </Text>
          <Text style={styles.correo} numberOfLines={1}>
            {session?.user.email}
          </Text>
          <View style={{ marginTop: 6 }}>
            <Insignia texto={NOMBRE_ROL[profile?.rol ?? "estudiante"]} tono="info" />
          </View>
        </View>
      </Tarjeta>

      {/* Opciones */}
      <Tarjeta style={styles.lista}>
        {ITEMS.map((it, i) => (
          <TouchableOpacity
            key={it.label}
            style={[styles.fila, i > 0 && styles.filaBorde]}
            activeOpacity={0.7}
            onPress={() => setVista(it.vista)}
          >
            <View style={[styles.icono, { backgroundColor: it.color }]}>
              <Ionicons name={it.icono} size={19} color="#fff" />
            </View>
            <View style={styles.filaTexto}>
              <Text style={styles.filaTitulo}>{it.label}</Text>
              <Text style={styles.filaDetalle}>{it.detalle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={col.textoTer} />
          </TouchableOpacity>
        ))}
      </Tarjeta>

      <Boton titulo="Cerrar sesión" icono="log-out-outline" variante="peligro" onPress={signOut} />
      <Text style={styles.version}>HouseCrab · versión alpha</Text>
    </ScrollView>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1 },
        content: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
        perfil: { flexDirection: "row", alignItems: "center", gap: 14 },
        avatar: {
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: col.primario,
          alignItems: "center",
          justifyContent: "center",
        },
        avatarTexto: { fontSize: 22, fontWeight: "800", color: "#fff" },
        perfilInfo: { flex: 1 },
        nombre: { fontSize: 18, fontWeight: "800", color: col.texto },
        correo: { fontSize: 13, color: col.textoTer },
        lista: { padding: 0, overflow: "hidden" },
        fila: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 14 },
        filaBorde: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: col.borde },
        icono: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
        filaTexto: { flex: 1 },
        filaTitulo: { fontSize: 16, fontWeight: "600", color: col.texto },
        filaDetalle: { fontSize: 12, color: col.textoTer, marginTop: 1 },
        version: { textAlign: "center", fontSize: 12, color: col.textoTer },
      }),
    [col],
  );
};
