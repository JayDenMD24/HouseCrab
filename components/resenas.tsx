import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Chips } from "@/components/chips";
import Stars from "@/components/stars";
import type { RolPerfil } from "@/lib/auth";
import {
  DatosResenas,
  MAX_COMENTARIO,
  MOTIVOS_REPORTE,
  MotivoReporte,
  Resena,
  guardarResena,
  moderarRespuesta,
  moderarResena,
  reportarResena,
  responderResena,
} from "@/lib/resenas";
import { useColores } from "@/lib/tema";

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

type Contexto = {
  userId: string;
  esAdmin: boolean;
  esPropietario: boolean;
  onCambio: () => void | Promise<void>;
};

export default function SeccionResenas({
  pensionId,
  userId,
  rol,
  esPropietario,
  datos,
  onCambio,
}: {
  pensionId: string;
  userId: string;
  rol: RolPerfil | undefined;
  esPropietario: boolean;
  datos: DatosResenas | null;
  onCambio: () => void | Promise<void>;
}) {
  const styles = useStyles();
  const col = useColores();
  const esEstudiante = rol === "estudiante";
  const ctx: Contexto = { userId, esAdmin: rol === "admin", esPropietario, onCambio };

  const mia = datos?.mia ?? null;
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Carga en el formulario la reseña propia cuando llega de la base de datos.
  useEffect(() => {
    setEstrellas(mia?.estrellas ?? 0);
    setComentario(mia?.comentario ?? "");
  }, [mia?.id, mia?.estrellas, mia?.comentario]);

  const guardar = async () => {
    if (estrellas < 1) return setAviso({ ok: false, texto: "Elige de 1 a 5 estrellas." });
    setGuardando(true);
    setAviso(null);
    try {
      await guardarResena(pensionId, userId, estrellas, comentario);
      await onCambio();
      setAviso({ ok: true, texto: mia ? "Reseña actualizada." : "¡Gracias por tu reseña!" });
    } catch (e: any) {
      setAviso({ ok: false, texto: e.message });
    } finally {
      setGuardando(false);
    }
  };

  const otras = (datos?.resenas ?? []).filter((r) => r.autor_id !== userId);

  return (
    <View style={styles.box}>
      {esEstudiante && (
        <View style={styles.form}>
          <Text style={styles.section}>{mia ? "Tu reseña" : "Califica esta pensión"}</Text>
          {mia?.moderada ? (
            <Text style={styles.nota}>Tu comentario fue eliminado por moderación y ya no puedes editar tu reseña.</Text>
          ) : mia?.comentario_en_revision ? (
            <Text style={styles.nota}>
              Tu comentario está oculto temporalmente porque recibió varios reportes. Un administrador lo revisará y,
              mientras tanto, no puedes editar tu reseña.
            </Text>
          ) : (
            <>
              <Stars valor={estrellas} onChange={setEstrellas} size={32} />
              <TextInput
                style={styles.input}
                placeholder="Cuéntanos tu experiencia (opcional)"
                placeholderTextColor={col.textoTer}
                value={comentario}
                onChangeText={(t) => setComentario(t.slice(0, MAX_COMENTARIO))}
                multiline
              />
              <Text style={styles.counter}>{comentario.length}/{MAX_COMENTARIO} · Tu nombre y tu comentario serán públicos.</Text>
              {aviso && <Text style={aviso.ok ? styles.ok : styles.error}>{aviso.texto}</Text>}
              <TouchableOpacity style={[styles.btn, guardando && { opacity: 0.6 }]} onPress={guardar} disabled={guardando}>
                <Text style={styles.btnText}>{mia ? "Actualizar reseña" : "Publicar reseña"}</Text>
              </TouchableOpacity>
            </>
          )}
          {mia && <Respuesta r={mia} ctx={ctx} />}
        </View>
      )}

      <Text style={styles.section}>Comentarios</Text>
      {otras.length === 0 && (
        <Text style={styles.empty}>{mia ? "Aún no hay reseñas de otros estudiantes." : "Aún no hay reseñas."}</Text>
      )}
      {otras.map((r) => (
        <Tarjeta key={r.id} r={r} ctx={ctx} />
      ))}
    </View>
  );
}

