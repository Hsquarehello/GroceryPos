import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../../i18n";

export type UnitFilter = "all" | "items" | "weight";

interface UnitFilterControlProps {
  selectedFilter: UnitFilter;
  onSelectFilter: (filter: UnitFilter) => void;
}

const FILTER_OPTIONS: [UnitFilter, string][] = [
  ["all", t("all")],
  ["items", t("items")],
  ["weight", t("weight")],
];

export function UnitFilterControl({
  selectedFilter,
  onSelectFilter,
}: UnitFilterControlProps) {
  return (
    <View style={styles.filterControl}>
      {FILTER_OPTIONS.map(([value, label]) => {
        const isActive = selectedFilter === value;
        return (
          <Pressable
            key={value}
            style={[styles.filterOption, isActive && styles.filterOptionActive]}
            onPress={() => onSelectFilter(value)}>
            <Text
              style={[styles.filterText, isActive && styles.filterTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filterControl: {
    flexDirection: "row",
    backgroundColor: "#fff1c2",
    borderRadius: 9,
    padding: 3,
    marginBottom: 14,
  },
  filterOption: {
    flex: 1,
    alignItems: "center",
    borderRadius: 7,
    paddingVertical: 9,
  },
  filterOptionActive: { backgroundColor: "#3a2818" },
  filterText: { color: "#7a6a52", fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: "#fff" },
});
