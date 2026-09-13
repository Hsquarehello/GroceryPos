import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../i18n";

interface HomeHeaderProps {
  search: string;
  onSearchChange: (text: string) => void;
  onScanPress: () => void;
}

export const HomeHeader = React.memo(
  ({ search, onSearchChange, onScanPress }: HomeHeaderProps) => {
    return (
      <View>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>{t("inventory")}</Text>
            <Text style={styles.heading}>{t("yourProducts")}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.scanButton} onPress={onScanPress}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={20}
                color="#fff"
              />
              <Text style={styles.scanText}>{t("scan")}</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={t("searchNameBarcode")}
          placeholderTextColor="#8a9b95"
          style={styles.search}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#3a2818", fontSize: 30, fontWeight: "800", marginTop: 4 },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#3a2818",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  scanText: { color: "#fff", fontWeight: "700" },
  search: {
    backgroundColor: "#fff",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: "#3a2818",
  },
});
