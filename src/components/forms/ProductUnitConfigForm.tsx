import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Product } from "../../types";
import { SelectedUnit, weightUnits } from "../modals/WeightUnitPickerModal";

export type UnitCategory = "unit" | "weight";

interface Props {
  unitCategory: UnitCategory;
  selectedUnit: SelectedUnit;
  isBaseUnit: boolean;
  selectedParent?: Product;
  conversionRate: number;
  onSelectUnitCategory: (cat: UnitCategory) => void;
  onOpenWeightPicker: () => void;
  onToggleBaseUnit: (isBase: boolean) => void;
  onOpenParentPicker: () => void;
  onUpdateConversionRate: (val: string) => void;
}

export function ProductUnitConfigForm({
  unitCategory,
  selectedUnit,
  isBaseUnit,
  selectedParent,
  conversionRate,
  onSelectUnitCategory,
  onOpenWeightPicker,
  onToggleBaseUnit,
  onOpenParentPicker,
  onUpdateConversionRate,
}: Props) {
  const selectedUnitLabel =
    selectedUnit === "pcs"
      ? "pcs"
      : (weightUnits.find((u) => u.value === selectedUnit)?.label ??
        selectedUnit);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Unit & Packaging Config</Text>
      <Text style={styles.label}>Product Unit Category</Text>

      <View style={styles.segmentContainer}>
        {(["unit", "weight"] as const).map((category) => (
          <Pressable
            key={category}
            style={[
              styles.segmentBtn,
              unitCategory === category && styles.segmentActive,
            ]}
            onPress={() => onSelectUnitCategory(category)}>
            <Text
              style={[
                styles.segmentText,
                unitCategory === category && styles.segmentActiveText,
              ]}>
              {category === "unit" ? "By Unit" : "By Weight"}
            </Text>
          </Pressable>
        ))}
      </View>

      {unitCategory === "weight" && (
        <>
          <Text style={styles.label}>Select Weight Unit</Text>
          <Pressable style={styles.pickerTrigger} onPress={onOpenWeightPicker}>
            <Text style={styles.pickerText}>{selectedUnitLabel}</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color="#7a6a52"
            />
          </Pressable>
        </>
      )}

      <Text style={styles.infoSubtext}>
        Price and stock use the selected unit. Barcode is optional.
      </Text>

      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentBtn, isBaseUnit && styles.segmentActive]}
          onPress={() => onToggleBaseUnit(true)}>
          <Text
            style={[
              styles.segmentText,
              isBaseUnit && styles.segmentActiveText,
            ]}>
            Single Unit (Base)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, !isBaseUnit && styles.segmentActive]}
          onPress={() => onToggleBaseUnit(false)}>
          <Text
            style={[
              styles.segmentText,
              !isBaseUnit && styles.segmentActiveText,
            ]}>
            Package / Box
          </Text>
        </Pressable>
      </View>

      {!isBaseUnit && (
        <View style={styles.packageBox}>
          <Text style={styles.label}>Base Product Link *</Text>
          <Pressable style={styles.pickerTrigger} onPress={onOpenParentPicker}>
            <Text style={styles.pickerText}>
              {selectedParent
                ? selectedParent.name
                : "-- Select Base Single Unit --"}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color="#7a6a52"
            />
          </Pressable>

          <Text style={styles.label}>
            Items Inside Package (Conversion Rate) *
          </Text>
          <TextInput
            style={styles.input}
            value={String(conversionRate || "")}
            onChangeText={onUpdateConversionRate}
            keyboardType="number-pad"
            placeholder="e.g. 24 cans per box"
            placeholderTextColor="#8a9b95"
          />
        </View>
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
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#fff1c2",
    borderRadius: 8,
    padding: 4,
    marginTop: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentActive: { backgroundColor: "#3a2818" },
  segmentText: { color: "#7a6a52", fontWeight: "700", fontSize: 13 },
  segmentActiveText: { color: "#ffffff" },
  packageBox: { marginTop: 6 },
  pickerTrigger: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: { fontSize: 15, color: "#3a2818" },
  infoSubtext: { fontSize: 11, color: "#8a9b95", marginTop: 6 },
});
