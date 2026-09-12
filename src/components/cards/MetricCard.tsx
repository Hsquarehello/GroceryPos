// components/MetricCard.tsx
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface MetricCardProps {
  label: string;
  value: string;
  secondaryValue?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  valueColor?: string;
  onPress?: () => void;
}

export function MetricCard({
  label,
  value,
  secondaryValue,
  icon,
  valueColor,
  onPress,
}: MetricCardProps) {
  const content = (
    <View style={[styles.metric, onPress && styles.metricInsidePressable]}>
      <MaterialCommunityIcons name={icon} size={20} color="#f36f0a" />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
      {secondaryValue && (
        <Text style={styles.metricSecondaryValue}>{secondaryValue}</Text>
      )}
    </View>
  );

  return onPress ? (
    <Pressable
      style={({ pressed }) => [
        styles.metricPressable,
        pressed && styles.pressed,
      ]}
      onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  metric: {
    width: "48%",
    minHeight: 118,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1dfb8",
    padding: 14,
  },
  metricPressable: { width: "48%", borderRadius: 12 },
  metricInsidePressable: { width: "100%" },
  pressed: { opacity: 0.72 },
  metricLabel: {
    color: "#8a7658",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
  },
  metricValue: {
    color: "#3a2818",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6,
  },
  metricSecondaryValue: {
    color: "#7a6a52",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },
});