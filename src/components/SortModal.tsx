import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type SortBy = "quantity" | "revenue";
export type SortDirection = "asc" | "desc";

interface SortModalProps {
  visible: boolean;
  sortBy: SortBy;
  sortDirection: SortDirection;
  onClose: () => void;
  onSelectSortBy: (field: SortBy) => void;
  onSelectSortDirection: (dir: SortDirection) => void;
}

export function SortModal({
  visible,
  sortBy,
  sortDirection,
  onClose,
  onSelectSortBy,
  onSelectSortDirection,
}: SortModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.sortModalOverlay} onPress={onClose}>
        <Pressable
          style={styles.sortMenu}
          onPress={(event) => event.stopPropagation()}>
          <View style={styles.sortMenuHeader}>
            <Text style={styles.sortMenuTitle}>Sort quantity sold</Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons name="close" size={21} color="#7a6a52" />
            </Pressable>
          </View>

          <Text style={styles.sortMenuLabel}>Field</Text>
          <View style={styles.sortChoices}>
            {(
              [
                ["quantity", "Quantity"],
                ["revenue", "Revenue"],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                style={[
                  styles.sortChoice,
                  sortBy === value && styles.sortChoiceActive,
                ]}
                onPress={() => onSelectSortBy(value)}>
                <Text
                  style={[
                    styles.sortChoiceText,
                    sortBy === value && styles.sortChoiceTextActive,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sortMenuLabel}>Order</Text>
          <View style={styles.sortChoices}>
            {(
              [
                ["asc", "Ascending"],
                ["desc", "Descending"],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                style={[
                  styles.sortChoice,
                  sortDirection === value && styles.sortChoiceActive,
                ]}
                onPress={() => onSelectSortDirection(value)}>
                <Text
                  style={[
                    styles.sortChoiceText,
                    sortDirection === value && styles.sortChoiceTextActive,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.applySortButton} onPress={onClose}>
            <Text style={styles.applySortText}>Apply sorting</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sortModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(107, 72, 29, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  sortMenu: { backgroundColor: "#fff", borderRadius: 14, padding: 18 },
  sortMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sortMenuTitle: { color: "#3a2818", fontSize: 18, fontWeight: "800" },
  sortMenuLabel: {
    color: "#71837a",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 7,
    textTransform: "uppercase",
  },
  sortChoices: { flexDirection: "row", gap: 8, marginBottom: 16 },
  sortChoice: {
    flex: 1,
    alignItems: "center",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
  },
  sortChoiceActive: { backgroundColor: "#3a2818", borderColor: "#3a2818" },
  sortChoiceText: { color: "#7a6a52", fontSize: 12, fontWeight: "800" },
  sortChoiceTextActive: { color: "#fff" },
  applySortButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 2,
  },
  applySortText: { color: "#fff", fontWeight: "800" },
});