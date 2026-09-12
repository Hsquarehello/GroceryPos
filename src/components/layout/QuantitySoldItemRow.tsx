import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { QuantitySoldItem } from "../../database/productRepository";

interface QuantitySoldItemRowProps {
  item: QuantitySoldItem;
}

const formatQuantity = (
  quantity: number,
  unit: QuantitySoldItem["selling_unit"],
) =>
  `${unit === "unit" ? quantity.toLocaleString() : quantity.toFixed(2)} ${unit === "unit" ? "pcs" : unit}`;

const formatMoney = (value: number) =>
  `${Math.round(value).toLocaleString()} MMK`;

export function QuantitySoldItemRow({ item }: QuantitySoldItemRowProps) {
  const isUnit = item.selling_unit === "unit";

  return (
    <View style={styles.row}>
      <View style={styles.productIcon}>
        <MaterialCommunityIcons
          name={isUnit ? "package-variant-closed" : "scale-balance"}
          size={20}
          color="#f36f0a"
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <Text style={styles.saleCount}>
          {item.sale_count} {item.sale_count === 1 ? "sale" : "sales"}
        </Text>
        <Text style={styles.revenue}>{formatMoney(item.revenue)}</Text>
      </View>
      <View style={styles.quantityInfo}>
        <Text style={styles.quantity}>
          {formatQuantity(item.quantity, item.selling_unit)}
        </Text>
        <Text style={styles.quantityLabel}>sold</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1dfb8",
    padding: 14,
    marginBottom: 10,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff4ee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  productInfo: { flex: 1 },
  productName: { color: "#3a2818", fontSize: 15, fontWeight: "800" },
  saleCount: { color: "#71837a", fontSize: 12, marginTop: 4 },
  revenue: { color: "#bd6337", fontSize: 12, fontWeight: "800", marginTop: 4 },
  quantityInfo: { alignItems: "flex-end", marginLeft: 8 },
  quantity: { color: "#3a2818", fontSize: 16, fontWeight: "900" },
  quantityLabel: { color: "#71837a", fontSize: 11, marginTop: 2 },
});
