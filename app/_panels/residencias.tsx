import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Chips } from "@/components/chips";
import { Encabezado } from "@/components/config/comun";
import LocationPicker, { Coords } from "@/components/location-picker";
import PhotoPicker from "@/components/photo-picker";
import { Boton, EstadoVacio, Insignia, Tarjeta } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  COMODIDADES,
  DIAS,
  Pension,
  TIPOS_CAMA,
  TIPOS_PENSION,
  actualizarPension,
  cambiarPublicacion,
  crearPension,
  direccionDesde,
  eliminarPension,
  formatoPrecio,
  listarMias,
  precioDesde,
  solicitarRevision,
} from "@/lib/pensiones";
import { Foto, subirFoto } from "@/lib/storage";
import { radios, useColores } from "@/lib/tema";

type Vista = "mis" | "registrar" | "editar";

export default function ResidenciasPanel({ onChange }: { onChange?: () => void }) {
  const { profile } = useAuth();
  const [vista, setVista] = useState<Vista>("mis");
  const [editando, setEditando] = useState<Pension | null>(null);

  if (profile?.rol !== "arrendatario") {
    return (
      <EstadoVacio
        icono="business-outline"
        titulo="Sección para arrendatarios"
        texto="Usa el mapa y el buscador para encontrar pensiones."
      />
    );
  }

  if (vista === "registrar" || vista === "editar") {
    return (
      <FormularioPension
        key={editando?.id ?? "nueva"}
        pension={vista === "editar" ? editando : null}
        onCancel={() => setVista("mis")}
        onDone={() => {
          onChange?.();
          setVista("mis");
        }}
      />
    );
  }

  return (
    <MisPensiones
      onAdd={() => {
        setEditando(null);
        setVista("registrar");
      }}
      onEdit={(p) => {
        setEditando(p);
        setVista("editar");
      }}
      onChange={onChange}
    />
  );
}

// ── Mis Pensiones ────────────────────────────────────────────────────────────
function MisPensiones({
  onAdd,
  onEdit,
  onChange,
}: {
  onAdd: () => void;
  onEdit: (p: Pension) => void;
  onChange?: () => void;
}) {
  const styles = useStyles();
  const col = useColores();
  const { session } = useAuth();
  const [pensiones, setPensiones] = useState<Pension[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.user.id;

  const cargar = useCallback(async () => {
    if (!userId) return;
    try {
      setPensiones(await listarMias(userId));
    } catch (e: any) {
      setError(e.message);
    }
  }, [userId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alternar = async (p: Pension) => {
    await cambiarPublicacion(p.id, !p.publicada);
    await cargar();
    onChange?.();
  };

  const enviarARevision = async (p: Pension) => {
    if (!p.telefono) {
      return window.alert(
        "Antes de enviarla a revisión agrega un teléfono con Editar: el administrador te contactará para verificarla.",
      );
    }
    try {
      await solicitarRevision(p.id);
      await cargar();
      window.alert("Enviada a revisión. Un administrador se comunicará contigo al teléfono registrado antes de publicarla.");
    } catch (e: any) {
      window.alert(e.message);
    }
  };

  const borrar = async (p: Pension) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    await eliminarPension(p.id);
    await cargar();
    onChange?.();
  };

  const estado = (p: Pension) => {
    if (p.estado === "aprobada") {
      return p.publicada
        ? { texto: "Publicada", tono: "ok" as const, icono: "checkmark-circle" as const }
        : { texto: "Aprobada · sin publicar", tono: "info" as const, icono: "eye-off" as const };
    }
    if (p.estado === "pendiente") return { texto: "En revisión", tono: "aviso" as const, icono: "time" as const };
    if (p.estado === "rechazada") return { texto: "Rechazada", tono: "error" as const, icono: "close-circle" as const };
    return { texto: "Borrador", tono: "neutro" as const, icono: "create" as const };
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>Mis pensiones</Text>
        <Boton titulo="Nueva" icono="add" chico onPress={onAdd} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {pensiones === null && !error && <Text style={styles.vacioTexto}>Cargando…</Text>}
      {pensiones?.length === 0 && (
        <EstadoVacio
          icono="business-outline"
          titulo="Aún no tienes pensiones"
          texto="Registra tu primera pensión: un administrador la revisará antes de publicarla en el mapa."
        />
      )}

      {pensiones?.map((p) => {
        const desde = precioDesde(p);
        const est = estado(p);
        return (
          <Tarjeta key={p.id} style={styles.card}>
            <View style={styles.foto}>
              {p.foto_url ? (
                <Image source={{ uri: p.foto_url }} style={styles.fotoImg} resizeMode="cover" />
              ) : (
                <View style={styles.fotoVacia}>
                  <Ionicons name="home" size={40} color={col.primario} />
                </View>
              )}
              <View style={styles.fotoEstado}>
                <Insignia texto={est.texto} tono={est.tono} icono={est.icono} />
              </View>
            </View>

            <View style={styles.cardCabecera}>
              <View style={styles.flex}>
                <Text style={styles.cardTitulo}>{p.nombre}</Text>
                <View style={styles.fila}>
                  <Ionicons name="location-outline" size={14} color={col.textoTer} />
                  <Text style={styles.cardTexto} numberOfLines={1}>
                    {p.direccion}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => borrar(p)} accessibilityLabel="Eliminar" style={styles.borrar}>
                <Ionicons name="trash-outline" size={19} color="#E53935" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTexto}>
              {p.habitaciones.length} habitación{p.habitaciones.length === 1 ? "" : "es"}
              {desde ? ` · desde ${formatoPrecio(desde)}` : ""}
            </Text>

            {p.estado === "rechazada" && (
              <View style={styles.rechazo}>
                <Text style={styles.rechazoTexto}>Motivo del rechazo: {p.motivo_rechazo ?? "sin motivo"}</Text>
              </View>
            )}
            {p.estado === "pendiente" && (
              <Text style={styles.cardTexto}>Un administrador se comunicará contigo al teléfono registrado.</Text>
            )}

            <View style={styles.acciones}>
              {p.estado === "aprobada" ? (
                <Boton
                  titulo={p.publicada ? "Despublicar" : "Publicar"}
                  variante={p.publicada ? "secundario" : "exito"}
                  chico
                  onPress={() => alternar(p)}
                  style={{ flex: 1 }}
                />
              ) : p.estado === "pendiente" ? (
                <Boton titulo="En revisión…" variante="secundario" chico deshabilitado style={{ flex: 1 }} />
              ) : (
                <Boton
                  titulo={p.estado === "rechazada" ? "Reenviar a revisión" : "Enviar a revisión"}
                  chico
                  onPress={() => enviarARevision(p)}
                  style={{ flex: 1 }}
                />
              )}
              <Boton titulo="Editar" icono="create-outline" variante="secundario" chico onPress={() => onEdit(p)} />
            </View>
          </Tarjeta>
        );
      })}
    </ScrollView>
  );
}

