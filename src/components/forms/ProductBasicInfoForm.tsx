import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  name: string;
  barcode: string | null;
  editing: boolean;
  onUpdateField: (key: "name" | "barcode", value: string) => void;
  onScanPress: () => void;
}

export function ProductBasicInfoForm({
  name,
  barcode,
  editing,
  onUpdateField,
  onScanPress,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Basic Details</Text>

      <Text style={styles.label}>Product Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(val) => onUpdateField("name", val)}
        placeholder="e.g. Coca-Cola 330ml Can"
        placeholderTextColor="#8a9b95"
      />

      <Text style={styles.label}>Barcode</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={barcode ?? ""}
          onChangeText={(val) => onUpdateField("barcode", val)}
          placeholder="Scan or type barcode"
          placeholderTextColor="#8a9b95"
          keyboardType="number-pad"
        />
        {!editing && (
          <Pressable style={styles.scanBtn} onPress={onScanPress}>
            <MaterialCommunityIcons
              name="barcode-scan"
              size={18}
              color="#fff"
            />
            <Text style={styles.scanBtnText}>Scan</Text>
          </Pressable>
        )}
      </View>
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
  scanBtn: {
    backgroundColor: "#3a2818",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  scanBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
});