import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { fechaISO, isoAFecha } from "@/lib/fechas";
import { listarMias } from "@/lib/pensiones";
import { borrarFotos } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { Encabezado, useEstilosConfig } from "./comun";

type Aviso = { tipo: "ok" | "error"; texto: string } | null;

export default function CuentaPanel({ onBack }: { onBack: () => void }) {
  const s = useEstilosConfig();
  const { profile, session, refreshProfile, signOut } = useAuth();
  const [nombre, setNombre] = useState(profile?.nombre ?? "");
  const [fecha, setFecha] = useState(isoAFecha(profile?.fecha_nacimiento));
  const [avisoPerfil, setAvisoPerfil] = useState<Aviso>(null);

  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [avisoClave, setAvisoClave] = useState<Aviso>(null);

  const guardarPerfil = async () => {
    const iso = fecha.trim() ? fechaISO(fecha) : null;
    if (!nombre.trim()) return setAvisoPerfil({ tipo: "error", texto: "El nombre no puede estar vacío." });
    if (fecha.trim() && !iso) return setAvisoPerfil({ tipo: "error", texto: "La fecha debe tener el formato dd/mm/aaaa." });
    const { error } = await supabase
      .from("profiles")
      .update({ nombre: nombre.trim(), fecha_nacimiento: iso })
      .eq("id", session!.user.id);
    if (error) return setAvisoPerfil({ tipo: "error", texto: error.message });
    await refreshProfile();
    setAvisoPerfil({ tipo: "ok", texto: "Información actualizada." });
  };

  const cambiarClave = async () => {
    if (nueva.length < 6) return setAvisoClave({ tipo: "error", texto: "La contraseña debe tener al menos 6 caracteres." });
    if (nueva !== confirmar) return setAvisoClave({ tipo: "error", texto: "Las contraseñas no coinciden." });
    const { error } = await supabase.auth.updateUser({ password: nueva });
    if (error) return setAvisoClave({ tipo: "error", texto: error.message });
    setNueva("");
    setConfirmar("");
    setAvisoClave({ tipo: "ok", texto: "Contraseña actualizada." });
  };

  const eliminarCuenta = async () => {
    if (!window.confirm("¿Eliminar tu cuenta? Se borrarán tu perfil, tus pensiones y tus chats. Esta acción no se puede deshacer.")) return;
    try {
      // Las fotos del Storage no caen en cascada: se borran antes de eliminar la cuenta.
      const mias = await listarMias(session!.user.id);
      await borrarFotos(mias.flatMap((p) => [p.foto_url, ...p.habitaciones.map((h) => h.foto_url)]));
    } catch {
      /* no es crítico */
    }
    const { error } = await supabase.rpc("eliminar_mi_cuenta");
    if (error) return window.alert(`No se pudo eliminar la cuenta: ${error.message}`);
    await signOut();
  };

  const mostrar = (a: Aviso) =>
    a && <Text style={a.tipo === "ok" ? s.ok : s.error}>{a.texto}</Text>;

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Cuenta" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.seccion}>Información personal</Text>
        <Text style={s.label}>Nombre</Text>
        <TextInput style={s.input} value={nombre} onChangeText={setNombre} />
        <Text style={s.label}>Correo</Text>
        <TextInput style={[s.input, s.inputOff]} value={session?.user.email ?? ""} editable={false} />
        <Text style={s.label}>Rol</Text>
        <TextInput
          style={[s.input, s.inputOff]}
          value={profile?.rol === "admin" ? "Administrador" : profile?.rol === "arrendatario" ? "Arrendatario" : "Estudiante"}
          editable={false}
        />
        <Text style={s.label}>Fecha de nacimiento</Text>
        <TextInput style={s.input} placeholder="dd/mm/aaaa" value={fecha} onChangeText={setFecha} />
        {mostrar(avisoPerfil)}
        <TouchableOpacity style={s.boton} onPress={guardarPerfil}>
          <Text style={s.botonTexto}>Actualizar información</Text>
        </TouchableOpacity>

        <Text style={s.seccion}>Cambiar contraseña</Text>
        <TextInput style={s.input} placeholder="Nueva contraseña" secureTextEntry value={nueva} onChangeText={setNueva} />
        <TextInput
          style={s.input}
          placeholder="Confirmar contraseña"
          secureTextEntry
          value={confirmar}
          onChangeText={setConfirmar}
        />
        {mostrar(avisoClave)}
        <TouchableOpacity style={s.boton} onPress={cambiarClave}>
          <Text style={s.botonTexto}>Cambiar contraseña</Text>
        </TouchableOpacity>

        <Text style={s.seccion}>Sesión</Text>
        <TouchableOpacity style={s.botonRojo} onPress={signOut}>
          <Text style={s.botonTexto}>Cerrar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.botonBorde} onPress={eliminarCuenta}>
          <Text style={s.botonBordeTexto}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
