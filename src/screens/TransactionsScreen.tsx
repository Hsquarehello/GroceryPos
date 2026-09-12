import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  getTransactionDetail,
  getTransactionsByDateRange,
  refundTransaction,
  TransactionDetail,
  TransactionSummary,
} from "../database/productRepository";

type Props = NativeStackScreenProps<RootStackParamList, "Transactions">;

const formatMoney = (value: number) =>
  `${Math.round(value).toLocaleString()} MMK`;

function formatTime(value: string) {
  const time = value.split(" ")[1] ?? value;
  return time.slice(0, 5);
}

export default function TransactionsScreen({ navigation, route }: Props) {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const pageSize = 10;
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

  const loadTransactions = useCallback(
    async (targetPage: number) => {
      setRefreshing(true);
      try {
        const result = await getTransactionsByDateRange(
          startDate,
          endDate,
          pageSize,
          targetPage * pageSize,
        );
        setTransactions(result.transactions);
        setHasMore(result.hasMore);
        setPage(targetPage);
      } catch {
        Alert.alert("Error", "Could not load the selected transactions.");
      } finally {
        setRefreshing(false);
      }
    },
    [endDate, startDate],
  );

  useFocusEffect(
    useCallback(() => {
      void loadTransactions(0);
    }, [loadTransactions]),
  );

  const openTransactionDetail = async (transactionId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await getTransactionDetail(transactionId);
      setSelectedTransaction(detail);
    } catch {
      Alert.alert("Error", "Could not load transaction details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (route.params?.transactionId !== undefined) {
      void openTransactionDetail(route.params.transactionId);
    }
  }, [route.params?.transactionId]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTransactions(0)}
            tintColor="#f36f0a"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                {startDate.toDateString() === endDate.toDateString()
                  ? "SELECTED DATE"
                  : "DATE RANGE"}
              </Text>
              <Text style={styles.heading}>Transactions</Text>
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
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={48}
                color="#ead8ae"
              />
              <Text style={styles.emptyTitle}>No transactions today</Text>
              <Text style={styles.emptyText}>
                Completed sales will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            onPress={() => void openTransactionDetail(item.id)}
          />
        )}
        ListFooterComponent={
          transactions.length > 0 ? (
            <View style={styles.pagination}>
              <Pressable
                style={[styles.pageButton, page === 0 && styles.disabledButton]}
                onPress={() => loadTransactions(page - 1)}
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
                  Previous
                </Text>
              </Pressable>
              <Text style={styles.pageText}>Page {page + 1}</Text>
              <Pressable
                style={[styles.pageButton, !hasMore && styles.disabledButton]}
                onPress={() => loadTransactions(page + 1)}
                disabled={!hasMore || refreshing}>
                <Text
                  style={[
                    styles.pageButtonText,
                    !hasMore && styles.disabledText,
                  ]}>
                  Next
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

      <TransactionDetailModal
        detail={selectedTransaction}
        loading={loadingDetail}
        onClose={() => setSelectedTransaction(null)}
        onChanged={async () => {
          if (selectedTransaction) {
            await openTransactionDetail(selectedTransaction.id);
            await loadTransactions(page);
          }
        }}
      />
    </View>
  );
}

function TransactionRow({
  transaction,
  onPress,
}: {
  transaction: TransactionSummary;
  onPress: () => void;
}) {
  const isCredit = transaction.payment_type === "CREDIT";
  const isRefunded = transaction.status === "REFUNDED";
  const amountDue = Math.max(
    0,
    transaction.total_amount - transaction.cash_received,
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.transaction, pressed && styles.pressed]}
      onPress={onPress}>
      <View style={styles.transactionTopline}>
        <View style={styles.transactionIdentity}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={isCredit ? "account-clock-outline" : "cash-check"}
              size={19}
              color={isCredit ? "#bd6337" : "#f36f0a"}
            />
          </View>
          <View>
            <Text style={styles.transactionTitle}>Sale #{transaction.id}</Text>
            <Text style={styles.transactionMeta}>
              {formatTime(transaction.created_at)} · {transaction.item_count}{" "}
              {transaction.item_count === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.badge,
            isCredit && styles.creditBadge,
            isRefunded && styles.refundedBadge,
          ]}>
          <Text
            style={[
              styles.badgeText,
              isCredit && styles.creditBadgeText,
              isRefunded && styles.refundedBadgeText,
            ]}>
            {isRefunded ? "REFUNDED" : isCredit ? "CREDIT" : "CASH"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Sale total</Text>
        <Text style={styles.amountValue}>
          {formatMoney(transaction.total_amount)}
        </Text>
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>
          {isCredit ? "Paid now" : "Collected"}
        </Text>
        <Text style={styles.amountValue}>
          {formatMoney(
            isCredit ? transaction.cash_received : transaction.total_amount,
          )}
        </Text>
      </View>
      {isCredit && (
        <View style={styles.amountRow}>
          <Text style={styles.dueLabel}>Outstanding</Text>
          <Text style={styles.dueValue}>{formatMoney(amountDue)}</Text>
        </View>
      )}
      {isCredit && transaction.customer_name && (
        <View style={styles.customerRow}>
          <MaterialCommunityIcons
            name="account-outline"
            size={15}
            color="#7a6a52"
          />
          <Text style={styles.customerText}>{transaction.customer_name}</Text>
        </View>
      )}
    </Pressable>
  );
}

