import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import SeccionResenas from "@/components/resenas";
import Stars from "@/components/stars";
import { Boton, Insignia, Tarjeta } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { Pension, formatoPrecio, precioDesde } from "@/lib/pensiones";
import { useResenas } from "@/lib/resenas";
import { radios, useColores } from "@/lib/tema";

export default function InfoPanel({
  pension: p,
  onChat,
  onClose,
}: {
  pension: Pension;
  onChat: (p: Pension) => void;
  onClose?: () => void;
}) {
  const styles = useStyles();
  const col = useColores();
  const { profile, session } = useAuth();
  const userId = session!.user.id;
  const { datos: cal, recargar } = useResenas(p.id, userId);

  const desde = precioDesde(p);
  const puedeChatear = profile?.rol === "estudiante";

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Foto principal */}
        <View style={styles.hero}>
          {p.foto_url ? (
            <Image source={{ uri: p.foto_url }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={styles.heroVacio}>
              <Ionicons name="home" size={56} color={col.primario} />
              <Text style={styles.heroVacioTexto}>Sin foto todavía</Text>
            </View>
          )}
          <View style={styles.heroTipo}>
            <Insignia texto={p.tipo} tono="info" />
          </View>
          {onClose && (
            <TouchableOpacity style={styles.cerrar} onPress={onClose} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={col.texto} />
            </TouchableOpacity>
          )}
        </View>

        {/* Título, precio y calificación */}
        <View style={styles.titulo}>
          <View style={styles.flex}>
            <Text style={styles.nombre}>{p.nombre}</Text>
            <View style={styles.fila}>
              <Ionicons name="location" size={15} color={col.textoTer} />
              <Text style={styles.direccion} numberOfLines={2}>
                {p.direccion}
              </Text>
            </View>
          </View>
          {desde !== null && (
            <View style={styles.precioBox}>
              <Text style={styles.precioDesde}>desde</Text>
              <Text style={styles.precio}>{formatoPrecio(desde)}</Text>
              <Text style={styles.precioMes}>por mes</Text>
            </View>
          )}
        </View>

        <View style={styles.rating}>
          <Stars valor={cal?.promedio ?? 0} size={20} />
          <Text style={styles.ratingTexto}>
            {cal && cal.total > 0
              ? `${cal.promedio.toFixed(1)} · ${cal.total} calificación${cal.total === 1 ? "" : "es"}`
              : "Aún sin calificaciones"}
          </Text>
        </View>

        {/* Comodidades */}
        {p.comodidades.length > 0 && (
          <View style={styles.pills}>
            {p.comodidades.map((c) => (
              <Insignia key={c} texto={c} tono="neutro" icono="checkmark-circle" />
            ))}
          </View>
        )}

        {/* Descripción y alimentación */}
        {(p.comentarios || p.dias_alimentacion.length > 0) && (
          <Tarjeta style={styles.tarjeta}>
            {p.comentarios ? (
              <>
                <Text style={styles.seccion}>Descripción</Text>
                <Text style={styles.texto}>{p.comentarios}</Text>
              </>
            ) : null}
            {p.dias_alimentacion.length > 0 && (
              <>
                <Text style={[styles.seccion, p.comentarios ? { marginTop: 12 } : null]}>Alimentación incluida</Text>
                <View style={styles.fila}>
                  <Ionicons name="restaurant-outline" size={16} color={col.primario} />
                  <Text style={styles.texto}>{p.dias_alimentacion.join(", ")}</Text>
                </View>
              </>
            )}
          </Tarjeta>
        )}

        {/* Habitaciones */}
        <Text style={styles.seccionFuera}>Habitaciones</Text>
        {p.habitaciones.length === 0 && (
          <Text style={styles.texto}>Esta pensión aún no tiene habitaciones registradas.</Text>
        )}
        {p.habitaciones.map((h) => (
          <Tarjeta key={h.id} style={styles.habitacion}>
            {h.foto_url ? (
              <Image source={{ uri: h.foto_url }} style={styles.habFoto} resizeMode="cover" />
            ) : (
              <View style={[styles.habFoto, styles.habFotoVacia]}>
                <Ionicons name="bed-outline" size={26} color={col.primario} />
              </View>
            )}
            <View style={styles.flex}>
              <Text style={styles.habTitulo}>{h.tipo_cama ?? "Habitación"}</Text>
              <View style={styles.fila}>
                <Ionicons name="people-outline" size={15} color={col.textoTer} />
                <Text style={styles.habMeta}>
                  {h.cantidad_personas} persona{h.cantidad_personas === 1 ? "" : "s"}
                </Text>
              </View>
            </View>
            <Text style={styles.habPrecio}>{formatoPrecio(Number(h.precio))}</Text>
          </Tarjeta>
        ))}

        {/* Reseñas */}
        <Text style={styles.seccionFuera}>Calificaciones y comentarios</Text>
        <SeccionResenas
          pensionId={p.id}
          userId={userId}
          rol={profile?.rol}
          esPropietario={p.propietario_id === userId}
          datos={cal}
          onCambio={recargar}
        />
      </ScrollView>

      {/* Acciones fijas */}
      {(p.telefono || puedeChatear) && (
        <View style={styles.footer}>
          {p.telefono ? (
            <Boton
              titulo="Llamar"
              icono="call"
              variante="secundario"
              onPress={() => Linking.openURL(`tel:${p.telefono}`)}
              style={{ flex: 1 }}
            />
          ) : null}
          {puedeChatear && (
            <Boton titulo="Chatear" icono="chatbubble-ellipses" onPress={() => onChat(p)} style={{ flex: 2 }} />
          )}
        </View>
      )}
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        scroll: { flex: 1 },
        content: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
        flex: { flex: 1 },
        fila: { flexDirection: "row", alignItems: "center", gap: 6 },
        hero: {
          width: "100%",
          aspectRatio: 16 / 9,
          maxHeight: 300,
          borderRadius: radios.lg,
          backgroundColor: col.azulSuave,
          overflow: "hidden",
        },
        heroImg: { width: "100%", height: "100%" },
        heroVacio: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
        heroVacioTexto: { fontSize: 13, color: col.textoTer },
        heroTipo: { position: "absolute", left: 12, bottom: 12, backgroundColor: col.tarjeta, borderRadius: 12 },
        cerrar: {
          position: "absolute",
          top: 10,
          right: 10,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: col.tarjeta,
          alignItems: "center",
          justifyContent: "center",
        },
        titulo: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
        nombre: { fontSize: 22, fontWeight: "800", color: col.texto },
        direccion: { flex: 1, fontSize: 14, color: col.textoSec },
        precioBox: { alignItems: "flex-end" },
        precioDesde: { fontSize: 11, color: col.textoTer },
        precio: { fontSize: 20, fontWeight: "800", color: col.primario },
        precioMes: { fontSize: 11, color: col.textoTer },
        rating: { flexDirection: "row", alignItems: "center", gap: 8 },
        ratingTexto: { fontSize: 13, color: col.textoTer },
        pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        tarjeta: { gap: 4 },
        seccion: { fontSize: 15, fontWeight: "700", color: col.texto },
        seccionFuera: { fontSize: 17, fontWeight: "800", color: col.texto, marginTop: 8 },
        texto: { fontSize: 14, color: col.textoSec, lineHeight: 21 },
        habitacion: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10 },
        habFoto: { width: 76, height: 60, borderRadius: radios.md },
        habFotoVacia: { backgroundColor: col.azulSuave, alignItems: "center", justifyContent: "center" },
        habTitulo: { fontSize: 15, fontWeight: "700", color: col.texto },
        habMeta: { fontSize: 13, color: col.textoTer },
        habPrecio: { fontSize: 15, fontWeight: "800", color: col.texto },
        footer: {
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: col.tarjeta,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: col.borde,
        },
      }),
    [col],
  );
};
