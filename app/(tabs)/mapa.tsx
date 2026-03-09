"use client";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// ── Paneles (agregar los nuevos aquí a medida que se implementen) ─────────────
import ChatsPanel from "../_panels/chats";
import ConfiguracionPanel from "../_panels/configuracion";
import ResidenciasPanel from "../_panels/residencias";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const NAV_HEIGHT = 68;
const PANEL_OPEN = 0;
const PANEL_CLOSED = SCREEN_HEIGHT;
const SNAP_THRESHOLD = SCREEN_HEIGHT * 0.4;

// ── SVG Icons ────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#111"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="22" y2="22" />
  </svg>
);
const HomeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#111" stroke="none">
    <path d="M12 3L2 10h3v11h5v-6h4v6h5V10h3L12 3z" />
  </svg>
);
const SettingsIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#111"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const ListIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#111"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="14" y2="18" />
  </svg>
);

const TAB_ICONS: Record<string, React.ComponentType> = {
  search: SearchIcon,
  home: HomeIcon,
  settings: SettingsIcon,
  list: ListIcon,
};

// ── Router de paneles — agregar nuevos paneles aquí ──────────────────────────
function PanelContent({ tab, onClose }: { tab: string; onClose: () => void }) {
  switch (tab) {
    case "settings":
      return <ConfiguracionPanel />;
    case "list":
      return <ChatsPanel onClose={onClose} />;
    case "home":
      return <ResidenciasPanel />;
    // case "home":     return <HomePanel />;
    default:
      return null;
  }
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function MapaScreen() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [MapComponents, setMapComponents] =
    useState<React.ComponentType<any> | null>(null);

  const translateY = useSharedValue(PANEL_CLOSED);
  const startY = useSharedValue(PANEL_CLOSED);

  // ── Cargar Leaflet ──
  useEffect(() => {
    Promise.all([import("react-leaflet"), import("leaflet")]).then(
      ([rl, L]) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        const { MapContainer, TileLayer } = rl;
        const LeafletMap = () => (
          <MapContainer
            center={[8.7479, -75.8814]}
            zoom={13}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </MapContainer>
        );
        setMapComponents(() => LeafletMap);
      },
    );
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // ── Snap helpers ──
  const snapOpen = () => {
    translateY.value = withSpring(PANEL_OPEN, {
      damping: 22,
      stiffness: 200,
      overshootClamping: true,
    });
  };
  const snapClose = () => {
    translateY.value = withTiming(PANEL_CLOSED, { duration: 300 });
    runOnJS(setActiveTab)(null);
  };

  const handleClose = () => snapClose();

  // ── Navbar ──
  const openPanel = (tab: string) => {
    if (activeTab === tab) {
      snapClose();
    } else {
      setActiveTab(tab);
      snapOpen();
    }
  };

  // ── Gesto de arrastre ──
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onChange((e) => {
      const next = startY.value + e.translationY;
      translateY.value = Math.min(PANEL_CLOSED, Math.max(PANEL_OPEN, next));
    })
    .onEnd((e) => {
      const shouldClose =
        translateY.value > SNAP_THRESHOLD || e.velocityY > 600;
      if (shouldClose) snapClose();
      else snapOpen();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.min(translateY.value, PANEL_CLOSED) }],
  }));

  const tabs = ["search", "home", "settings", "list"];

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Mapa */}
      <View style={styles.mapContainer}>
        {MapComponents ? (
          <MapComponents />
        ) : (
          <View style={styles.mapPlaceholder} />
        )}
      </View>

      {/* Panel deslizante */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.panel, animatedStyle]}>
          <View style={styles.handleZone}>
            <View style={styles.handle} />
          </View>
          {activeTab && <PanelContent tab={activeTab} onClose={handleClose} />}
        </Animated.View>
      </GestureDetector>

      {/* Navbar */}
      <View style={styles.navbar}>
        {tabs.map((key) => {
          const Icon = TAB_ICONS[key];
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={styles.navItem}
              onPress={() => openPanel(key)}
              activeOpacity={0.6}
              accessible
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View
                style={[styles.iconWrap, isActive && styles.iconWrapActive]}
              >
                {/* @ts-ignore */}
                <Icon />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { ...StyleSheet.absoluteFillObject },
  mapPlaceholder: { flex: 1, backgroundColor: "#dde8f0" },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT - NAV_HEIGHT + 100,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 20,
  },
  handleZone: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    cursor: "grab" as any,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
  },
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: NAV_HEIGHT,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 24,
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#EBEBEB",
  },
});