// ── Registrar / Editar Pensión ───────────────────────────────────────────────
const alternarEn = (lista: string[], v: string) =>
  lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v];

const fotoRemota = (url: string | null): Foto | null =>
  url ? { uri: url, mime: "image/jpeg", existente: true } : null;

function FormularioPension({
  pension,
  onCancel,
  onDone,
}: {
  pension: Pension | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const styles = useStyles();
  const col = useColores();
  const { session } = useAuth();
  const [nombre, setNombre] = useState(pension?.nombre ?? "");
  const [tipo, setTipo] = useState(pension?.tipo ?? TIPOS_PENSION[0]);
  const [telefono, setTelefono] = useState(pension?.telefono ?? "");
  const [direccion, setDireccion] = useState(pension?.direccion ?? "");
  const [dias, setDias] = useState<string[]>(pension?.dias_alimentacion ?? []);
  const [comodidades, setComodidades] = useState<string[]>(pension?.comodidades ?? []);
  const [comentarios, setComentarios] = useState(pension?.comentarios ?? "");
  const [fotoPension, setFotoPension] = useState<Foto | null>(fotoRemota(pension?.foto_url ?? null));
  const [habitaciones, setHabitaciones] = useState<
    { tipo_cama: string; cantidad_personas: number; precio: number; foto: Foto | null }[]
  >(
    pension?.habitaciones.map((h) => ({
      tipo_cama: h.tipo_cama ?? TIPOS_CAMA[0],
      cantidad_personas: h.cantidad_personas,
      precio: Number(h.precio),
      foto: fotoRemota(h.foto_url),
    })) ?? [],
  );
  const [fotoHab, setFotoHab] = useState<Foto | null>(null);
  const [tipoCama, setTipoCama] = useState(TIPOS_CAMA[0]);
  const [personas, setPersonas] = useState("1");
  const [precio, setPrecio] = useState("");
  const [coords, setCoords] = useState<Coords | null>(pension ? { lat: pension.latitud, lng: pension.longitud } : null);
  // Mientras la dirección sea la autocompletada desde el mapa, se actualiza al mover el pin;
  // si el usuario la edita a mano, se respeta.
  const [dirAuto, setDirAuto] = useState(!pension);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const agregarHabitacion = () => {
    const pr = Number(precio.replace(/\D/g, ""));
    const pe = Number(personas);
    if (!pr || !pe) return setError("Indica el precio y la cantidad de personas de la habitación.");
    setError(null);
    setHabitaciones([...habitaciones, { tipo_cama: tipoCama, cantidad_personas: pe, precio: pr, foto: fotoHab }]);
    setPrecio("");
    setFotoHab(null);
  };

  const elegirUbicacion = async (c: Coords) => {
    setCoords(c);
    if (!dirAuto) return;
    const dir = await direccionDesde(c.lat, c.lng);
    if (dir) setDireccion(dir);
  };

  const registrar = async () => {
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!coords) return setError("Marca la ubicación de la pensión en el mapa.");
    if (!direccion.trim()) return setError("Escribe la dirección o referencia del lugar.");
    if (!habitaciones.length) return setError("Agrega al menos una habitación.");
    if (!session) return;

    setEnviando(true);
    setError(null);

    try {
      const datos = {
        nombre: nombre.trim(),
        tipo,
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        comentarios: comentarios.trim(),
        comodidades,
        dias_alimentacion: dias,
        latitud: coords.lat,
        longitud: coords.lng,
        foto_url: fotoPension ? await subirFoto(session.user.id, fotoPension) : null,
        habitaciones: await Promise.all(
          habitaciones.map(async ({ foto, ...h }) => ({
            ...h,
            foto_url: foto ? await subirFoto(session.user.id, foto) : null,
          })),
        ),
      };
      if (pension) await actualizarPension(pension.id, datos);
      else await crearPension(session.user.id, datos);
      onDone();
    } catch (e: any) {
      setError(e.message);
      setEnviando(false);
    }
  };

  const campo = (placeholder: string, valor: string, set: (t: string) => void, extra?: object) => (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={col.textoTer}
      value={valor}
      onChangeText={set}
      {...extra}
    />
  );

  return (
    <>
      <Encabezado titulo={pension ? "Editar pensión" : "Nueva pensión"} onBack={onCancel} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {pension?.estado === "aprobada" && (
          <View style={styles.aviso}>
            <Ionicons name="information-circle" size={18} color="#B26A00" />
            <Text style={styles.avisoTexto}>
              Si cambias los datos de la pensión (nombre, ubicación, teléfono, fotos, etc.) volverá a revisión y dejará
              de estar publicada hasta que un administrador la apruebe. Cambiar solo las habitaciones no requiere
              revisión.
            </Text>
          </View>
        )}

        <Tarjeta style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información básica</Text>
          {campo("Nombre del lugar", nombre, setNombre)}
          <Text style={styles.label}>Tipo</Text>
          <Chips opciones={TIPOS_PENSION} seleccion={[tipo]} onToggle={setTipo} />
          {campo("Teléfono de contacto", telefono, setTelefono, { keyboardType: "phone-pad" })}
          {campo("Descripción o comentarios", comentarios, setComentarios, { multiline: true, style: [styles.input, styles.multilinea] })}
        </Tarjeta>

        <Tarjeta style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Foto y ubicación</Text>
          <PhotoPicker value={fotoPension} onChange={setFotoPension} label="Agregar foto de la pensión" height={170} />
          <LocationPicker value={coords} onChange={elegirUbicacion} />
          {campo("Dirección (se completa al marcar el mapa)", direccion, (t) => {
            setDirAuto(false);
            setDireccion(t);
          })}
        </Tarjeta>

        <Tarjeta style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Servicios</Text>
          <Text style={styles.label}>Días de alimentación</Text>
          <Chips opciones={DIAS} seleccion={dias} onToggle={(d) => setDias(alternarEn(dias, d))} />
          <Text style={styles.label}>Comodidades</Text>
          <Chips opciones={COMODIDADES} seleccion={comodidades} onToggle={(c) => setComodidades(alternarEn(comodidades, c))} />
        </Tarjeta>

        <Tarjeta style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Habitaciones</Text>
          {habitaciones.map((h, i) => (
            <View key={i} style={styles.habRow}>
              <Ionicons name="bed-outline" size={20} color={col.primario} />
              <Text style={[styles.cardTexto, styles.flex]}>
                {h.tipo_cama} · {h.cantidad_personas} persona{h.cantidad_personas === 1 ? "" : "s"} ·{" "}
                {formatoPrecio(h.precio)}
                {h.foto ? " · con foto" : ""}
              </Text>
              <TouchableOpacity
                onPress={() => setHabitaciones(habitaciones.filter((_, j) => j !== i))}
                accessibilityLabel="Quitar habitación"
              >
                <Ionicons name="close-circle" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.label}>Agregar habitación</Text>
          <Chips opciones={TIPOS_CAMA} seleccion={[tipoCama]} onToggle={setTipoCama} />
          <View style={styles.row2}>
            {campo("Personas", personas, setPersonas, { keyboardType: "numeric", style: [styles.input, styles.flex] })}
            {campo("Precio por mes", precio, setPrecio, { keyboardType: "numeric", style: [styles.input, styles.flex] })}
          </View>
          <PhotoPicker value={fotoHab} onChange={setFotoHab} label="Foto de la habitación (opcional)" height={90} />
          <Boton titulo="Agregar habitación" icono="add" variante="secundario" chico onPress={agregarHabitacion} style={{ alignSelf: "flex-start" }} />
        </Tarjeta>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.row2}>
          <Boton titulo="Cancelar" variante="secundario" onPress={onCancel} style={{ flex: 1 }} />
          <Boton
            titulo={pension ? "Guardar" : "Registrar"}
            icono="checkmark"
            onPress={registrar}
            cargando={enviando}
            style={{ flex: 1.4 }}
          />
        </View>
      </ScrollView>
    </>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1 },
        content: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
        flex: { flex: 1 },
        fila: { flexDirection: "row", alignItems: "center", gap: 4 },
        row2: { flexDirection: "row", gap: 10 },
        cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
        titulo: { fontSize: 24, fontWeight: "800", color: col.texto },
        vacioTexto: { textAlign: "center", color: col.textoTer, marginTop: 16 },
        error: { color: "#D32F2F", fontSize: 13 },
        card: { gap: 8 },
        foto: { aspectRatio: 16 / 9, maxHeight: 240, borderRadius: radios.md, overflow: "hidden", backgroundColor: col.azulSuave },
        fotoImg: { width: "100%", height: "100%" },
        fotoVacia: { flex: 1, alignItems: "center", justifyContent: "center" },
        fotoEstado: { position: "absolute", left: 10, top: 10, backgroundColor: col.tarjeta, borderRadius: 12 },
        cardCabecera: { flexDirection: "row", alignItems: "center", gap: 8 },
        cardTitulo: { fontSize: 18, fontWeight: "800", color: col.texto },
        cardTexto: { fontSize: 13, color: col.textoSec },
        borrar: { padding: 8 },
        rechazo: { backgroundColor: col.oscuro ? "#3A1515" : "#FDECEA", borderRadius: radios.md, padding: 10 },
        rechazoTexto: { fontSize: 13, color: col.oscuro ? "#FF8A80" : "#C62828" },
        acciones: { flexDirection: "row", gap: 10, marginTop: 4 },
        aviso: {
          flexDirection: "row",
          gap: 8,
          backgroundColor: col.oscuro ? "#3A2A10" : "#FFF3E0",
          borderRadius: radios.md,
          padding: 12,
        },
        avisoTexto: { flex: 1, fontSize: 13, lineHeight: 19, color: col.oscuro ? "#FFB74D" : "#8A5300" },
        seccion: { gap: 10 },
        seccionTitulo: { fontSize: 16, fontWeight: "800", color: col.texto },
        label: { fontSize: 13, fontWeight: "700", color: col.textoSec },
        input: {
          color: col.texto,
          borderWidth: 1,
          borderColor: col.borde,
          borderRadius: radios.md,
          paddingHorizontal: 12,
          paddingVertical: 11,
          fontSize: 15,
          backgroundColor: col.fondo,
        },
        multilinea: {
          color: col.texto,
          borderWidth: 1,
          borderColor: col.borde,
          borderRadius: radios.md,
          paddingHorizontal: 12,
          paddingVertical: 11,
          fontSize: 15,
          backgroundColor: col.fondo,
          minHeight: 84,
          textAlignVertical: "top",
        },
        habRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: col.superficie,
          borderRadius: radios.md,
          padding: 10,
        },
      }),
    [col],
  );
};
