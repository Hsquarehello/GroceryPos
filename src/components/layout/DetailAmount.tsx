import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatMoney } from "../../utils/formatters";

interface DetailAmountProps {
  label: string;
  value: number;
  strong?: boolean;
  danger?: boolean;
}

export function DetailAmount({
  label,
  value,
  strong = false,
  danger = false,
}: DetailAmountProps) {
  return (
    <View style={styles.amountRow}>
      <Text
        style={[
          styles.amountLabel,
          strong && styles.detailStrong,
          danger && styles.dueLabel,
        ]}>
        {label}
      </Text>
      <Text
        style={[
          styles.amountValue,
          strong && styles.detailStrong,
          danger && styles.dueValue,
        ]}>
        {formatMoney(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  detailStrong: { fontWeight: "900", color: "#3a2818" },
});
