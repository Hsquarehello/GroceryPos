// src/components/cart/AddCustomerModal.tsx
import React from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createCustomer } from "../../database";
import { t } from "../../i18n";

interface AddCustomerModalProps {
  visible: boolean;
  customerName: string;
  customerPhone: string;
  setCustomerName: (val: string) => void;
  setCustomerPhone: (val: string) => void;
  onSuccess: (newCustomerId: number) => void;
  onClose: () => void;
}

export default function AddCustomerModal({
  visible,
  customerName,
  customerPhone,
  setCustomerName,
  setCustomerPhone,
  onSuccess,
  onClose,
}: AddCustomerModalProps) {
  const handleSaveCustomer = async () => {
    try {
      const id = await createCustomer(customerName, customerPhone);
      setCustomerName("");
      setCustomerPhone("");
      onSuccess(id);
    } catch (error) {
      Alert.alert(
        t("couldNotAddCustomer"),
        error instanceof Error ? error.message : t("tryAgain"),
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("addCustomer")}</Text>
          <TextInput
            style={styles.cashInput}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder={t("name")}
            placeholderTextColor="#9aaa9f"
          />
          <TextInput
            style={styles.cashInput}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder={t("phoneOptional")}
            placeholderTextColor="#9aaa9f"
            keyboardType="phone-pad"
          />
          <Pressable
            style={styles.newCustomerButton}
            onPress={handleSaveCustomer}>
            <Text style={styles.newCustomerText}>{t("saveCustomer")}</Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t("cancel")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(107, 72, 29, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#3a2818",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  cashInput: {
    backgroundColor: "#fffaf0",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#3a2818",
    fontSize: 15,
    marginBottom: 8,
  },
  newCustomerButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 14,
  },
  newCustomerText: { color: "#fff", fontWeight: "800" },
  closeButton: { alignItems: "center", padding: 12, marginTop: 4 },
  closeButtonText: { color: "#7a6a52", fontWeight: "800" },
});
