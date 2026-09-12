import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import {
  getQuantitySoldByDateRange,
  QuantitySoldItem,
} from "../database/productRepository";

import { QuantitySoldHeader } from "../components/QuantitySoldHeader";
import { UnitFilter, UnitFilterControl } from "../components/UnitFilterControl";
import { QuantitySoldItemRow } from "../components/QuantitySoldItemRow";
import { SortBy, SortDirection, SortModal } from "../components/SortModal";

type Props = NativeStackScreenProps<RootStackParamList, "QuantitySold">;

export default function QuantitySoldScreen({ navigation, route }: Props) {
  const [items, setItems] = useState<QuantitySoldItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unitFilter, setUnitFilter] = useState<UnitFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("quantity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [defaultDate] = useState(() => new Date());

  const startDate = useMemo(
    () =>
      route.params?.startDate
        ? new Date(`${route.params.startDate}T00:00:00`)
        : defaultDate,
    [defaultDate, route.params?.startDate],
  );

  const endDate = useMemo(
    () =>
      route.params?.endDate
        ? new Date(`${route.params.endDate}T00:00:00`)
        : startDate,
    [route.params?.endDate, startDate],
  );

  const loadItems = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await getQuantitySoldByDateRange(startDate, endDate));
    } catch {
      Alert.alert("Error", "Could not load quantity sold.");
    } finally {
      setRefreshing(false);
    }
  }, [endDate, startDate]);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  const filteredItems = items
    .filter((item) => {
      if (unitFilter === "items") return item.selling_unit === "unit";
      if (unitFilter === "weight") {
        return ["kg", "g", "viss", "tcl"].includes(item.selling_unit);
      }
      return true;
    })
    .sort((first, second) => {
      const difference =
        sortBy === "quantity"
          ? first.quantity - second.quantity
          : first.revenue - second.revenue;
      return sortDirection === "asc" ? difference : -difference;
    });

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item.product_id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadItems}
            tintColor="#f36f0a"
          />
        }
        ListHeaderComponent={
          <View>
            <QuantitySoldHeader
              startDate={startDate}
              endDate={endDate}
              onBackPress={() => navigation.goBack()}
            />
            <UnitFilterControl
              selectedFilter={unitFilter}
              onSelectFilter={setUnitFilter}
            />
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Sort by</Text>
              <Pressable
                style={styles.sortSelect}
                onPress={() => setShowSortMenu(true)}>
                <Text style={styles.sortSelectText}>
                  {sortBy === "quantity" ? "Quantity" : "Revenue"} ·{" "}
                  {sortDirection === "asc" ? "Ascending" : "Descending"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color="#3a2818"
                />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="scale-balance"
                size={48}
                color="#cbd9d2"
              />
              <Text style={styles.emptyTitle}>
                {unitFilter === "all"
                  ? "No quantities sold for this period"
                  : unitFilter === "items"
                    ? "No item products sold for this period"
                    : "No weight products sold for this period"}
              </Text>
              <Text style={styles.emptyText}>
                Completed sale quantities will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <QuantitySoldItemRow item={item} />}
      />

      <SortModal
        visible={showSortMenu}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onClose={() => setShowSortMenu(false)}
        onSelectSortBy={setSortBy}
        onSelectSortDirection={setSortDirection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },
  sortLabel: { color: "#71837a", fontSize: 12, fontWeight: "700" },
  sortSelect: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  sortSelectText: { color: "#3a2818", fontSize: 12, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyTitle: {
    color: "#3a2818",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: { color: "#71837a", marginTop: 6 },
});