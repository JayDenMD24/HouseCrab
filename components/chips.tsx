import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColores } from "@/lib/tema";

export function Chips({
  opciones,
  seleccion,
  onToggle,
}: {
  opciones: string[];
  seleccion: string[];
  onToggle: (o: string) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.chips}>
      {opciones.map((o) => {
        const on = seleccion.includes(o);
        return (
          <TouchableOpacity key={o} style={[styles.chip, on && styles.chipOn]} onPress={() => onToggle(o)}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(() => StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: col.borde,
  },
  chipOn: { backgroundColor: "#2196F3", borderColor: "#2196F3" },
  chipText: { color: col.textoSec, fontSize: 13 },
  chipTextOn: { color: "#fff" },
}), [col]);
};