function TransactionDetailModal({
  detail,
  loading,
  onClose,
  onChanged,
}: {
  detail: TransactionDetail | null;
  loading: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [processing, setProcessing] = useState(false);
  const isCredit = detail?.payment_type === "CREDIT";
  const outstanding = detail
    ? Math.max(0, detail.total_amount - detail.cash_received)
    : 0;

  const refund = () => {
    if (!detail || detail.status === "REFUNDED") return;
    Alert.alert(
      "Refund sale",
      `Return all items from Sale #${detail.id} to stock?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refund",
          style: "destructive",
          onPress: async () => {
            setProcessing(true);
            try {
              await refundTransaction(detail.id);
              await onChanged();
              Alert.alert(
                "Refund complete",
                "The sale was refunded and stock was restored.",
              );
            } catch (error) {
              Alert.alert(
                "Could not refund sale",
                error instanceof Error ? error.message : "Please try again.",
              );
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={loading || detail !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.modalEyebrow}>TRANSACTION DETAIL</Text>
              <Text style={styles.modalTitle}>
                {detail ? `Sale #${detail.id}` : "Loading sale"}
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color="#3a2818" />
            </Pressable>
          </View>

          {loading || !detail ? (
            <View style={styles.loadingDetail}>
              <Text style={styles.detailMuted}>
                Loading transaction details...
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.detailDate}>
                {new Date(detail.created_at).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Text>

              <View style={styles.detailStatusRow}>
                <View
                  style={[
                    styles.badge,
                    isCredit && styles.creditBadge,
                    detail.status === "REFUNDED" && styles.refundedBadge,
                  ]}>
                  <Text
                    style={[
                      styles.badgeText,
                      isCredit && styles.creditBadgeText,
                      detail.status === "REFUNDED" && styles.refundedBadgeText,
                    ]}>
                    {detail.status === "REFUNDED"
                      ? "REFUNDED"
                      : isCredit
                        ? "CREDIT"
                        : "CASH"}
                  </Text>
                </View>
                {detail.customer_name ? (
                  <Text style={styles.detailCustomer}>
                    {detail.customer_name}
                    {detail.customer_phone ? ` · ${detail.customer_phone}` : ""}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.detailSectionTitle}>Items</Text>
              {detail.items.map((item) => (
                <View key={item.id} style={styles.detailItem}>
                  <View style={styles.detailItemInfo}>
                    <Text style={styles.detailItemName}>
                      {item.product_name}
                    </Text>
                    <Text style={styles.detailMuted}>
                      {item.quantity} {item.selling_unit} ×{" "}
                      {formatMoney(item.unit_price)}
                    </Text>
                  </View>
                  <Text style={styles.detailItemTotal}>
                    {formatMoney(item.line_total)}
                  </Text>
                </View>
              ))}

              <View style={styles.detailTotals}>
                <DetailAmount label="Discount" value={detail.discount_amount} />
                <DetailAmount
                  label="Sale total"
                  value={detail.total_amount}
                  strong
                />
                <DetailAmount
                  label={isCredit ? "Paid now" : "Collected"}
                  value={isCredit ? detail.cash_received : detail.total_amount}
                />
                {!isCredit && (
                  <DetailAmount label="Change" value={detail.change_amount} />
                )}
                {isCredit && (
                  <DetailAmount
                    label="Outstanding"
                    value={outstanding}
                    danger
                    strong
                  />
                )}
              </View>

              {detail.sale_note || detail.debt_note ? (
                <View style={styles.notesBox}>
                  {detail.sale_note ? (
                    <Text style={styles.noteText}>
                      Sale note: {detail.sale_note}
                    </Text>
                  ) : null}
                  {detail.debt_note ? (
                    <Text style={styles.noteText}>
                      Debt note: {detail.debt_note}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.detailActions}>
                {detail.status !== "REFUNDED" ? (
                  <>
                    <Pressable
                      style={[styles.actionButton, styles.refundButton]}
                      onPress={refund}
                      disabled={processing}>
                      <MaterialCommunityIcons
                        name="cash-refund"
                        size={17}
                        color="#a33e2b"
                      />
                      <Text style={styles.refundButtonText}>Refund sale</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function DetailAmount({
  label,
  value,
  strong = false,
  danger = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={styles.amountRow}>
      <Text
        style={[
          styles.amountLabel,
          strong && styles.detailStrong,
          danger && styles.dueLabel,
        ]}>
        {label}
      </Text>
      <Text
        style={[
          styles.amountValue,
          strong && styles.detailStrong,
          danger && styles.dueValue,
        ]}>
        {formatMoney(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  pressed: { opacity: 0.72 },
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
  transaction: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1dfb8",
    padding: 14,
    marginBottom: 10,
  },
  transactionTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transactionIdentity: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff4ee",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionTitle: { color: "#3a2818", fontSize: 15, fontWeight: "800" },
  transactionMeta: { color: "#8a7658", fontSize: 12, marginTop: 3 },
  badge: {
    backgroundColor: "#fff1c2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  creditBadge: { backgroundColor: "#fff1c2" },
  badgeText: { color: "#7a6442", fontSize: 10, fontWeight: "900" },
  creditBadgeText: { color: "#bd6337" },
  refundedBadge: { backgroundColor: "#f4e4df" },
  refundedBadgeText: { color: "#a33e2b" },
  divider: { height: 1, backgroundColor: "#fff1c2", marginVertical: 12 },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  amountLabel: { color: "#8a7658", fontSize: 13 },
  amountValue: { color: "#3a2818", fontSize: 13, fontWeight: "800" },
  dueLabel: { color: "#bd6337", fontSize: 13, fontWeight: "700" },
  dueValue: { color: "#bd6337", fontSize: 13, fontWeight: "900" },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  customerText: { color: "#7a6a52", fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyTitle: {
    color: "#3a2818",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: { color: "#8a7658", marginTop: 6 },
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(44, 31, 18, 0.45)",
  },
  detailModal: {
    backgroundColor: "#fffaf0",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: "88%",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalEyebrow: {
    color: "#f36f0a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  modalTitle: {
    color: "#3a2818",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  loadingDetail: { paddingVertical: 42, alignItems: "center" },
  detailDate: { color: "#71837a", fontSize: 13, marginBottom: 12 },
  detailStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 16,
  },
  detailCustomer: { color: "#7a6a52", fontSize: 12, fontWeight: "700" },
  detailSectionTitle: {
    color: "#3a2818",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1dfb8",
    borderRadius: 9,
    padding: 11,
    marginBottom: 7,
  },
  detailItemInfo: { flex: 1, paddingRight: 10 },
  detailItemName: { color: "#3a2818", fontSize: 13, fontWeight: "800" },
  detailItemTotal: { color: "#3a2818", fontSize: 13, fontWeight: "900" },
  detailMuted: { color: "#71837a", fontSize: 12, marginTop: 3 },
  detailTotals: {
    borderTopWidth: 1,
    borderTopColor: "#f0dfb6",
    marginTop: 8,
    paddingTop: 9,
  },
  detailStrong: { fontWeight: "900", color: "#3a2818" },
  notesBox: {
    backgroundColor: "#fff1c2",
    borderRadius: 9,
    padding: 11,
    marginTop: 14,
  },
  noteText: { color: "#7a6a52", fontSize: 12, lineHeight: 18 },
  detailActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  refundButton: { backgroundColor: "#f4e4df" },
  refundButtonText: { color: "#a33e2b", fontSize: 12, fontWeight: "900" },
});
