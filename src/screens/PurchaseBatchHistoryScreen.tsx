import React, { useCallback, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../../App";
import {
  getPurchaseBatches,
  PurchaseBatchEntry,
} from "../database/productRepository";
import { formatMoney } from "../utils/formatters";
import { t } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "PurchaseBatchHistory">;

function formatQuantity(
  quantity: number,
  unit: PurchaseBatchEntry["selling_unit"],
  isPackage: boolean,
): string {
  if (isPackage) {
    // Whole packages show as integers; partial packages (base units consumed)
    // keep up to 2 decimals so nothing is hidden by rounding.
    const value = Number.isInteger(quantity)
      ? quantity.toLocaleString()
      : quantity.toFixed(2);
    return `${value} ${t("package")}`;
  }
  return `${unit === "unit" ? Math.round(quantity).toLocaleString() : quantity.toFixed(2)} ${unit === "unit" ? t("pcs") : unit}`;
}

function formatDateTime(value: string): string {
  const [datePart, timePart = ""] = value.split(" ");
  return `${datePart} · ${timePart.slice(0, 5)}`;
}

export default function PurchaseBatchHistoryScreen({ navigation }: Props) {
  const [batches, setBatches] = useState<PurchaseBatchEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;

  const loadBatches = useCallback(async (targetPage: number) => {
    setRefreshing(true);
    try {
      const result = await getPurchaseBatches(pageSize, targetPage * pageSize);
      setBatches(result.batches);
      setHasMore(result.hasMore);
      setPage(targetPage);
    } catch {
      Alert.alert(t("error"), t("couldNotLoadPurchaseBatches"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBatches(0);
    }, [loadBatches]),
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={batches}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBatches(0)}
            tintColor="#f36f0a"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerIdentity}>
                <View style={styles.headerIcon}>
                  <MaterialCommunityIcons
                    name="package-variant-closed"
                    size={21}
                    color="#f36f0a"
                  />
                </View>
                <View>
                  <Text style={styles.eyebrow}>{t("inventoryManagement")}</Text>
                  <Text style={styles.heading}>
                    {t("purchaseBatchHistory")}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={8}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={19}
                  color="#3a2818"
                />
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              {t("purchaseBatchHistorySubtitle")}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="package-down"
                size={48}
                color="#ead8ae"
              />
              <Text style={styles.emptyTitle}>{t("noPurchaseBatches")}</Text>
              <Text style={styles.emptyText}>{t("noPurchaseBatchesHint")}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const consumedQty = item.received_qty - item.remaining_qty;
          const isBatchNumbered = Boolean(item.batch_number);
          const isPackageBatch = Boolean(item.origin_product_id);
          return (
            <View style={styles.batchCard}>
              <View style={styles.batchTopline}>
                <View style={styles.productIdentity}>
                  <View style={styles.productIcon}>
                    <MaterialCommunityIcons
                      name="cart-arrow-down"
                      size={18}
                      color="#f36f0a"
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    <Text style={styles.batchMeta}>
                      {isBatchNumbered
                        ? `${t("batchNumber")}: ${item.batch_number}`
                        : t("opening")}
                    </Text>
                  </View>
                </View>
                <View style={styles.costBadge}>
                  <Text style={styles.costText}>
                    {t("unitCostPrice")}: {formatMoney(item.cost_price)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatQuantity(
                      item.received_qty,
                      item.selling_unit,
                      isPackageBatch,
                    )}
                  </Text>
                  <Text style={styles.statLabel}>{t("received")}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, styles.remainingValue]}>
                    {formatQuantity(
                      item.remaining_qty,
                      item.selling_unit,
                      isPackageBatch,
                    )}
                  </Text>
                  <Text style={styles.statLabel}>{t("remaining")}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, styles.consumedValue]}>
                    {formatQuantity(
                      consumedQty,
                      item.selling_unit,
                      isPackageBatch,
                    )}
                  </Text>
                  <Text style={styles.statLabel}>{t("consumed")}</Text>
                </View>
              </View>

              {isPackageBatch ? (
                <View style={styles.baseInfoRow}>
                  <MaterialCommunityIcons
                    name="cube-outline"
                    size={14}
                    color="#8a7658"
                  />
                  <Text style={styles.baseInfoText}>
                    {t("baseEquivalentInfo", {
                      name: item.base_product_name,
                      count: formatQuantity(
                        item.base_received_qty,
                        item.selling_unit_base,
                        false,
                      ),
                      cost: formatMoney(item.base_cost_price),
                    })}
                  </Text>
                </View>
              ) : null}

              <View style={styles.dateRow}>
                <MaterialCommunityIcons
                  name="calendar-clock-outline"
                  size={14}
                  color="#8a7658"
                />
                <Text style={styles.dateText}>
                  {t("receivedOn")}: {formatDateTime(item.received_at)}
                </Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          batches.length > 0 ? (
            <View style={styles.pagination}>
              <Pressable
                style={[styles.pageButton, page === 0 && styles.disabledButton]}
                onPress={() => loadBatches(page - 1)}
                disabled={page === 0 || refreshing}>
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={18}
                  color={page === 0 ? "#d8c9a9" : "#3a2818"}
                />
                <Text
                  style={[
                    styles.pageButtonText,
                    page === 0 && styles.disabledText,
                  ]}>
                  {t("previous")}
                </Text>
              </Pressable>
              <Text style={styles.pageText}>
                {t("page", { count: page + 1 })}
              </Text>
              <Pressable
                style={[styles.pageButton, !hasMore && styles.disabledButton]}
                onPress={() => loadBatches(page + 1)}
                disabled={!hasMore || refreshing}>
                <Text
                  style={[
                    styles.pageButtonText,
                    !hasMore && styles.disabledText,
                  ]}>
                  {t("next")}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={!hasMore ? "#d8c9a9" : "#3a2818"}
                />
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  header: { marginBottom: 18 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIdentity: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff0c2",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: {
    color: "#3a2818",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
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
  subtitle: {
    color: "#71837a",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyTitle: {
    color: "#3a2818",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: {
    color: "#8a7658",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  batchCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1dfb8",
    padding: 14,
    marginBottom: 10,
  },
  batchTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  productIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff4ee",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1 },
  productName: { color: "#3a2818", fontSize: 15, fontWeight: "800" },
  batchMeta: { color: "#8a7658", fontSize: 12, marginTop: 3 },
  costBadge: {
    backgroundColor: "#fff1c2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 8,
  },
  costText: { color: "#7a6442", fontSize: 10, fontWeight: "900" },
  divider: { height: 1, backgroundColor: "#fff1c2", marginVertical: 12 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statItem: { flex: 1 },
  statValue: { color: "#3a2818", fontSize: 14, fontWeight: "900" },
  remainingValue: { color: "#2f7d62" },
  consumedValue: { color: "#bd6337" },
  statLabel: {
    color: "#8a7658",
    fontSize: 11,
    marginTop: 3,
    fontWeight: "700",
  },
  baseInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#f5ead0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  baseInfoText: {
    color: "#7a6a52",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
  },
  dateText: { color: "#7a6a52", fontSize: 12, fontWeight: "700" },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingVertical: 8,
  },
  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#fff",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  disabledButton: { opacity: 0.7 },
  pageButtonText: { color: "#3a2818", fontSize: 12, fontWeight: "800" },
  disabledText: { color: "#aebdb5" },
  pageText: { color: "#7a6a52", fontSize: 12, fontWeight: "800" },
});
