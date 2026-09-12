// src/components/cart/MoreOptionsModal.tsx
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface MoreOptionsModalProps {
  visible: boolean;
  draftDiscount: string;
  draftSaleNote: string;
  setDraftDiscount: (val: string) => void;
  setDraftSaleNote: (val: string) => void;
  onClose: () => void;
  onApply: () => void;
}

export default function MoreOptionsModal({
  visible,
  draftDiscount,
  draftSaleNote,
  setDraftDiscount,
  setDraftSaleNote,
  onClose,
  onApply,
}: MoreOptionsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.bottomSheetOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.moreOptionsSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.modalTitle}>More options</Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color="#7a6a52"
              />
            </Pressable>
          </View>
          <Text style={styles.cashLabel}>Discount (MMK)</Text>
          <TextInput
            value={draftDiscount}
            onChangeText={setDraftDiscount}
            style={styles.cashInput}
            keyboardType="decimal-pad"
            placeholder="Enter discount amount"
            placeholderTextColor="#9aaa9f"
          />
          <Text style={styles.cashLabel}>Sale note (optional)</Text>
          <TextInput
            value={draftSaleNote}
            onChangeText={setDraftSaleNote}
            style={[styles.cashInput, styles.noteInput]}
            multiline
            numberOfLines={3}
            placeholder="e.g. Broken product - discount applied"
            placeholderTextColor="#9aaa9f"
          />
          <Pressable style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(107, 72, 29, 0.35)",
    justifyContent: "flex-end",
  },
  moreOptionsSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 28,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: "#cbd9d2",
    borderRadius: 3,
    height: 5,
    marginBottom: 14,
    width: 42,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: "#3a2818",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  cashLabel: {
    color: "#436157",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 4,
    textTransform: "uppercase",
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
  },
  noteInput: {
    minHeight: 54,
    textAlignVertical: "top",
  },
  applyButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 18,
  },
  applyButtonText: { color: "#fff", fontWeight: "800" },
});