// screens/ReportsScreen.tsx
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
import { MetricCard } from "../components/cards/MetricCard";
import { DateButton } from "../components/layout/DateButton";
import {
  getPresetRange,
  Preset,
  ReportPresetFilter,
} from "../components/layout/ReportPresetFilter";

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

const formatRouteDate = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0"),
    )
    .join("-");

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

  const handleSelectPreset = (preset: Preset) => {
    const range = getPresetRange(preset);
    setStartDate(range.start);
    setEndDate(range.end);
    setSelectedPreset(preset);
  };

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

      <ReportPresetFilter
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
      />

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
        <MetricCard
          label="Net profit"
          value={formatMoney(report.profit)}
          icon="chart-line"
          valueColor={report.profit < 0 ? "#c0392b" : undefined}
        />
        <MetricCard
          label="Revenue"
          value={formatMoney(report.revenue)}
          icon="cash-register"
        />
        <MetricCard
          label="COGS"
          value={formatMoney(report.cogs)}
          icon="cart-minus"
        />
        <MetricCard
          label="Discount given"
          value={formatMoney(report.discount_total)}
          icon="sale-outline"
        />
        <MetricCard
          label="Credit outstanding"
          value={formatMoney(report.credit_outstanding)}
          icon="account-clock-outline"
        />
        <MetricCard
          label="Transactions"
          value={report.transaction_count.toLocaleString()}
          icon="receipt-text-outline"
          onPress={() =>
            navigation.navigate("Transactions", {
              startDate: formatRouteDate(startDate),
              endDate: formatRouteDate(endDate),
            })
          }
        />
        <MetricCard
          label="Quantity sold"
          value={`${report.total_items.toLocaleString()} items`}
          secondaryValue={`${report.total_weight_tcl.toFixed(2)} tcl`}
          icon="scale-balance"
          onPress={() =>
            navigation.navigate("QuantitySold", {
              startDate: formatRouteDate(startDate),
              endDate: formatRouteDate(endDate),
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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