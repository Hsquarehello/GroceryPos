import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../i18n";

interface HeaderProps {
  startDate: Date;
  endDate: Date;
  onBackPress: () => void;
}

export function QuantitySoldHeader({
  startDate,
  endDate,
  onBackPress,
}: HeaderProps) {
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
      <Pressable style={styles.backButton} onPress={onBackPress}>
        <MaterialCommunityIcons name="arrow-left" size={19} color="#3a2818" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#3a2818", fontSize: 30, fontWeight: "800", marginTop: 4 },
  subheading: { color: "#71837a", fontSize: 13, marginTop: 6 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
});
