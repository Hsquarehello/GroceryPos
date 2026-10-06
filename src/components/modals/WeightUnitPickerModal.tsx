import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../i18n";

export type SelectedUnit = "pcs" | "kg" | "g" | "ပိဿာ" | "ကျပ်သား";

export const weightUnits: Array<{
  value: Exclude<SelectedUnit, "pcs">;
  label: string;
}> = [
  { value: "kg", label: "kg (ကီလိုဂရမ်)" },
  { value: "g", label: "g (ဂရမ်)" },
  { value: "ပိဿာ", label: "ပိဿာ" },
  { value: "ကျပ်သား", label: "ကျပ်သား" },
];

interface Props {
  visible: boolean;
  selectedUnit: SelectedUnit;
  onSelectUnit: (unit: Exclude<SelectedUnit, "pcs">) => void;
  onClose: () => void;
}

export function WeightUnitPickerModal({
  visible,
  selectedUnit,
  onSelectUnit,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("selectWeightUnit")}</Text>
          {weightUnits.map((unit) => (
            <Pressable
              key={unit.value}
              style={styles.modalItem}
              onPress={() => onSelectUnit(unit.value)}>
              <Text style={styles.modalItemText}>{unit.label}</Text>
              {selectedUnit === unit.value && (
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color="#f36f0a"
                />
              )}
            </Pressable>
          ))}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t("apply")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(107, 72, 29, 0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3a2818",
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eef2ef",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemText: { fontSize: 15, fontWeight: "700", color: "#3a2818" },
  closeBtn: { marginTop: 16, alignItems: "center" },
  closeText: { color: "#bd6337", fontWeight: "800" },
});
