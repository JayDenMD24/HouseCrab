import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Chips } from "@/components/chips";
import { useColores } from "@/lib/tema";
import { Encabezado, useEstilosConfig } from "./comun";
import { AVISO_BORRADOR, DOCUMENTOS } from "./legal-textos";

export default function LegalPanel({ onBack }: { onBack: () => void }) {
  const s = useEstilosConfig();
  const col = useColores();
  const [actual, setActual] = useState(DOCUMENTOS[0].nombre);
  const doc = DOCUMENTOS.find((d) => d.nombre === actual)!;

  return (
    <>
      <Encabezado titulo="Información legal" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Chips opciones={DOCUMENTOS.map((d) => d.nombre)} seleccion={[actual]} onToggle={setActual} />

        <View style={{ backgroundColor: col.superficie, borderRadius: 8, padding: 10, gap: 2 }}>
          <Text style={{ fontSize: 12, color: "#F9A825", fontWeight: "700" }}>{AVISO_BORRADOR}</Text>
          <Text style={{ fontSize: 12, color: col.textoTer }}>{doc.version}</Text>
        </View>

        {doc.secciones.map((sec) => (
          <View key={sec.titulo} style={{ gap: 6 }}>
            <Text style={s.seccion}>{sec.titulo}</Text>
            {sec.parrafos.map((p, i) => (
              <Text key={i} style={s.texto}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}
