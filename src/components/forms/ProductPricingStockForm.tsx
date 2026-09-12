import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Product } from "../../types";
import { SelectedUnit } from "../modals/WeightUnitPickerModal";

interface Props {
  costPrice: number;
  sellingPrice: number;
  stockQty: number;
  isBaseUnit: boolean;
  sellingUnit: string;
  selectedUnit: SelectedUnit;
  editing: boolean;
  selectedParent?: Product;
  targetPackageQty: number;
  initialPackageQty: number;
  onUpdateField: (
    key: "cost_price" | "selling_price" | "stock_qty",
    value: string,
  ) => void;
  onTargetPackageQtyChange: (qty: number) => void;
  onInitialPackageQtyChange: (qty: number) => void;
}

export function ProductPricingStockForm({
  costPrice,
  sellingPrice,
  stockQty,
  isBaseUnit,
  sellingUnit,
  selectedUnit,
  editing,
  selectedParent,
  targetPackageQty,
  initialPackageQty,
  onUpdateField,
  onTargetPackageQtyChange,
  onInitialPackageQtyChange,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Pricing & Stock</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Cost Price per {selectedUnit}</Text>
          <TextInput
            style={styles.input}
            value={String(costPrice || "")}
            onChangeText={(val) => onUpdateField("cost_price", val)}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#8a9b95"
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Selling Price per {selectedUnit}</Text>
          <TextInput
            style={styles.input}
            value={String(sellingPrice || "")}
            onChangeText={(val) => onUpdateField("selling_price", val)}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#8a9b95"
          />
        </View>
      </View>

      {isBaseUnit ? (
        <>
          <Text style={styles.label}>Available Stock ({selectedUnit})</Text>
          <TextInput
            style={styles.input}
            value={String(stockQty || "")}
            onChangeText={(val) => onUpdateField("stock_qty", val)}
            keyboardType={sellingUnit === "unit" ? "number-pad" : "decimal-pad"}
            placeholder="0"
            placeholderTextColor="#8a9b95"
          />
        </>
      ) : editing ? (
        <View style={styles.packageStockBox}>
          <Text style={styles.label}>Available Package Stock Qty</Text>
          <TextInput
            style={styles.input}
            value={String(targetPackageQty)}
            onChangeText={(val) =>
              onTargetPackageQtyChange(Number(val.replace(/[^0-9]/g, "")) || 0)
            }
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#8a9b95"
          />
          <Text style={styles.infoSubtext}>
            * Updating package count will recalculate Base Product (
            {selectedParent?.name ?? "Base Unit"}) stock.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>Initial Packages To Add To Stock</Text>
          <TextInput
            style={styles.input}
            value={String(initialPackageQty || "")}
            onChangeText={(val) =>
              onInitialPackageQtyChange(Number(val.replace(/[^0-9]/g, "")) || 0)
            }
            keyboardType="number-pad"
            placeholder="0 (Enter box count)"
            placeholderTextColor="#8a9b95"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3a2818",
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7a6a52",
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#3a2818",
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  packageStockBox: { marginTop: 4 },
  infoSubtext: { fontSize: 11, color: "#8a9b95", marginTop: 6 },
});
