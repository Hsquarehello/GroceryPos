import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { t } from "../../i18n";

interface HeaderProps {
  startDate: Date;
  endDate: Date;
}

export function QuantitySoldHeader({ startDate, endDate }: HeaderProps) {
  const isSingleDay = startDate.toDateString() === endDate.toDateString();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>
          {isSingleDay ? t("selectedDate") : t("dateRange")}
        </Text>
        <Text style={styles.heading}>{t("quantitySold")}</Text>
        <Text style={styles.subheading}>{t("productsSoldCompleted")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 18 },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#3a2818", fontSize: 30, fontWeight: "800", marginTop: 4 },
  subheading: { color: "#71837a", fontSize: 13, marginTop: 6 },
});
