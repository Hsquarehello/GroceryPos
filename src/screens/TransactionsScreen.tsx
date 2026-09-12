import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  getTransactionDetail,
  getTransactionsByDateRange,
  TransactionDetail,
  TransactionSummary,
} from "../database/productRepository";
import { TransactionRow } from "../components/layout/TransactionRow";
import { TransactionDetailModal } from "../components/modals/TransactionDetailModal";

type Props = NativeStackScreenProps<RootStackParamList, "Transactions">;

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
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
});
