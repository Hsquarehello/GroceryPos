// components/DateButton.tsx
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface DateButtonProps {
  label: string;
  date: Date;
  onPress: () => void;
}

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function DateButton({ label, date, onPress }: DateButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
      onPress={onPress}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>{formatDate(date)}</Text>
      <MaterialCommunityIcons name="calendar-blank" size={18} color="#f36f0a" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    flex: 1,
    minHeight: 64,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f0dfb6",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pressed: { opacity: 0.72 },
  dateLabel: {
    color: "#8a7658",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  dateValue: {
    color: "#3a2818",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 5,
  },
});