function Tarjeta({ r, ctx }: { r: Resena; ctx: Contexto }) {
  const styles = useStyles();
  const [reportando, setReportando] = useState(false);

  const eliminarComentario = async () => {
    if (!window.confirm(`¿Eliminar el comentario de ${r.autor_nombre}? No se puede deshacer.`)) return;
    try {
      await moderarResena(r.id);
      await ctx.onCambio();
    } catch (e: any) {
      window.alert(e.message);
    }
  };

  return (
    <View style={styles.review}>
      <View style={styles.reviewHeader}>
        <Text style={styles.autor}>{r.autor_nombre}</Text>
        <Text style={styles.fecha}>{fecha(r.created_at)}</Text>
      </View>
      <View style={{ alignSelf: "flex-start" }}>
        <Stars valor={r.estrellas} size={16} />
      </View>
      {r.comentario ? <Text style={styles.comentario}>{r.comentario}</Text> : null}
      {r.moderada && <Text style={styles.nota}>Comentario eliminado por moderación.</Text>}
      {r.comentario_en_revision && (
        <Text style={styles.nota}>Comentario oculto temporalmente: está en revisión por reportes.</Text>
      )}

      {r.comentario ? (
        ctx.esAdmin ? (
          <TouchableOpacity onPress={eliminarComentario}>
            <Text style={styles.peligro}>Eliminar comentario</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setReportando(!reportando)}>
            <Text style={styles.enlace}>{reportando ? "Cancelar" : "Reportar comentario"}</Text>
          </TouchableOpacity>
        )
      ) : null}
      {reportando && <Reportar r={r} tipo="comentario" onListo={() => setReportando(false)} />}

      <Respuesta r={r} ctx={ctx} />
    </View>
  );
}

