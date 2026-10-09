import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity } from "react-native";

import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Encabezado, useEstilosConfig } from "./comun";

const PREGUNTAS = [
  {
    p: "¿Cómo publico una pensión?",
    r: "Con una cuenta de propietario, entra a Residencias → Registrar Residencia, marca la ubicación en el mapa, completa los datos y agrega las habitaciones. Después, en Mis Residencias, pulsa «Enviar a revisión»: un administrador verificará la pensión y se comunicará contigo por teléfono. Cuando la apruebe, quedará publicada en el mapa.",
  },
  {
    p: "¿Cómo contacto a un propietario?",
    r: "Toca el pin de la pensión en el mapa y luego «Chatear con el propietario». También puedes llamar al teléfono que aparece en la información.",
  },
  {
    p: "No veo mi pensión en el mapa",
    r: "Revisa su estado en Mis Residencias. Debe decir «Publicada». Si dice «En revisión», un administrador aún la está verificando; si fue rechazada verás el motivo y podrás corregirla y reenviarla.",
  },
];

export default function SoportePanel({ onBack }: { onBack: () => void }) {
  const s = useEstilosConfig();
  const { session } = useAuth();
  const [abierta, setAbierta] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const enviar = async () => {
    if (!mensaje.trim()) return setAviso({ tipo: "error", texto: "Escribe tu mensaje." });
    const { error } = await supabase.from("soporte").insert({ usuario_id: session!.user.id, mensaje: mensaje.trim() });
    if (error) return setAviso({ tipo: "error", texto: error.message });
    setMensaje("");
    setAviso({ tipo: "ok", texto: "Mensaje enviado. Te responderemos pronto." });
  };

  return (
    <>
      <Encabezado titulo="Soporte" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.seccion}>Preguntas frecuentes</Text>
        {PREGUNTAS.map((q, i) => (
          <TouchableOpacity key={q.p} onPress={() => setAbierta(abierta === i ? null : i)} activeOpacity={0.7}>
            <Text style={[s.texto, { fontWeight: "700" }]}>
              {abierta === i ? "▾" : "▸"} {q.p}
            </Text>
            {abierta === i && <Text style={s.texto}>{q.r}</Text>}
          </TouchableOpacity>
        ))}

        <Text style={s.seccion}>Escríbenos</Text>
        <TextInput
          style={[s.input, { height: 120, textAlignVertical: "top" }]}
          placeholder="Cuéntanos tu problema o sugerencia"
          value={mensaje}
          onChangeText={setMensaje}
          multiline
        />
        {aviso && <Text style={aviso.tipo === "ok" ? s.ok : s.error}>{aviso.texto}</Text>}
        <TouchableOpacity style={s.boton} onPress={enviar}>
          <Text style={s.botonTexto}>Enviar</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
