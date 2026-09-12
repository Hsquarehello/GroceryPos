import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Customer } from "../../types";

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onOpenDetails: (customer: Customer) => void;
  onRepay: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  onOpenDetails,
  onRepay,
}) => {
  const isPaid = customer.total_debt === 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Pressable
          style={styles.editIconButton}
          onPress={() => onEdit(customer)}
          accessibilityLabel={`Edit ${customer.name}`}>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={18}
            color="#3a2818"
          />
        </Pressable>

        <Pressable
          style={styles.deleteIconButton}
          onPress={() => onDelete(customer)}
          accessibilityLabel={`Delete ${customer.name}`}>
          <MaterialCommunityIcons
            name="delete-outline"
            size={18}
            color="#bd6337"
          />
        </Pressable>
      </View>

      <Pressable onPress={() => onOpenDetails(customer)}>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{customer.name}</Text>
          {!!customer.phone && (
            <Text style={styles.phone}>{customer.phone}</Text>
          )}
          <Text style={[styles.debt, isPaid && styles.paid]}>
            {customer.total_debt.toLocaleString()} MMK outstanding
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={[styles.repayButton, isPaid && styles.disabledButton]}
        disabled={isPaid}
        onPress={() => onRepay(customer)}>
        <MaterialCommunityIcons name="cash-check" size={17} color="#fff" />
        <Text style={styles.repayText}>Repay</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1dfb8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  deleteIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  cardInfo: { flex: 1 },
  name: { color: "#3a2818", fontSize: 16, fontWeight: "800" },
  phone: { color: "#71837a", fontSize: 12, marginTop: 3 },
  debt: { color: "#bd6337", fontSize: 13, fontWeight: "800", marginTop: 8 },
  paid: { color: "#4c8b68" },
  repayButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    width: "100%",
  },
  disabledButton: { backgroundColor: "#bdc9c2" },
  repayText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
