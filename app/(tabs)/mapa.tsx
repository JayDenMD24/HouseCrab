"use client";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

// ── Paneles ──────────────────────────────────────────────────────────────────
import AdminPanel from "../_panels/admin";
import BusquedaPanel from "../_panels/busqueda";
import ChatsPanel from "../_panels/chats";
import ConfiguracionPanel from "../_panels/configuracion";
import InfoPanel from "../_panels/info";
import ResidenciasPanel from "../_panels/residencias";
import { RolPerfil, useAuth } from "@/lib/auth";
import { abrirConversacion } from "@/lib/chat";
import {
  FILTROS_VACIOS,
  Filtros,
  Pension,
  filtrarPensiones,
  listarPublicadas,
  precioDesde,
} from "@/lib/pensiones";
import { radios, useColores } from "@/lib/tema";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const NAV_HEIGHT = 64;
const PANEL_TOP = 40; // el panel deja ver una franja del mapa por encima
const PANEL_OPEN = 0;
const PANEL_CLOSED = SCREEN_HEIGHT;
const SNAP_THRESHOLD = SCREEN_HEIGHT * 0.3;

// Escritorio: a partir de este ancho la app usa barra lateral + panel fijo + mapa, en lugar de la hoja inferior.
const BP_ESCRITORIO = 900;
const ANCHO_RAIL = 88;
const ANCHO_PANEL = 440;

// ── Barra de navegación según el rol ─────────────────────────────────────────
type Icono = keyof typeof Ionicons.glyphMap;
type Tab = { key: string; icono: Icono; activo: Icono; etiqueta: string };

const TAB_BUSCAR: Tab = { key: "search", icono: "search-outline", activo: "search", etiqueta: "Buscar" };
const TAB_CHATS: Tab = { key: "list", icono: "chatbubbles-outline", activo: "chatbubbles", etiqueta: "Chats" };
const TAB_AJUSTES: Tab = { key: "settings", icono: "settings-outline", activo: "settings", etiqueta: "Ajustes" };

function tabsPorRol(rol: RolPerfil | undefined): Tab[] {
  if (rol === "propietario") {
    return [
      TAB_BUSCAR,
      { key: "home", icono: "business-outline", activo: "business", etiqueta: "Mis pensiones" },
      TAB_CHATS,
      TAB_AJUSTES,
    ];
  }
  if (rol === "admin") {
    return [
      TAB_BUSCAR,
      { key: "home", icono: "shield-checkmark-outline", activo: "shield-checkmark", etiqueta: "Admin" },
      TAB_AJUSTES,
    ];
  }
  return [TAB_BUSCAR, TAB_CHATS, TAB_AJUSTES]; // estudiante
}

// ── Router de paneles ────────────────────────────────────────────────────────
// La pestaña "home": gestión de pensiones (propietario) o revisión (admin).
function HomePanel({ onChange }: { onChange: () => void }) {
  const { profile } = useAuth();
  return profile?.rol === "admin" ? <AdminPanel onChange={onChange} /> : <ResidenciasPanel onChange={onChange} />;
}

function PanelContent({
  tab,
  onClose,
  pension,
  onPensionesChange,
  busqueda,
  chatInicial,
  onChat,
}: {
  tab: string;
  onClose: () => void;
  pension: Pension | null;
  onPensionesChange: () => void;
  busqueda: React.ComponentProps<typeof BusquedaPanel>;
  chatInicial: string | null;
  onChat: (p: Pension) => void;
}) {
  switch (tab) {
    case "search":
      return <BusquedaPanel {...busqueda} />;
    case "settings":
      return <ConfiguracionPanel />;
    case "list":
      return <ChatsPanel key={chatInicial ?? "lista"} onClose={onClose} inicial={chatInicial} />;
    case "home":
      return <HomePanel onChange={onPensionesChange} />;
    case "info":
      return pension ? <InfoPanel pension={pension} onChat={onChat} onClose={onClose} /> : null;
    default:
      return null;
  }
}

// ── Mapa ─────────────────────────────────────────────────────────────────────
type ReactLeaflet = typeof import("react-leaflet");
type Leaflet = typeof import("leaflet");

// Centra el mapa en la pensión elegida desde la búsqueda.
function Enfocar({ rl, foco }: { rl: ReactLeaflet; foco: { lat: number; lng: number; n: number } | null }) {
  const map = rl.useMap();
  useEffect(() => {
    if (foco) map.flyTo([foco.lat, foco.lng], 16);
  }, [foco, map]);
  return null;
}

