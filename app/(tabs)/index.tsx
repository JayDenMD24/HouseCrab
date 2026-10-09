import { useRouter } from "expo-router";

import { PantallaAuth } from "@/components/auth-ui";
import { Boton } from "@/components/ui";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <PantallaAuth
      grande
      titulo="HouseCrab"
      subtitulo="Encuentra y publica pensiones universitarias en el mapa."
    >
      <Boton titulo="Iniciar sesión" onPress={() => router.push("/(tabs)/login")} />
      <Boton titulo="Crear una cuenta" variante="secundario" onPress={() => router.push("/(tabs)/registro")} />
    </PantallaAuth>
  );
}
