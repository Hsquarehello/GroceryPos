import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { t } from "../../i18n";
import { Customer } from "../../types";

interface RepaymentModalProps {
  visible: boolean;
  selectedCustomer: Customer | null;
  repayment: string;
  onChangeRepayment: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  visible,
  selectedCustomer,
  repayment,
  onChangeRepayment,
  onSave,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("recordRepayment")}</Text>
          <Text style={styles.modalSubtext}>
            {selectedCustomer?.name} {t("debt")}{" "}
            {selectedCustomer?.total_debt.toLocaleString()} MMK
          </Text>
          <TextInput
            value={repayment}
            onChangeText={onChangeRepayment}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder={t("amountPaid")}
            placeholderTextColor="#9aaa9f"
          />
          <Pressable style={styles.addButton} onPress={onSave}>
            <Text style={styles.addButtonText}>{t("saveRepayment")}</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{t("cancel")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(107, 72, 29, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 14, padding: 18 },
  modalTitle: {
    color: "#3a2818",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtext: { color: "#71837a", fontSize: 13, marginBottom: 12 },
  input: {
    backgroundColor: "#fffaf0",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: "#3a2818",
    marginTop: 10,
  },
  addButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 14,
  },
  addButtonText: { color: "#fff", fontWeight: "800" },
  cancelButton: { alignItems: "center", padding: 12 },
  cancelText: { color: "#7a6a52", fontWeight: "800" },
});
