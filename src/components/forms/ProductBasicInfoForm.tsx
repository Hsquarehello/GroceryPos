import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../i18n";

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
      <Text style={styles.cardTitle}>{t("basicDetails")}</Text>

      <Text style={styles.label}>{t("productName")}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(val) => onUpdateField("name", val)}
        placeholder={t("productNameExample")}
        placeholderTextColor="#8a9b95"
      />

      <Text style={styles.label}>{t("barcode")}</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.barcodeInput]}
          value={barcode ?? ""}
          onChangeText={(val) => onUpdateField("barcode", val)}
          placeholder={t("scanOrTypeBarcode")}
          placeholderTextColor="#8a9b95"
          keyboardType="number-pad"
        />
        <Pressable style={styles.scanBtn} onPress={onScanPress}>
          <MaterialCommunityIcons name="barcode-scan" size={18} color="#fff" />
          <Text style={styles.scanBtnText}>{t("scan")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fffaf0",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0dfb6",
    padding: 16,
    marginBottom: 18,
  },
  cardTitle: {
    color: "#3a2818",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  label: {
    color: "#7a6a52",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#3a2818",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barcodeInput: {
    flex: 1,
    minWidth: 0,
    width: "100%",
  },
  scanBtn: {
    backgroundColor: "#3a2818",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minWidth: 130,
    flexShrink: 0,
  },
  scanBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
