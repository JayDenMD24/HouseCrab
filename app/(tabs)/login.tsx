import { useRouter } from "expo-router";
import { useState } from "react";

import { Campo, MensajeError, PantallaAuth, Separador } from "@/components/auth-ui";
import { Boton } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !password) {
      setError("Completa el correo y la contraseña.");
      return;
    }
    setEnviando(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    setEnviando(false);
    if (err) setError(err);
    // Si todo sale bien, AuthGate redirige al mapa.
  };

  return (
    <PantallaAuth
      titulo="Iniciar sesión"
      subtitulo="Bienvenido de vuelta a HouseCrab."
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
    >
      <Campo
        icono="mail-outline"
        etiqueta="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="tucorreo@ejemplo.com"
      />
      <Campo
        icono="lock-closed-outline"
        etiqueta="Contraseña"
        value={password}
        onChangeText={setPassword}
        password
        onSubmitEditing={entrar}
        placeholder="Tu contraseña"
      />

      {error && <MensajeError texto={error} />}

      <Boton titulo="Iniciar sesión" onPress={entrar} cargando={enviando} />
      <Separador texto="o" />
      <Boton
        titulo="Continuar con Google"
        icono="logo-google"
        variante="secundario"
        onPress={async () => setError(await signInWithGoogle())}
      />
    </PantallaAuth>
  );
}
