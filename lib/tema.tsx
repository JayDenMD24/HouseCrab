import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

export type Modo = "claro" | "oscuro" | "sistema";

export type Colores = {
  fondo: string; // pantallas y paneles
  tarjeta: string; // tarjetas, filas e inputs
  superficie: string; // burbujas, chips inactivos, zonas atenuadas
  texto: string;
  textoSec: string;
  textoTer: string;
  borde: string;
  azulSuave: string;
  primario: string;
  oscuro: boolean;
};

const CLARO: Colores = {
  fondo: "#F4F6FA",
  tarjeta: "#FFFFFF",
  superficie: "#EBEFF5",
  texto: "#14202E",
  textoSec: "#46566A",
  textoTer: "#8593A6",
  borde: "#E1E7EF",
  azulSuave: "#E6F2FE",
  primario: "#2196F3",
  oscuro: false,
};

const OSCURO: Colores = {
  fondo: "#0F141A",
  tarjeta: "#18202A",
  superficie: "#222C38",
  texto: "#EEF2F7",
  textoSec: "#B7C2D0",
  textoTer: "#7F8D9F",
  borde: "#2A3644",
  azulSuave: "#13283B",
  primario: "#2196F3",
  oscuro: true,
};

// Radios de borde comunes.
export const radios = { sm: 8, md: 12, lg: 16, xl: 24 } as const;

// Sombra suave en modo claro; en oscuro las sombras no se ven, así que se usa un borde sutil.
export const sombra = (col: Colores) =>
  col.oscuro
    ? ({ borderWidth: 1, borderColor: col.borde } as const)
    : ({
        shadowColor: "#0B1B33",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
      } as const);

const CLAVE = "housecrab_modo_tema";

type TemaContextValue = { modo: Modo; setModo: (m: Modo) => void; colores: Colores };

const TemaContext = createContext<TemaContextValue>({ modo: "sistema", setModo: () => {}, colores: CLARO });

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const sistema = useColorScheme();
  const [modo, setModoState] = useState<Modo>("sistema");

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((m) => {
        if (m === "claro" || m === "oscuro" || m === "sistema") setModoState(m);
      })
      .catch(() => {});
  }, []);

  const setModo = (m: Modo) => {
    setModoState(m);
    AsyncStorage.setItem(CLAVE, m).catch(() => {});
  };

  const oscuro = modo === "oscuro" || (modo === "sistema" && sistema === "dark");
  const colores = oscuro ? OSCURO : CLARO;

  // Web: oscurece también los mapas (los tiles de OpenStreetMap son claros) y el fondo de la página.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    let estilo = document.getElementById("tema-housecrab") as HTMLStyleElement | null;
    if (!estilo) {
      estilo = document.createElement("style");
      estilo.id = "tema-housecrab";
      document.head.appendChild(estilo);
    }
    estilo.textContent = oscuro
      ? ".leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.95) contrast(.9)}" +
        ".leaflet-container{background:#1a1a1a}body{background:#121212}"
      : "";
  }, [oscuro]);

  const valor = useMemo(() => ({ modo, setModo, colores }), [modo, colores]);
  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export const useTema = () => useContext(TemaContext);
export const useColores = () => useContext(TemaContext).colores;
