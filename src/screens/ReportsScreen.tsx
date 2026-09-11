import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { DailyReport, getDailyReport } from "../database/productRepository";

type Props = NativeStackScreenProps<RootStackParamList, "Reports">;

const emptyReport: DailyReport = {
  revenue: 0,
  discount_total: 0,
  net_collected: 0,
  credit_outstanding: 0,
  cogs: 0,
  profit: 0,
  transaction_count: 0,
  total_items: 0,
  total_weight_tcl: 0,
};

const formatMoney = (value: number) =>
  `${Math.round(value).toLocaleString()} MMK`;

export default function ReportsScreen({ navigation }: Props) {
  const [report, setReport] = useState<DailyReport>(emptyReport);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = useCallback(async () => {
    setRefreshing(true);
    try {
      setReport(await getDailyReport());
    } catch {
      Alert.alert("Error", "Could not load today's report.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReport();
    }, [loadReport]),
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={loadReport}
          tintColor="#e77945"
        />
      }>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>TODAY</Text>
          <Text style={styles.heading}>Daily report</Text>
        </View>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={19} color="#173f35" />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>NET COLLECTED</Text>
        <Text style={styles.heroValue}>
          {formatMoney(report.net_collected)}
        </Text>
        <Text style={styles.heroSubtext}>
          Actual money received from today's sales, excluding change
        </Text>
      </View>

      <View style={styles.grid}>
        <Metric
          label="Net profit"
          value={formatMoney(report.profit)}
          icon="chart-line"
          valueColor={report.profit < 0 ? "#c0392b" : undefined}
        />
        <Metric
          label="Revenue"
          value={formatMoney(report.revenue)}
          icon="cash-register"
        />
        <Metric
          label="Discount given"
          value={formatMoney(report.discount_total)}
          icon="sale-outline"
        />
        <Metric
          label="Credit outstanding"
          value={formatMoney(report.credit_outstanding)}
          icon="account-clock-outline"
        />
        <Metric
          label="COGS"
          value={formatMoney(report.cogs)}
          icon="cart-minus"
        />
        <Metric
          label="Transactions"
          value={report.transaction_count.toLocaleString()}
          icon="receipt-text-outline"
          onPress={() => navigation.navigate("Transactions")}
        />
        <Metric
          label="Quantity sold"
          value={`${report.total_items.toLocaleString()} items`}
          secondaryValue={`${report.total_weight_tcl.toFixed(2)} tcl`}
          icon="scale-balance"
          onPress={() => navigation.navigate("QuantitySold")}
        />
      </View>

      <View style={styles.note}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color="#60736a"
        />
        <Text style={styles.noteText}>
          Profit uses the cost price saved when each sale was completed.
        </Text>
      </View>
    </ScrollView>
  );
}

function Metric({
  label,
  value,
  secondaryValue,
  icon,
  valueColor,
  onPress,
}: {
  label: string;
  value: string;
  secondaryValue?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  valueColor?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.metric, onPress && styles.metricInsidePressable]}>
      <MaterialCommunityIcons name={icon} size={20} color="#e77945" />
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
  screen: { flex: 1, backgroundColor: "#f5f7f3" },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  eyebrow: {
    color: "#e77945",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#173f35", fontSize: 30, fontWeight: "800", marginTop: 4 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dce6e0",
  },
  hero: {
    backgroundColor: "#173f35",
    borderRadius: 14,
    padding: 22,
    marginBottom: 14,
  },
  heroLabel: {
    color: "#b8d1c3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroValue: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 },
  heroSubtext: { color: "#d6e5dc", fontSize: 12, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: {
    width: "48%",
    minHeight: 118,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4ebe6",
    padding: 14,
  },
  metricPressable: { width: "48%", borderRadius: 12 },
  metricInsidePressable: { width: "100%" },
  pressed: { opacity: 0.72 },
  metricLabel: {
    color: "#71837a",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
  },
  metricValue: {
    color: "#173f35",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6,
  },
  metricSecondaryValue: {
    color: "#60736a",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eef4f1",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  noteText: { flex: 1, color: "#60736a", fontSize: 12, lineHeight: 18 },
});
