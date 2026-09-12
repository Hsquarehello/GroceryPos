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
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { DailyReport, getDateRangeReport } from "../database/productRepository";

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

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

type Preset = "today" | "yesterday" | "week" | "month";

function getPresetRange(preset: Preset, today = new Date()) {
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

export default function ReportsScreen({ navigation }: Props) {
  const [report, setReport] = useState<DailyReport>(emptyReport);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>("today");
  const [pickerTarget, setPickerTarget] = useState<"start" | "end" | null>(
    null,
  );

  const loadReport = useCallback(async () => {
    setRefreshing(true);
    try {
      setReport(await getDateRangeReport(startDate, endDate));
    } catch {
      Alert.alert("Error", "Could not load the selected report.");
    } finally {
      setRefreshing(false);
    }
  }, [endDate, startDate]);

  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === "dismissed" || !selectedDate) {
        setPickerTarget(null);
        return;
      }

      if (pickerTarget === "start") {
        setStartDate(selectedDate);
        if (selectedDate > endDate) setEndDate(selectedDate);
      } else {
        setEndDate(selectedDate);
        if (selectedDate < startDate) setStartDate(selectedDate);
      }
      setSelectedPreset(null);
      setPickerTarget(null);
    },
    [endDate, pickerTarget, startDate],
  );

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
          tintColor="#f36f0a"
        />
      }>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>REPORTS</Text>
          <Text style={styles.heading}>Sales report</Text>
        </View>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={19} color="#3a2818" />
        </Pressable>
      </View>

      <View style={styles.presetRow}>
        {(
          [
            ["today", "Today"],
            ["yesterday", "Yesterday"],
            ["week", "This week"],
            ["month", "This month"],
          ] as const
        ).map(([preset, label]) => (
          <Pressable
            key={preset}
            style={[
              styles.presetButton,
              selectedPreset === preset && styles.presetButtonActive,
            ]}
            onPress={() => {
              const range = getPresetRange(preset);
              setStartDate(range.start);
              setEndDate(range.end);
              setSelectedPreset(preset);
            }}>
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

      <View style={styles.dateRange}>
        <DateButton
          label="FROM"
          date={startDate}
          onPress={() => setPickerTarget("start")}
        />
        <MaterialCommunityIcons name="arrow-right" size={18} color="#8a7658" />
        <DateButton
          label="TO"
          date={endDate}
          onPress={() => setPickerTarget("end")}
        />
      </View>

      {pickerTarget && (
        <DateTimePicker
          value={pickerTarget === "start" ? startDate : endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>NET COLLECTED</Text>
        <Text style={styles.heroValue}>
          {formatMoney(report.net_collected)}
        </Text>
        <Text style={styles.heroSubtext}>
          Actual money received from selected sales, excluding change
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
          onPress={() =>
            navigation.navigate("Transactions", {
              startDate,
              endDate,
            })
          }
        />
        <Metric
          label="Quantity sold"
          value={`${report.total_items.toLocaleString()} items`}
          secondaryValue={`${report.total_weight_tcl.toFixed(2)} tcl`}
          icon="scale-balance"
          onPress={() =>
            navigation.navigate("QuantitySold", {
              startDate,
              endDate,
            })
          }
        />
      </View>

      <View style={styles.note}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color="#7a6a52"
        />
        <Text style={styles.noteText}>
          Profit uses the cost price saved when each sale was completed.
        </Text>
      </View>
    </ScrollView>
  );
}

function DateButton({
  label,
  date,
  onPress,
}: {
  label: string;
  date: Date;
  onPress: () => void;
}) {
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
  screen: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#3a2818", fontSize: 30, fontWeight: "800", marginTop: 4 },
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
  hero: {
    backgroundColor: "#f36f0a",
    borderRadius: 14,
    padding: 22,
    marginBottom: 14,
  },
  heroLabel: {
    color: "#ffe8a3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroValue: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 },
  heroSubtext: { color: "#fff3d0", fontSize: 12, marginTop: 8 },
  dateRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff1c2",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  noteText: { flex: 1, color: "#7a6a52", fontSize: 12, lineHeight: 18 },
});