// Recalcula el tamaño del mapa cuando su contenedor cambia (p. ej. al abrir o cerrar el panel lateral).
function AjustarTamano({ rl }: { rl: ReactLeaflet }) {
  const map = rl.useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

// Etiqueta corta del precio para el pin: $700k, $1.2M.
function etiquetaPrecio(p: Pension) {
  const n = precioDesde(p);
  if (n === null) return "Ver";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  return `$${Math.round(n / 1000)}k`;
}

const CSS_PINES = `
.hc-pin{background:transparent;border:0}
.hc-pin-b{position:relative;display:inline-block;transform:translate(-50%,-100%);margin-top:-9px;
  background:#2196F3;color:#fff;font:700 13px/1 system-ui,-apple-system,Segoe UI,sans-serif;
  padding:7px 11px;border-radius:18px;border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.3);
  white-space:nowrap;cursor:pointer;transition:transform .15s,background .15s}
.hc-pin-b::after{content:"";position:absolute;left:50%;bottom:-7px;width:10px;height:10px;background:inherit;
  border-right:2px solid #fff;border-bottom:2px solid #fff;transform:translateX(-50%) rotate(45deg)}
.hc-pin-sel .hc-pin-b{background:#0D47A1;transform:translate(-50%,-100%) scale(1.18)}
.leaflet-control-zoom{border:0!important;box-shadow:0 2px 8px rgba(0,0,0,.25)!important;border-radius:12px!important;overflow:hidden}
.leaflet-control-zoom a{width:38px!important;height:38px!important;line-height:38px!important;font-size:20px!important}
`;

export default function MapaScreen() {
  const styles = useStyles();
  const col = useColores();
  const { session, profile } = useAuth();
  const tabs = useMemo(() => tabsPorRol(profile?.rol), [profile?.rol]);

  const { width } = useWindowDimensions();
  const esEscritorio = width >= BP_ESCRITORIO;
  // En escritorio el panel lateral arranca abierto en la búsqueda.
  const [activeTab, setActiveTab] = useState<string | null>(() =>
    typeof window !== "undefined" && window.innerWidth >= BP_ESCRITORIO ? "search" : null,
  );
  const [rl, setRl] = useState<ReactLeaflet | null>(null);
  const [leaf, setLeaf] = useState<Leaflet | null>(null);
  const [pensiones, setPensiones] = useState<Pension[]>([]);
  const [selected, setSelected] = useState<Pension | null>(null);
  const [chatInicial, setChatInicial] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [foco, setFoco] = useState<{ lat: number; lng: number; n: number } | null>(null);
  const visibles = useMemo(() => filtrarPensiones(pensiones, filtros), [pensiones, filtros]);
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(FILTROS_VACIOS);

  const cargarPensiones = useCallback(async () => {
    try {
      setPensiones(await listarPublicadas());
    } catch (e) {
      console.warn("No se pudieron cargar las pensiones", e);
    }
  }, []);

  useEffect(() => {
    cargarPensiones();
  }, [cargarPensiones]);

  // Actualización manual (botón del mapa).
  const [refrescando, setRefrescando] = useState(false);
  const actualizarMapa = useCallback(async () => {
    setRefrescando(true);
    await cargarPensiones();
    setRefrescando(false);
  }, [cargarPensiones]);

  // Actualización automática: cada minuto y al volver a la pestaña/ventana, para ver pensiones
  // recién aprobadas, despublicadas o eliminadas sin salir de la app.
  useEffect(() => {
    const siVisible = () => {
      if (document.visibilityState === "visible") cargarPensiones();
    };
    const intervalo = setInterval(siVisible, 60_000);
    document.addEventListener("visibilitychange", siVisible);
    window.addEventListener("focus", siVisible);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", siVisible);
      window.removeEventListener("focus", siVisible);
    };
  }, [cargarPensiones]);

  const translateY = useSharedValue(PANEL_CLOSED);
  const startY = useSharedValue(PANEL_CLOSED);

  // Al cambiar entre móvil y escritorio (p. ej. al redimensionar la ventana) se deja el estado coherente.
  useEffect(() => {
    if (esEscritorio) {
      setActiveTab((t) => t ?? "search");
    } else {
      translateY.value = activeTab ? PANEL_OPEN : PANEL_CLOSED;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esEscritorio]);

  // ── Cargar Leaflet ──
  useEffect(() => {
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([r, L]) => {
      setLeaf(L);
      setRl(r);
    });
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("hc-pines-css")) {
      const st = document.createElement("style");
      st.id = "hc-pines-css";
      st.textContent = CSS_PINES;
      document.head.appendChild(st);
    }
  }, []);

  // ── Snap helpers ──
  const snapOpen = () => {
    translateY.value = withSpring(PANEL_OPEN, { damping: 22, stiffness: 200, overshootClamping: true });
  };
  const snapClose = () => {
    translateY.value = withTiming(PANEL_CLOSED, { duration: 300 });
    runOnJS(setActiveTab)(null);
  };

  // En escritorio "cerrar" vuelve a la búsqueda; en móvil baja la hoja.
  const handleClose = () => (esEscritorio ? setActiveTab("search") : snapClose());

  const abrirInfo = (p: Pension, centrar = false) => {
    if (centrar) setFoco({ lat: p.latitud, lng: p.longitud, n: Date.now() });
    setSelected(p);
    setActiveTab("info");
    snapOpen();
  };

  const iniciarChat = async (p: Pension) => {
    if (!session) return;
    try {
      setChatInicial(await abrirConversacion(p.id, p.propietario_id, session.user.id));
      setActiveTab("list");
    } catch (e) {
      console.warn("No se pudo abrir el chat", e);
    }
  };

  const openPanel = (tab: string) => {
    if (tab === "list") setChatInicial(null);
    if (tab === "search") cargarPensiones(); // resultados al día al abrir la búsqueda
    if (esEscritorio) {
      setActiveTab(activeTab === tab ? null : tab); // en escritorio, tocar de nuevo pliega el panel
      return;
    }
    if (activeTab === tab) {
      snapClose();
    } else {
      setActiveTab(tab);
      snapOpen();
    }
  };

  // ── Gesto de arrastre (solo desde el asa, para no chocar con formularios y scrolls) ──
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onChange((e) => {
      const next = startY.value + e.translationY;
      translateY.value = Math.min(PANEL_CLOSED, Math.max(PANEL_OPEN, next));
    })
    .onEnd((e) => {
      const shouldClose = translateY.value > SNAP_THRESHOLD || e.velocityY > 600;
      if (shouldClose) snapClose();
      else snapOpen();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.min(translateY.value, PANEL_CLOSED) }],
  }));

  const mapa = (
    <>
        {rl && leaf ? (
          <rl.MapContainer
            center={[8.7479, -75.8814]}
            zoom={13}
            zoomControl={false}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <rl.TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <rl.ZoomControl position="bottomright" />
            <Enfocar rl={rl} foco={foco} />
            <AjustarTamano rl={rl} />
            {visibles.map((p) => {
              const sel = activeTab === "info" && selected?.id === p.id;
              return (
                <rl.Marker
                  key={`${p.id}-${sel}`}
                  position={[p.latitud, p.longitud]}
                  zIndexOffset={sel ? 1000 : 0}
                  icon={leaf.divIcon({
                    className: `hc-pin${sel ? " hc-pin-sel" : ""}`,
                    html: `<div class="hc-pin-b">${etiquetaPrecio(p)}</div>`,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0],
                  })}
                  eventHandlers={{ click: () => abrirInfo(p) }}
                />
              );
            })}
          </rl.MapContainer>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator color={col.primario} />
          </View>
        )}
    </>
  );

  // ── Escritorio: barra lateral + panel fijo + mapa ──
  if (esEscritorio) {
    return (
      <GestureHandlerRootView style={styles.escritorio}>
        <View style={styles.rail}>
          <Image source={require("../../assets/images/hc_logo.png")} style={styles.railLogo} resizeMode="contain" />
          {tabs.map((t) => {
            const activa = activeTab === t.key || (t.key === "search" && activeTab === "info");
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.railItem, activa && styles.railItemActivo]}
                onPress={() => openPanel(t.key)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t.etiqueta}
                accessibilityState={{ selected: activa }}
              >
                <Ionicons name={activa ? t.activo : t.icono} size={24} color={activa ? col.primario : col.textoTer} />
                <Text style={[styles.navEtiqueta, activa && styles.navEtiquetaActiva]} numberOfLines={1}>
                  {t.etiqueta}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab && (
          <View style={styles.panelEscritorio}>
            <PanelContent
              tab={activeTab}
              onClose={handleClose}
              pension={selected}
              chatInicial={chatInicial}
              onChat={iniciarChat}
              onPensionesChange={cargarPensiones}
              busqueda={{
                filtros,
                onFiltros: setFiltros,
                resultados: visibles,
                total: pensiones.length,
                onSelect: (p) => abrirInfo(p, true),
              }}
            />
          </View>
        )}

        <View style={styles.mapaEscritorio}>
          <View style={StyleSheet.absoluteFill}>{mapa}</View>
          <TouchableOpacity
            style={[styles.refreshBtn, { top: 16, right: 16 }]}
            onPress={actualizarMapa}
            disabled={refrescando}
            activeOpacity={0.8}
            accessibilityLabel="Actualizar mapa"
          >
            {refrescando ? (
              <ActivityIndicator size="small" color={col.primario} />
            ) : (
              <Ionicons name="refresh" size={21} color={col.primario} />
            )}
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Mapa */}
      <View style={styles.mapContainer}>
        {mapa}
      </View>

      {/* Buscador flotante y botón de actualizar */}
      <TouchableOpacity style={styles.searchPill} onPress={() => openPanel("search")} activeOpacity={0.9}>
        <Ionicons name="search" size={20} color={col.textoTer} />
        <Text style={styles.searchPillText} numberOfLines={1}>
          {hayFiltros ? "Filtros activos · toca para cambiar" : "Buscar pensión, barrio o dirección"}
        </Text>
        {hayFiltros && <View style={styles.searchDot} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={actualizarMapa}
        disabled={refrescando}
        activeOpacity={0.8}
        accessibilityLabel="Actualizar mapa"
      >
        {refrescando ? (
          <ActivityIndicator size="small" color={col.primario} />
        ) : (
          <Ionicons name="refresh" size={21} color={col.primario} />
        )}
      </TouchableOpacity>

      {/* Panel deslizante */}
      <Animated.View style={[styles.panel, animatedStyle]}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleZone}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>
        {activeTab && (
          <PanelContent
            tab={activeTab}
            onClose={handleClose}
            pension={selected}
            chatInicial={chatInicial}
            onChat={iniciarChat}
            onPensionesChange={cargarPensiones}
            busqueda={{
              filtros,
              onFiltros: setFiltros,
              resultados: visibles,
              total: pensiones.length,
              onSelect: (p) => abrirInfo(p, true),
            }}
          />
        )}
      </Animated.View>

      {/* Barra de navegación */}
      <View style={styles.navbar}>
        {tabs.map((t) => {
          const activa = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.navItem}
              onPress={() => openPanel(t.key)}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t.etiqueta}
              accessibilityState={{ selected: activa }}
            >
              {activa && <View style={styles.navIndicador} />}
              <Ionicons name={activa ? t.activo : t.icono} size={24} color={activa ? col.primario : col.textoTer} />
              <Text style={[styles.navEtiqueta, activa && styles.navEtiquetaActiva]} numberOfLines={1}>
                {t.etiqueta}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </GestureHandlerRootView>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(() => {
    const flotante = {
      backgroundColor: col.tarjeta,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: col.oscuro ? 0.5 : 0.18,
      shadowRadius: 10,
      elevation: 6,
    } as const;
    return StyleSheet.create({
      container: { flex: 1, backgroundColor: col.fondo },
      escritorio: { flex: 1, flexDirection: "row", backgroundColor: col.fondo },
      rail: {
        width: ANCHO_RAIL,
        backgroundColor: col.tarjeta,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: col.borde,
        alignItems: "center",
        paddingVertical: 16,
        gap: 6,
        zIndex: 20,
      },
      railLogo: { width: 52, height: 52, marginBottom: 12 },
      railItem: {
        width: 72,
        paddingVertical: 10,
        borderRadius: radios.lg,
        alignItems: "center",
        gap: 3,
      },
      railItemActivo: { backgroundColor: col.azulSuave },
      panelEscritorio: {
        width: ANCHO_PANEL,
        backgroundColor: col.fondo,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: col.borde,
        paddingTop: 16,
        zIndex: 10,
      },
      mapaEscritorio: { flex: 1, position: "relative" },
      mapContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: NAV_HEIGHT },
      mapPlaceholder: { flex: 1, backgroundColor: col.superficie, alignItems: "center", justifyContent: "center" },
      searchPill: {
        ...flotante,
        position: "absolute",
        top: 12,
        left: 12,
        right: 68,
        zIndex: 5,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      },
      searchPillText: { flex: 1, fontSize: 14, color: col.textoTer },
      searchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: col.primario },
      refreshBtn: {
        ...flotante,
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 5,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
      },
      panel: {
        zIndex: 10,
        position: "absolute",
        top: PANEL_TOP,
        left: 0,
        right: 0,
        bottom: NAV_HEIGHT,
        backgroundColor: col.fondo,
        borderTopLeftRadius: radios.xl,
        borderTopRightRadius: radios.xl,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: col.oscuro ? 0.5 : 0.15,
        shadowRadius: 16,
        elevation: 20,
      },
      handleZone: { width: "100%", paddingTop: 10, paddingBottom: 12, alignItems: "center", cursor: "grab" as any },
      handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: col.borde },
      navbar: {
        zIndex: 20,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: NAV_HEIGHT,
        flexDirection: "row",
        backgroundColor: col.tarjeta,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: col.borde,
        alignItems: "stretch",
      },
      navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
      navIndicador: {
        position: "absolute",
        top: 0,
        width: 32,
        height: 3,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        backgroundColor: col.primario,
      },
      navEtiqueta: { fontSize: 11, fontWeight: "500", color: col.textoTer },
      navEtiquetaActiva: { color: col.primario, fontWeight: "700" },
    });
  }, [col]);
};
