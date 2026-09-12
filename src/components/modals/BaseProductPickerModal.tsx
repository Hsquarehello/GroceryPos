import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Product } from "../../types";

interface Props {
  visible: boolean;
  baseProducts: Product[];
  currentProductId?: number;
  onSelectProduct: (productId: number) => void;
  onClose: () => void;
}

export function BaseProductPickerModal({
  visible,
  baseProducts,
  currentProductId,
  onSelectProduct,
  onClose,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const visibleProducts = baseProducts
    .filter((product) => product.id !== currentProductId)
    .filter((product) => {
      if (!normalizedSearch) return true;
      return (
        product.name.toLocaleLowerCase().includes(normalizedSearch) ||
        (product.barcode ?? "").includes(normalizedSearch)
      );
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Base Unit Product</Text>
          <View style={styles.modalSearchBox}>
            <MaterialCommunityIcons name="magnify" size={19} color="#8a9b95" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.modalSearchInput}
              placeholder="Search by name or barcode"
              placeholderTextColor="#8a9b95"
              returnKeyType="search"
              autoCapitalize="none"
            />
            {!!searchQuery && (
              <Pressable
                style={styles.modalSearchClear}
                onPress={() => setSearchQuery("")}
                accessibilityLabel="Clear base product search">
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color="#8a9b95"
                />
              </Pressable>
            )}
          </View>
          <ScrollView style={{ maxHeight: 280 }}>
            {visibleProducts.map((p) => (
              <Pressable
                key={p.id}
                style={styles.modalItem}
                onPress={() => {
                  onSelectProduct(p.id!);
                  handleClose();
                }}>
                <Text style={styles.modalItemText}>{p.name}</Text>
                <Text style={styles.modalItemSub}>Stock: {p.stock_qty}</Text>
              </Pressable>
            ))}
            {!visibleProducts.length && (
              <Text style={styles.modalEmptyText}>
                No matching base products.
              </Text>
            )}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeText}>Cancel</Text>
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
  modalSearchBox: {
    height: 42,
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalSearchInput: {
    flex: 1,
    color: "#3a2818",
    fontSize: 14,
    paddingHorizontal: 8,
  },
  modalSearchClear: { padding: 3 },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eef2ef",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemText: { fontSize: 15, fontWeight: "700", color: "#3a2818" },
  modalItemSub: { fontSize: 12, color: "#8a9b95" },
  modalEmptyText: {
    color: "#8a9b95",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
  },
  closeBtn: { marginTop: 16, alignItems: "center" },
  closeText: { color: "#bd6337", fontWeight: "800" },
});
