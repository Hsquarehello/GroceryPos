// src/components/cart/CustomerSelectModal.tsx
import React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Customer } from "../../types";

interface CustomerSelectModalProps {
  visible: boolean;
  customers: Customer[];
  customerSearch: string;
  setCustomerSearch: (val: string) => void;
  onSelectCustomer: (customerId: number) => void;
  onOpenNewCustomer: () => void;
  onClose: () => void;
}

export default function CustomerSelectModal({
  visible,
  customers,
  customerSearch,
  setCustomerSearch,
  onSelectCustomer,
  onOpenNewCustomer,
  onClose,
}: CustomerSelectModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select customer</Text>
          <View style={styles.customerSearchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#71837a" />
            <TextInput
              value={customerSearch}
              onChangeText={setCustomerSearch}
              style={styles.customerSearchInput}
              placeholder="Search by customer name"
              placeholderTextColor="#9aaa9f"
              autoCapitalize="none"
              returnKeyType="search"
            />
            {!!customerSearch && (
              <Pressable
                style={styles.clearCustomerSearch}
                onPress={() => setCustomerSearch("")}
                accessibilityLabel="Clear customer search">
                <MaterialCommunityIcons
                  name="close-circle"
                  size={19}
                  color="#9aaa9f"
                />
              </Pressable>
            )}
          </View>
          <FlatList
            data={customers}
            keyExtractor={(customer) => String(customer.id)}
            style={styles.customerList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: customer }) => (
              <Pressable
                style={styles.customerRow}
                onPress={() => onSelectCustomer(customer.id!)}>
                <View>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerDebt}>
                    {customer.total_debt.toLocaleString()} MMK owed
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.noCustomerFound}>No customer found</Text>
            }
          />
          <Pressable
            style={styles.newCustomerButton}
            onPress={onOpenNewCustomer}>
            <Text style={styles.newCustomerText}>+ Add customer</Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
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
  customerSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffaf0",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 11,
    marginBottom: 10,
  },
  customerSearchInput: {
    flex: 1,
    color: "#3a2818",
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  clearCustomerSearch: { padding: 4 },
  customerList: { maxHeight: 260 },
  customerRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#fff1c2",
  },
  customerName: { color: "#3a2818", fontSize: 15, fontWeight: "800" },
  customerDebt: { color: "#71837a", fontSize: 12, marginTop: 3 },
  noCustomerFound: {
    color: "#71837a",
    textAlign: "center",
    paddingVertical: 28,
    fontSize: 13,
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
