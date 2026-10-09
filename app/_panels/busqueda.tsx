import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Chips } from "@/components/chips";
import { EstadoVacio, Tarjeta } from "@/components/ui";
import {
  COMODIDADES,
  FILTROS_VACIOS,
  Filtros,
  Pension,
  TIPOS_PENSION,
  formatoPrecio,
  precioDesde,
} from "@/lib/pensiones";
import { radios, useColores } from "@/lib/tema";

const PRECIOS_RAPIDOS = [500_000, 800_000, 1_000_000];

export default function BusquedaPanel({
  filtros,
  onFiltros,
  resultados,
  total,
  onSelect,
}: {
  filtros: Filtros;
  onFiltros: (f: Filtros) => void;
  resultados: Pension[];
  total: number;
  onSelect: (p: Pension) => void;
}) {
  const styles = useStyles();
  const col = useColores();
  const set = (parcial: Partial<Filtros>) => onFiltros({ ...filtros, ...parcial });
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(FILTROS_VACIOS);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Buscador */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={col.textoTer} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nombre, barrio o dirección"
          placeholderTextColor={col.textoTer}
          value={filtros.texto}
          onChangeText={(texto) => set({ texto })}
        />
        {filtros.texto.length > 0 && (
          <TouchableOpacity onPress={() => set({ texto: "" })} accessibilityLabel="Borrar búsqueda">
            <Ionicons name="close-circle" size={20} color={col.textoTer} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <Tarjeta style={styles.filtros}>
        <Text style={styles.label}>Tipo de pensión</Text>
        <Chips
          opciones={TIPOS_PENSION}
          seleccion={filtros.tipo ? [filtros.tipo] : []}
          onToggle={(t) => set({ tipo: filtros.tipo === t ? null : t })}
        />

        <Text style={styles.label}>Precio máximo por habitación</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 800000"
          placeholderTextColor={col.textoTer}
          keyboardType="numeric"
          value={filtros.precioMax !== null ? String(filtros.precioMax) : ""}
          onChangeText={(t) => {
            const n = Number(t.replace(/\D/g, ""));
            set({ precioMax: n > 0 ? n : null });
          }}
        />
        <Chips
          opciones={PRECIOS_RAPIDOS.map((n) => `Hasta ${formatoPrecio(n)}`)}
          seleccion={filtros.precioMax ? [`Hasta ${formatoPrecio(filtros.precioMax)}`] : []}
          onToggle={(txt) => {
            const n = PRECIOS_RAPIDOS.find((x) => `Hasta ${formatoPrecio(x)}` === txt)!;
            set({ precioMax: filtros.precioMax === n ? null : n });
          }}
        />

        <Text style={styles.label}>Comodidades</Text>
        <Chips
          opciones={COMODIDADES}
          seleccion={filtros.comodidades}
          onToggle={(c) =>
            set({
              comodidades: filtros.comodidades.includes(c)
                ? filtros.comodidades.filter((x) => x !== c)
                : [...filtros.comodidades, c],
            })
          }
        />
      </Tarjeta>

      {/* Resultados */}
      <View style={styles.resultsHeader}>
        <Text style={styles.section}>
          {resultados.length} de {total} pensiones
        </Text>
        {hayFiltros && (
          <TouchableOpacity onPress={() => onFiltros(FILTROS_VACIOS)}>
            <Text style={styles.clear}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {resultados.length === 0 && (
        <EstadoVacio
          icono="search-outline"
          titulo="No encontramos pensiones"
          texto="Prueba quitando algún filtro o buscando por otro barrio."
        />
      )}

      {resultados.map((p) => {
        const desde = precioDesde(p);
        return (
          <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => onSelect(p)}>
            <Tarjeta style={styles.card}>
              {p.foto_url ? (
                <Image source={{ uri: p.foto_url }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbVacia]}>
                  <Ionicons name="home" size={28} color={col.primario} />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {p.nombre}
                </Text>
                <Text style={styles.cardTipo}>{p.tipo}</Text>
                <View style={styles.fila}>
                  <Ionicons name="location-outline" size={14} color={col.textoTer} />
                  <Text style={styles.cardDir} numberOfLines={1}>
                    {p.direccion}
                  </Text>
                </View>
                {desde !== null && (
                  <Text style={styles.price}>
                    {formatoPrecio(desde)} <Text style={styles.priceMes}>/ mes</Text>
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={col.textoTer} />
            </Tarjeta>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1 },
        content: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
        fila: { flexDirection: "row", alignItems: "center", gap: 4 },
        searchBox: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: col.tarjeta,
          borderRadius: 24,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: col.borde,
        },
        searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: col.texto },
        filtros: { gap: 10 },
        label: { fontSize: 13, fontWeight: "700", color: col.textoSec, marginTop: 2 },
        input: {
          borderWidth: 1,
          borderColor: col.borde,
          borderRadius: radios.md,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
          color: col.texto,
          backgroundColor: col.fondo,
        },
        resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
        section: { fontSize: 16, fontWeight: "800", color: col.texto },
        clear: { fontSize: 13, color: col.primario, fontWeight: "700" },
        card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10 },
        thumb: { width: 84, height: 84, borderRadius: radios.md },
        thumbVacia: { backgroundColor: col.azulSuave, alignItems: "center", justifyContent: "center" },
        cardInfo: { flex: 1, gap: 2 },
        cardTitle: { fontSize: 16, fontWeight: "700", color: col.texto },
        cardTipo: { fontSize: 12, fontWeight: "600", color: col.primario },
        cardDir: { flex: 1, fontSize: 13, color: col.textoTer },
        price: { fontSize: 15, fontWeight: "800", color: col.texto, marginTop: 2 },
        priceMes: { fontSize: 12, fontWeight: "400", color: col.textoTer },
      }),
    [col],
  );
};