// Respuesta del propietario: se muestra si existe y el dueño de la pensión puede escribirla o editarla.
function Respuesta({ r, ctx }: { r: Resena; ctx: Contexto }) {
  const styles = useStyles();
  const col = useColores();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(r.respuesta ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportando, setReportando] = useState(false);

  const guardar = async (valor: string) => {
    setGuardando(true);
    setError(null);
    try {
      await responderResena(r.id, valor);
      await ctx.onCambio();
      setEditando(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarComoAdmin = async () => {
    if (!window.confirm("¿Eliminar la respuesta del propietario? No se puede deshacer.")) return;
    try {
      await moderarRespuesta(r.id);
      await ctx.onCambio();
    } catch (e: any) {
      window.alert(e.message);
    }
  };

  const puedeResponder = ctx.esPropietario && !r.respuesta_moderada;

  if (editando) {
    return (
      <View style={styles.respuesta}>
        <Text style={styles.respuestaTitulo}>Tu respuesta</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe una respuesta pública y respetuosa"
          placeholderTextColor={col.textoTer}
          value={texto}
          onChangeText={(t) => setTexto(t.slice(0, MAX_COMENTARIO))}
          multiline
          autoFocus
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.fila}>
          <TouchableOpacity
            style={[styles.btnChico, guardando && { opacity: 0.6 }]}
            disabled={guardando}
            onPress={() => guardar(texto)}
          >
            <Text style={styles.btnText}>Publicar respuesta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setEditando(false);
              setTexto(r.respuesta ?? "");
            }}
          >
            <Text style={styles.enlace}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!r.respuesta) {
    return (
      <>
        {r.respuesta_moderada && <Text style={styles.nota}>Respuesta eliminada por moderación.</Text>}
        {r.respuesta_en_revision && (
          <Text style={styles.nota}>
            {ctx.esPropietario
              ? "Tu respuesta está oculta temporalmente por reportes; un administrador la revisará."
              : "Respuesta del propietario oculta temporalmente: está en revisión por reportes."}
          </Text>
        )}
        {puedeResponder && !r.respuesta_en_revision && (
          <TouchableOpacity onPress={() => setEditando(true)}>
            <Text style={styles.enlace}>Responder</Text>
          </TouchableOpacity>
        )}
      </>
    );
  }

  return (
    <View style={styles.respuesta}>
      <Text style={styles.respuestaTitulo}>
        Respuesta del propietario{r.respuesta_en ? ` · ${fecha(r.respuesta_en)}` : ""}
      </Text>
      <Text style={styles.comentario}>{r.respuesta}</Text>
      <View style={styles.fila}>
        {ctx.esPropietario ? (
          <>
            <TouchableOpacity onPress={() => setEditando(true)}>
              <Text style={styles.enlace}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => window.confirm("¿Eliminar tu respuesta?") && guardar("")}
            >
              <Text style={styles.peligro}>Eliminar</Text>
            </TouchableOpacity>
          </>
        ) : ctx.esAdmin ? (
          <TouchableOpacity onPress={eliminarComoAdmin}>
            <Text style={styles.peligro}>Eliminar respuesta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setReportando(!reportando)}>
            <Text style={styles.enlace}>{reportando ? "Cancelar" : "Reportar respuesta"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {reportando && <Reportar r={r} tipo="respuesta" onListo={() => setReportando(false)} />}
    </View>
  );
}

function Reportar({
  r,
  tipo,
  onListo,
}: {
  r: Resena;
  tipo: "comentario" | "respuesta";
  onListo: () => void;
}) {
  const styles = useStyles();
  const col = useColores();
  const [motivo, setMotivo] = useState<MotivoReporte>("ofensivo");
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const nombres = Object.values(MOTIVOS_REPORTE);
  const porNombre = (n: string) => (Object.keys(MOTIVOS_REPORTE) as MotivoReporte[]).find((m) => MOTIVOS_REPORTE[m] === n)!;

  const enviar = async () => {
    setEnviando(true);
    setAviso(null);
    try {
      await reportarResena(r.id, tipo, motivo, detalle);
      setAviso({ ok: true, texto: "Reporte enviado. Un administrador lo revisará. Gracias." });
      setTimeout(onListo, 1800);
    } catch (e: any) {
      setAviso({ ok: false, texto: e.message });
      setEnviando(false);
    }
  };

  return (
    <View style={styles.reporte}>
      <Text style={styles.respuestaTitulo}>¿Por qué lo reportas?</Text>
      <Chips opciones={nombres} seleccion={[MOTIVOS_REPORTE[motivo]]} onToggle={(n) => setMotivo(porNombre(n))} />
      <TextInput
        style={[styles.input, { minHeight: 56 }]}
        placeholder="Detalles (opcional)"
        placeholderTextColor={col.textoTer}
        value={detalle}
        onChangeText={(t) => setDetalle(t.slice(0, 500))}
        multiline
      />
      {aviso && <Text style={aviso.ok ? styles.ok : styles.error}>{aviso.texto}</Text>}
      {!aviso?.ok && (
        <TouchableOpacity style={[styles.btnChico, enviando && { opacity: 0.6 }]} onPress={enviar} disabled={enviando}>
          <Text style={styles.btnText}>Enviar reporte</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        box: { gap: 8, marginTop: 8 },
        form: { gap: 6, backgroundColor: col.superficie, borderRadius: 12, padding: 12 },
        section: { fontSize: 16, fontWeight: "700", color: col.texto },
        input: {
          minHeight: 80,
          borderWidth: 1,
          borderColor: col.borde,
          borderRadius: 8,
          padding: 10,
          fontSize: 15,
          color: col.texto,
          backgroundColor: col.tarjeta,
          textAlignVertical: "top",
        },
        counter: { fontSize: 11, color: col.textoTer },
        ok: { color: "#2E7D32", fontSize: 13 },
        error: { color: "#D32F2F", fontSize: 13 },
        btn: { backgroundColor: "#2196F3", borderRadius: 24, paddingVertical: 10, alignItems: "center" },
        btnChico: { backgroundColor: "#2196F3", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, alignSelf: "flex-start" },
        btnText: { color: "#fff", fontWeight: "700" },
        empty: { color: col.textoTer, fontSize: 14 },
        review: { backgroundColor: col.superficie, borderRadius: 10, padding: 10, gap: 4 },
        reviewHeader: { flexDirection: "row", justifyContent: "space-between" },
        autor: { fontSize: 14, fontWeight: "700", color: col.texto },
        fecha: { fontSize: 12, color: col.textoTer },
        comentario: { fontSize: 14, color: col.textoSec, lineHeight: 20 },
        nota: { fontSize: 12, fontStyle: "italic", color: col.textoTer },
        enlace: { fontSize: 13, color: "#2196F3", fontWeight: "600" },
        peligro: { fontSize: 13, color: "#E53935", fontWeight: "600" },
        fila: { flexDirection: "row", gap: 16, alignItems: "center" },
        respuesta: {
          gap: 4,
          marginTop: 6,
          marginLeft: 8,
          paddingLeft: 10,
          borderLeftWidth: 3,
          borderLeftColor: "#2196F3",
        },
        respuestaTitulo: { fontSize: 12, fontWeight: "700", color: col.texto },
        reporte: { gap: 6, marginTop: 4, backgroundColor: col.tarjeta, borderRadius: 8, padding: 10 },
      }),
    [col],
  );
};
