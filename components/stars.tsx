import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";

// Muestra `valor` (puede ser decimal) y, si se pasa onChange, permite elegir de 1 a 5.
export default function Stars({
  valor,
  onChange,
  size = 28,
}: {
  valor: number;
  onChange?: (n: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 4, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const nombre = valor >= n - 0.25 ? "star" : valor >= n - 0.75 ? "star-half" : "star-outline";
        const icono = <Ionicons name={nombre} size={size} color="#FFB300" />;
        return onChange ? (
          <TouchableOpacity key={n} onPress={() => onChange(n)} accessibilityLabel={`${n} estrellas`}>
            {icono}
          </TouchableOpacity>
        ) : (
          <View key={n}>{icono}</View>
        );
      })}
    </View>
  );
}
