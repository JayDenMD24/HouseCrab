import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { EstadoVacio } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  Conversacion,
  Mensaje,
  enviarMensaje,
  listarConversaciones,
  listarMensajes,
  marcarLeidos,
  noLeidos,
  suscribirMensajes,
  ultimoMensaje,
} from "@/lib/chat";
import { sombra, useColores } from "@/lib/tema";

const AVATAR_COLORS = ["#E53935", "#8E24AA", "#00897B", "#F4511E", "#3949AB"];

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

export default function ChatsPanel({
  onClose,
  inicial,
}: {
  onClose?: () => void;
  inicial?: string | null; // id de una conversación a abrir directamente (desde "Chatear con el propietario")
}) {
  const styles = useStyles();
  const col = useColores();
  const { session } = useAuth();
  const userId = session!.user.id;
  const [conversaciones, setConversaciones] = useState<Conversacion[] | null>(null);
  const [abierta, setAbierta] = useState<string | null>(inicial ?? null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setConversaciones(await listarConversaciones());
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Mensajes nuevos en cualquier conversación → refresca la lista (último mensaje y no leídos).
    return suscribirMensajes(() => cargar());
  }, [cargar]);

  const conv = conversaciones?.find((c) => c.id === abierta) ?? null;
  const otro = (c: Conversacion) => (c.estudiante_id === userId ? c.propietario : c.estudiante)?.nombre ?? "Usuario";

  if (abierta) {
    return (
      <VistaConversacion
        id={abierta}
        titulo={conv ? otro(conv) : "Chat"}
        subtitulo={conv?.pension?.nombre}
        userId={userId}
        onBack={() => {
          setAbierta(null);
          cargar();
        }}
      />
    );
  }

  const ordenadas = [...(conversaciones ?? [])].sort((a, b) =>
    (ultimoMensaje(b)?.created_at ?? "").localeCompare(ultimoMensaje(a)?.created_at ?? ""),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={col.textoSec} />
        </TouchableOpacity>
        <Text style={styles.title}>Chats</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {error && <Text style={styles.error}>{error}</Text>}
        {conversaciones?.length === 0 && (
          <EstadoVacio
            icono="chatbubbles-outline"
            titulo="Aún no tienes conversaciones"
            texto="Abre una pensión en el mapa y toca «Chatear» para escribirle al propietario."
          />
        )}
        {ordenadas.map((c, i) => {
          const pendientes = noLeidos(c, userId);
          const ultimo = ultimoMensaje(c);
          return (
            <TouchableOpacity key={c.id} style={styles.row} activeOpacity={0.75} onPress={() => setAbierta(c.id)}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarTexto}>{(otro(c)[0] ?? "?").toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.nombre}>{otro(c)}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {c.pension?.nombre}
                  {ultimo ? ` · ${ultimo.autor_id === userId ? "Tú: " : ""}${ultimo.texto}` : ""}
                </Text>
              </View>
              {pendientes > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendientes}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function VistaConversacion({
  id,
  titulo,
  subtitulo,
  userId,
  onBack,
}: {
  id: string;
  titulo: string;
  subtitulo?: string;
  userId: string;
  onBack: () => void;
}) {
  const styles = useStyles();
  const col = useColores();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    let activo = true;
    listarMensajes(id)
      .then((m) => activo && setMensajes(m))
      .catch((e) => setError(e.message));
    marcarLeidos(id, userId);

    const cancelar = suscribirMensajes((m) => {
      setMensajes((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      if (m.autor_id !== userId) marcarLeidos(id, userId);
    }, id);
    return () => {
      activo = false;
      cancelar();
    };
  }, [id, userId]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    try {
      await enviarMensaje(id, userId, t);
    } catch (e: any) {
      setError(e.message);
      setTexto(t);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={col.textoSec} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.chatTitle} numberOfLines={1}>{titulo}</Text>
          {subtitulo ? <Text style={styles.chatSub} numberOfLines={1}>{subtitulo}</Text> : null}
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        ref={scroll}
        style={styles.flex}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {mensajes.length === 0 && <Text style={styles.empty}>Escribe el primer mensaje.</Text>}
        {mensajes.map((m) => {
          const mio = m.autor_id === userId;
          return (
            <View key={m.id} style={[styles.bubble, mio ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={mio ? styles.textMine : styles.textTheirs}>{m.texto}</Text>
              <Text style={[styles.time, mio && { color: "#E3F2FD" }]}>{hora(m.created_at)}</Text>
            </View>
          );
        })}
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Escribe un mensaje"
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={enviar}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.send} onPress={enviar} activeOpacity={0.8}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(() => StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { flex: 1, alignItems: "center" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: col.texto },
  chatTitle: { fontSize: 18, fontWeight: "800", color: col.texto },
  chatSub: { fontSize: 12, color: col.textoTer },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 24 },
  empty: { textAlign: "center", color: col.textoTer, marginTop: 24, paddingHorizontal: 20 },
  error: { color: "#D32F2F", fontSize: 13, textAlign: "center", marginVertical: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: col.tarjeta,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 14,
    ...sombra(col),
  },
  avatarTexto: { fontSize: 20, fontWeight: "800", color: "#fff" },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  nombre: { fontSize: 16, fontWeight: "600", color: col.texto },
  preview: { fontSize: 13, color: col.textoTer },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F44336",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  messages: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  bubble: { maxWidth: "78%", borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: "#2196F3", borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: "flex-start", backgroundColor: col.superficie, borderBottomLeftRadius: 4 },
  textMine: { color: "#fff", fontSize: 15 },
  textTheirs: { color: col.texto, fontSize: 15 },
  time: { fontSize: 10, color: col.textoTer, alignSelf: "flex-end", marginTop: 2 },
  // El panel llega hasta detrás de la barra de navegación: se deja espacio para que el campo no quede tapado.
  composer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "center",
  },
  composerInput: {
    color: col.texto,
    flex: 1,
    backgroundColor: col.superficie,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
}), [col]);
};
