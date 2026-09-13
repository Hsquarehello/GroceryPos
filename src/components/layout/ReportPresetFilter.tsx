// components/ReportPresetFilter.tsx
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../../i18n";

export type Preset = "today" | "yesterday" | "week" | "month";

export function getPresetRange(preset: Preset, today = new Date()) {
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);

  if (preset === "today") return { start: current, end: current };

  if (preset === "yesterday") {
    const yesterday = new Date(current);
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: yesterday, end: yesterday };
  }

  if (preset === "week") {
    const start = new Date(current);
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    return { start, end: current };
  }

  return {
    start: new Date(current.getFullYear(), current.getMonth(), 1),
    end: current,
  };
}

interface ReportPresetFilterProps {
  selectedPreset: Preset | null;
  onSelectPreset: (preset: Preset) => void;
}

const PRESETS: Array<[Preset, string]> = [
  ["today", t("today")],
  ["yesterday", t("yesterday")],
  ["week", t("thisWeek")],
  ["month", t("thisMonth")],
];

export function ReportPresetFilter({
  selectedPreset,
  onSelectPreset,
}: ReportPresetFilterProps) {
  return (
    <View style={styles.presetRow}>
      {PRESETS.map(([preset, label]) => (
        <Pressable
          key={preset}
          style={[
            styles.presetButton,
            selectedPreset === preset && styles.presetButtonActive,
          ]}
          onPress={() => onSelectPreset(preset)}>
          <Text
            style={[
              styles.presetText,
              selectedPreset === preset && styles.presetTextActive,
            ]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  presetRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 10,
  },
  presetButton: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff1c2",
    borderRadius: 9,
    paddingHorizontal: 5,
  },
  presetButtonActive: {
    backgroundColor: "#3a2818",
  },
  presetText: {
    color: "#7a6a52",
    fontSize: 11,
    fontWeight: "800",
  },
  presetTextActive: {
    color: "#fff",
  },
});
