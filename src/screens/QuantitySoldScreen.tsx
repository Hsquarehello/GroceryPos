import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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

type Props = NativeStackScreenProps<RootStackParamList, "QuantitySold">;
type UnitFilter = "all" | "items" | "weight";
type SortBy = "quantity" | "revenue";
type SortDirection = "asc" | "desc";

const formatQuantity = (
  quantity: number,
  unit: QuantitySoldItem["selling_unit"],
) =>
  `${unit === "unit" ? quantity.toLocaleString() : quantity.toFixed(2)} ${unit === "unit" ? "pcs" : unit}`;

const formatMoney = (value: number) =>
  `${Math.round(value).toLocaleString()} MMK`;

export default function QuantitySoldScreen({ navigation, route }: Props) {
  const [items, setItems] = useState<QuantitySoldItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unitFilter, setUnitFilter] = useState<UnitFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("quantity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const startDate = route.params?.startDate ?? new Date();
  const endDate = route.params?.endDate ?? startDate;

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
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>
                  {startDate.toDateString() === endDate.toDateString()
                    ? "SELECTED DATE"
                    : "DATE RANGE"}
                </Text>
                <Text style={styles.heading}>Quantity sold</Text>
                <Text style={styles.subheading}>
                  Products sold across completed sales
                </Text>
              </View>
              <Pressable
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={19}
                  color="#3a2818"
                />
              </Pressable>
            </View>
            <View style={styles.filterControl}>
              {(
                [
                  ["all", "All"],
                  ["items", "Items"],
                  ["weight", "Weight"],
                ] as const
              ).map(([value, label]) => (
                <Pressable
                  key={value}
                  style={[
                    styles.filterOption,
                    unitFilter === value && styles.filterOptionActive,
                  ]}
                  onPress={() => setUnitFilter(value)}>
                  <Text
                    style={[
                      styles.filterText,
                      unitFilter === value && styles.filterTextActive,
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
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
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.productIcon}>
              <MaterialCommunityIcons
                name={
                  item.selling_unit === "unit"
                    ? "package-variant-closed"
                    : "scale-balance"
                }
                size={20}
                color="#f36f0a"
              />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text style={styles.saleCount}>
                {item.sale_count} {item.sale_count === 1 ? "sale" : "sales"}
              </Text>
              <Text style={styles.revenue}>{formatMoney(item.revenue)}</Text>
            </View>
            <View style={styles.quantityInfo}>
              <Text style={styles.quantity}>
                {formatQuantity(item.quantity, item.selling_unit)}
              </Text>
              <Text style={styles.quantityLabel}>sold</Text>
            </View>
          </View>
        )}
      />
      <Modal
        visible={showSortMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}>
        <Pressable
          style={styles.sortModalOverlay}
          onPress={() => setShowSortMenu(false)}>
          <Pressable
            style={styles.sortMenu}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.sortMenuHeader}>
              <Text style={styles.sortMenuTitle}>Sort quantity sold</Text>
              <Pressable onPress={() => setShowSortMenu(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={21}
                  color="#7a6a52"
                />
              </Pressable>
            </View>
            <Text style={styles.sortMenuLabel}>Field</Text>
            <View style={styles.sortChoices}>
              {(
                [
                  ["quantity", "Quantity"],
                  ["revenue", "Revenue"],
                ] as const
              ).map(([value, label]) => (
                <Pressable
                  key={value}
                  style={[
                    styles.sortChoice,
                    sortBy === value && styles.sortChoiceActive,
                  ]}
                  onPress={() => setSortBy(value)}>
                  <Text
                    style={[
                      styles.sortChoiceText,
                      sortBy === value && styles.sortChoiceTextActive,
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sortMenuLabel}>Order</Text>
            <View style={styles.sortChoices}>
              {(
                [
                  ["asc", "Ascending"],
                  ["desc", "Descending"],
                ] as const
              ).map(([value, label]) => (
                <Pressable
                  key={value}
                  style={[
                    styles.sortChoice,
                    sortDirection === value && styles.sortChoiceActive,
                  ]}
                  onPress={() => setSortDirection(value)}>
                  <Text
                    style={[
                      styles.sortChoiceText,
                      sortDirection === value && styles.sortChoiceTextActive,
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.applySortButton}
              onPress={() => setShowSortMenu(false)}>
              <Text style={styles.applySortText}>Apply sorting</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#3a2818", fontSize: 30, fontWeight: "800", marginTop: 4 },
  subheading: { color: "#71837a", fontSize: 13, marginTop: 6 },
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
  sortModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(107, 72, 29, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  sortMenu: { backgroundColor: "#fff", borderRadius: 14, padding: 18 },
  sortMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sortMenuTitle: { color: "#3a2818", fontSize: 18, fontWeight: "800" },
  sortMenuLabel: {
    color: "#71837a",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 7,
    textTransform: "uppercase",
  },
  sortChoices: { flexDirection: "row", gap: 8, marginBottom: 16 },
  sortChoice: {
    flex: 1,
    alignItems: "center",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
  },
  sortChoiceActive: { backgroundColor: "#3a2818", borderColor: "#3a2818" },
  sortChoiceText: { color: "#7a6a52", fontSize: 12, fontWeight: "800" },
  sortChoiceTextActive: { color: "#fff" },
  applySortButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 2,
  },
  applySortText: { color: "#fff", fontWeight: "800" },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1dfb8",
    padding: 14,
    marginBottom: 10,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff4ee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  productInfo: { flex: 1 },
  productName: { color: "#3a2818", fontSize: 15, fontWeight: "800" },
  saleCount: { color: "#71837a", fontSize: 12, marginTop: 4 },
  revenue: { color: "#bd6337", fontSize: 12, fontWeight: "800", marginTop: 4 },
  quantityInfo: { alignItems: "flex-end", marginLeft: 8 },
  quantity: { color: "#3a2818", fontSize: 16, fontWeight: "900" },
  quantityLabel: { color: "#71837a", fontSize: 11, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyTitle: {
    color: "#3a2818",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: { color: "#71837a", marginTop: 6 },
});
