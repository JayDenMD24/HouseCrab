import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Foto } from "@/lib/storage";
import { useColores } from "@/lib/tema";

const MAX_BYTES = 5 * 1024 * 1024;

export default function PhotoPicker({
  value,
  onChange,
  label,
  height = 140,
}: {
  value: Foto | null;
  onChange: (f: Foto | null) => void;
  label: string;
  height?: number;
}) {
  const styles = useStyles();
  const elegir = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7, // comprime para ahorrar espacio y datos
    });
    if (res.canceled) return;
    const a = res.assets[0];
    if (a.fileSize && a.fileSize > MAX_BYTES) {
      window.alert("La imagen supera los 5 MB. Elige una más liviana.");
      return;
    }
    onChange({ uri: a.uri, mime: a.mimeType ?? "image/jpeg" });
  };

  return (
    <View>
      <TouchableOpacity style={[styles.box, { height }]} onPress={elegir} activeOpacity={0.8}>
        {value ? (
          <Image source={{ uri: value.uri }} style={styles.img} resizeMode="cover" />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={28} color="#2196F3" />
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
      {value && (
        <TouchableOpacity onPress={() => onChange(null)}>
          <Text style={styles.remove}>Quitar foto</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(() => StyleSheet.create({
  box: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#90CAF9",
    backgroundColor: col.azulSuave,
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  label: { color: "#2196F3", fontSize: 13, fontWeight: "600" },
  remove: { color: "#E53935", fontSize: 12, marginTop: 4 },
}), [col]);
};
