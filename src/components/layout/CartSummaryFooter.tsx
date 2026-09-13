// src/components/cart/CartSummaryFooter.tsx
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Customer } from "../../types";
import { t } from "../../i18n";

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
        <Text style={styles.totalLabel}>{t("subtotal")}</Text>
        <View style={styles.subtotalActions}>
          <Text style={styles.subtotalText}>
            {subtotal.toLocaleString()} {t("mmk")}
          </Text>
          <Pressable
            style={styles.moreOptionsButton}
            onPress={onOpenMoreOptions}>
            <MaterialCommunityIcons
              name="tune-variant"
              size={16}
              color="#3a2818"
            />
            <Text style={styles.moreOptionsText}>{t("moreOptions")}</Text>
          </Pressable>
        </View>
      </View>

      {(discount || saleNote) && (
        <Text style={styles.optionsApplied}>
          {discount ? `${t("discount")}: ${discount} ${t("mmk")}` : ""}
          {discount && saleNote ? "  |  " : ""}
          {saleNote ? t("saleNoteAdded") : ""}
        </Text>
      )}

      {/* Net Total */}
      <View style={[styles.totalRow, { marginTop: 8 }]}>
        <Text style={styles.totalLabel}>{t("netTotal")}</Text>
        <Text style={styles.total}>
          {netTotal.toLocaleString()} {t("mmk")}
        </Text>
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
              {type === "CASH" ? t("cash") : t("credit")}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Inputs according to Payment Type */}
      {paymentType === "CASH" ? (
        <>
          <Text style={styles.cashLabel}>{t("cashReceived")}</Text>
          <TextInput
            value={cash}
            onChangeText={setCash}
            style={styles.cashInput}
            keyboardType="decimal-pad"
            placeholder={t("enterAmount")}
            placeholderTextColor="#9aaa9f"
          />
        </>
      ) : (
        <>
          <Text style={styles.cashLabel}>{t("paidNow")}</Text>
          <TextInput
            value={cash}
            onChangeText={setCash}
            style={styles.cashInput}
            keyboardType="decimal-pad"
            placeholder={t("zeroFullCredit")}
            placeholderTextColor="#9aaa9f"
          />
          <View style={styles.creditSummary}>
            <Text style={styles.creditSummaryLabel}>
              {cashValue === 0 ? t("fullCreditLabel") : t("splitPaymentLabel")}
            </Text>
            <Text style={styles.creditSummaryValue}>
              {t("due", {
                amount: `${Math.max(0, netTotal - cashValue).toLocaleString()} ${t("mmk")}`,
              })}
            </Text>
          </View>
          <Pressable
            style={styles.customerPicker}
            onPress={onOpenCustomerPicker}>
            <Text style={styles.customerPickerText}>
              {selectedCustomer?.name ?? t("selectCustomer")}
            </Text>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={20}
              color="#7a6a52"
            />
          </Pressable>
          <Text style={styles.cashLabel}>{t("debtNote")}</Text>
          <TextInput
            value={debtNote}
            onChangeText={setDebtNote}
            style={[styles.cashInput, styles.noteInput]}
            multiline
            numberOfLines={2}
            placeholder={t("debtNoteExample")}
            placeholderTextColor="#9aaa9f"
          />
        </>
      )}

      {paymentType === "CASH" && (
        <View style={styles.changeRow}>
          <Text style={styles.changeLabel}>{t("changeDue")}</Text>
          <Text style={styles.change}>
            {change.toLocaleString()} {t("mmk")}
          </Text>
        </View>
      )}

      {/* Complete Sale Button */}
      <Pressable
        style={[styles.pay, isCheckoutDisabled && styles.disabled]}
        onPress={onCheckout}
        disabled={isCheckoutDisabled}>
        <Text style={styles.payText}>
          {checkingOut
            ? t("processing")
            : t("completeSale", {
                amount: `${netTotal.toLocaleString()} ${t("mmk")}`,
              })}
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
