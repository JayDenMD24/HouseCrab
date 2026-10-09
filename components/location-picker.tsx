import { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColores } from "@/lib/tema";

export type Coords = { lat: number; lng: number };

const CENTRO: [number, number] = [8.7479, -75.8814]; // Montería

type Leaflet = typeof import("react-leaflet");

function Clicks({ rl, onPick }: { rl: Leaflet; onPick: (c: Coords) => void }) {
  rl.useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

// Mapa para elegir una ubicación tocando o arrastrando el pin. Solo web (Leaflet).
export default function LocationPicker({
  value,
  onChange,
}: {
  value: Coords | null;
  onChange: (c: Coords) => void;
}) {
  const styles = useStyles();
  const [rl, setRl] = useState<Leaflet | null>(null);

  useEffect(() => {
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([r, L]) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setRl(r);
    });
  }, []);

  return (
    <View>
      <View style={styles.map}>
        {rl && (
          <rl.MapContainer
            center={value ? [value.lat, value.lng] : CENTRO}
            zoom={value ? 17 : 13}
            style={{ height: "100%", width: "100%" }}
          >
            <rl.TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
            <Clicks rl={rl} onPick={onChange} />
            {value && (
              <rl.Marker
                position={[value.lat, value.lng]}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const p = e.target.getLatLng();
                    onChange({ lat: p.lat, lng: p.lng });
                  },
                }}
              />
            )}
          </rl.MapContainer>
        )}
      </View>
      <Text style={styles.hint}>
        {value ? "Arrastra el pin para ajustar la ubicación." : "Toca el mapa para marcar dónde está la pensión."}
      </Text>
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(() => StyleSheet.create({
  map: {
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: col.superficie,
  },
  hint: { fontSize: 12, color: col.textoTer, marginTop: 4 },
}), [col]);
};
