import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../i18n";

export const ProductEmptyState = React.memo(() => {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="package-variant-closed"
        size={42}
        color="#d7e0dc"
      />
      <Text style={styles.emptyTitle}>{t("noProducts")}</Text>
      <Text style={styles.emptyText}>{t("addFirstProduct")}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#3a2818",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },
  emptyText: { color: "#71837a", marginTop: 6, textAlign: "center" },
});
