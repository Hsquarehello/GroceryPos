import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { TransactionSummary } from "../../database";
import { formatMoney, formatTime } from "../../utils/formatters";

interface TransactionRowProps {
  transaction: TransactionSummary;
  onPress: () => void;
}

export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const isCredit = transaction.payment_type === "CREDIT";
  const isRefunded = transaction.status === "REFUNDED";
  const amountDue = Math.max(
    0,
    transaction.total_amount - transaction.cash_received,
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.transaction, pressed && styles.pressed]}
      onPress={onPress}>
      <View style={styles.transactionTopline}>
        <View style={styles.transactionIdentity}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={isCredit ? "account-clock-outline" : "cash-check"}
              size={19}
              color={isCredit ? "#bd6337" : "#f36f0a"}
            />
          </View>
          <View>
            <Text style={styles.transactionTitle}>
              {t("saleNumber", { id: transaction.id })}
            </Text>
            <Text style={styles.transactionMeta}>
              {formatTime(transaction.created_at)} ·{" "}
              {t("itemMetric", {
                count: transaction.item_count,
              })}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.badge,
            isCredit && styles.creditBadge,
            isRefunded && styles.refundedBadge,
          ]}>
          <Text
            style={[
              styles.badgeText,
              isCredit && styles.creditBadgeText,
              isRefunded && styles.refundedBadgeText,
            ]}>
            {isRefunded
              ? t("refunded").toUpperCase()
              : isCredit
                ? t("credit").toUpperCase()
                : t("cash").toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>{t("saleTotalLabel")}</Text>
        <Text style={styles.amountValue}>
          {formatMoney(transaction.total_amount)}
        </Text>
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>
          {isCredit ? t("paidNowLabel") : t("collected")}
        </Text>
        <Text style={styles.amountValue}>
          {formatMoney(
            isCredit ? transaction.cash_received : transaction.total_amount,
          )}
        </Text>
      </View>
      {isCredit && (
        <View style={styles.amountRow}>
          <Text style={styles.dueLabel}>{t("outstanding")}</Text>
          <Text style={styles.dueValue}>{formatMoney(amountDue)}</Text>
        </View>
      )}
      {isCredit && transaction.customer_name && (
        <View style={styles.customerRow}>
          <MaterialCommunityIcons
            name="account-outline"
            size={15}
            color="#7a6a52"
          />
          <Text style={styles.customerText}>{transaction.customer_name}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  transaction: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1dfb8",
    padding: 14,
    marginBottom: 10,
  },
  transactionTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transactionIdentity: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff4ee",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionTitle: { color: "#3a2818", fontSize: 15, fontWeight: "800" },
  transactionMeta: { color: "#8a7658", fontSize: 12, marginTop: 3 },
  badge: {
    backgroundColor: "#fff1c2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  creditBadge: { backgroundColor: "#fff1c2" },
  badgeText: { color: "#7a6442", fontSize: 10, fontWeight: "900" },
  creditBadgeText: { color: "#bd6337" },
  refundedBadge: { backgroundColor: "#f4e4df" },
  refundedBadgeText: { color: "#a33e2b" },
  divider: { height: 1, backgroundColor: "#fff1c2", marginVertical: 12 },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  amountLabel: { color: "#8a7658", fontSize: 13 },
  amountValue: { color: "#3a2818", fontSize: 13, fontWeight: "800" },
  dueLabel: { color: "#bd6337", fontSize: 13, fontWeight: "700" },
  dueValue: { color: "#bd6337", fontSize: 13, fontWeight: "900" },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  customerText: { color: "#7a6a52", fontSize: 12, fontWeight: "700" },
});
