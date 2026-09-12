// src/components/cart/CartSummaryFooter.tsx
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Customer } from "../../types";

interface CartSummaryFooterProps {
  subtotal: number;
  netTotal: number;
  discount: string;
  saleNote: string;
  cash: string;
  cashValue: number;
  change: number;
  paymentType: "CASH" | "CREDIT";
  selectedCustomer: Customer | undefined;
  selectedCustomerId: number | null;
  debtNote: string;
  checkingOut: boolean;
  setCash: (val: string) => void;
  setDebtNote: (val: string) => void;
  setPaymentType: (type: "CASH" | "CREDIT") => void;
  onOpenMoreOptions: () => void;
  onOpenCustomerPicker: () => void;
  onCheckout: () => void;
}

export default function CartSummaryFooter({
  subtotal,
  netTotal,
  discount,
  saleNote,
  cash,
  cashValue,
  change,
  paymentType,
  selectedCustomer,
  selectedCustomerId,
  debtNote,
  checkingOut,
  setCash,
  setDebtNote,
  setPaymentType,
  onOpenMoreOptions,
  onOpenCustomerPicker,
  onCheckout,
}: CartSummaryFooterProps) {
  const isCheckoutDisabled =
    checkingOut ||
    (paymentType === "CASH"
      ? cashValue < netTotal
      : !selectedCustomerId || cashValue < 0 || cashValue > netTotal);

  return (
    <View style={styles.footer}>
      {/* Subtotal */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <View style={styles.subtotalActions}>
          <Text style={styles.subtotalText}>
            {subtotal.toLocaleString()} MMK
          </Text>
          <Pressable
            style={styles.moreOptionsButton}
            onPress={onOpenMoreOptions}>
            <MaterialCommunityIcons
              name="tune-variant"
              size={16}
              color="#3a2818"
            />
            <Text style={styles.moreOptionsText}>More options</Text>
          </Pressable>
        </View>
      </View>

      {(discount || saleNote) && (
        <Text style={styles.optionsApplied}>
          {discount ? `Discount: ${discount} MMK` : ""}
          {discount && saleNote ? "  |  " : ""}
          {saleNote ? "Sale note added" : ""}
        </Text>
      )}

      {/* Net Total */}
      <View style={[styles.totalRow, { marginTop: 8 }]}>
        <Text style={styles.totalLabel}>Net Total</Text>
        <Text style={styles.total}>{netTotal.toLocaleString()} MMK</Text>
      </View>

      {/* Payment Type Toggle */}
      <View style={styles.paymentToggle}>
        {(["CASH", "CREDIT"] as const).map((type) => (
          <Pressable
            key={type}
            style={[
              styles.paymentOption,
              paymentType === type && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentType(type)}>
            <Text
              style={[
                styles.paymentOptionText,
                paymentType === type && styles.paymentOptionTextActive,
              ]}>
              {type === "CASH" ? "Cash" : "Credit"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Inputs according to Payment Type */}
      {paymentType === "CASH" ? (
        <>
          <Text style={styles.cashLabel}>Cash received</Text>
          <TextInput
            value={cash}
            onChangeText={setCash}
            style={styles.cashInput}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
            placeholderTextColor="#9aaa9f"
          />
        </>
      ) : (
        <>
          <Text style={styles.cashLabel}>Paid now (0 for full credit)</Text>
          <TextInput
            value={cash}
            onChangeText={setCash}
            style={styles.cashInput}
            keyboardType="decimal-pad"
            placeholder="0 for full credit"
            placeholderTextColor="#9aaa9f"
          />
          <View style={styles.creditSummary}>
            <Text style={styles.creditSummaryLabel}>
              {cashValue === 0 ? "Full credit" : "Split payment"}
            </Text>
            <Text style={styles.creditSummaryValue}>
              Due: {Math.max(0, netTotal - cashValue).toLocaleString()} MMK
            </Text>
          </View>
          <Pressable
            style={styles.customerPicker}
            onPress={onOpenCustomerPicker}>
            <Text style={styles.customerPickerText}>
              {selectedCustomer?.name ?? "Select customer"}
            </Text>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={20}
              color="#7a6a52"
            />
          </Pressable>
          <Text style={styles.cashLabel}>Debt note (optional)</Text>
          <TextInput
            value={debtNote}
            onChangeText={setDebtNote}
            style={[styles.cashInput, styles.noteInput]}
            multiline
            numberOfLines={2}
            placeholder="e.g. Customer will pay next Friday"
            placeholderTextColor="#9aaa9f"
          />
        </>
      )}

      {paymentType === "CASH" && (
        <View style={styles.changeRow}>
          <Text style={styles.changeLabel}>Change due</Text>
          <Text style={styles.change}>{change.toLocaleString()} MMK</Text>
        </View>
      )}

      {/* Complete Sale Button */}
      <Pressable
        style={[styles.pay, isCheckoutDisabled && styles.disabled]}
        onPress={onCheckout}
        disabled={isCheckoutDisabled}>
        <Text style={styles.payText}>
          {checkingOut
            ? "Processing..."
            : `Complete sale  ${netTotal.toLocaleString()} MMK`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#fff",
    borderTopColor: "#f0dfb6",
    borderTopWidth: 1,
    padding: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtotalActions: { alignItems: "flex-end", gap: 6 },
  moreOptionsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderColor: "#cbd9d2",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  moreOptionsText: { color: "#3a2818", fontSize: 11, fontWeight: "800" },
  optionsApplied: {
    color: "#7a6a52",
    fontSize: 12,
    marginTop: 8,
    textAlign: "right",
  },
  totalLabel: { color: "#7a6a52", fontSize: 15, fontWeight: "700" },
  subtotalText: { color: "#7a6a52", fontSize: 16, fontWeight: "800" },
  total: { color: "#3a2818", fontSize: 22, fontWeight: "900" },
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
  changeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  changeLabel: { color: "#71837a", fontSize: 16, fontWeight: "700" },
  change: { color: "#f36f0a", fontSize: 18, fontWeight: "800" },
  pay: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.45 },
  payText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  paymentToggle: {
    flexDirection: "row",
    backgroundColor: "#fff1c2",
    borderRadius: 8,
    padding: 3,
    marginTop: 10,
  },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 6,
  },
  paymentOptionActive: { backgroundColor: "#3a2818" },
  paymentOptionText: { color: "#7a6a52", fontWeight: "800" },
  paymentOptionTextActive: { color: "#fff" },
  customerPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fffaf0",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  customerPickerText: { color: "#3a2818", fontSize: 15, fontWeight: "700" },
  creditSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff1c2",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  creditSummaryLabel: { color: "#7a6a52", fontSize: 12, fontWeight: "800" },
  creditSummaryValue: { color: "#bd6337", fontSize: 13, fontWeight: "900" },
});
