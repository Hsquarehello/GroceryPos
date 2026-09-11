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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import {
  getDailyTransactions,
  TransactionSummary,
} from "../database/productRepository";

type Props = NativeStackScreenProps<RootStackParamList, "Transactions">;

const formatMoney = (value: number) =>
  `${Math.round(value).toLocaleString()} MMK`;

function formatTime(value: string) {
  const time = value.split(" ")[1] ?? value;
  return time.slice(0, 5);
}

export default function TransactionsScreen({ navigation }: Props) {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;

  const loadTransactions = useCallback(async (targetPage: number) => {
    setRefreshing(true);
    try {
      const result = await getDailyTransactions(
        new Date(),
        pageSize,
        targetPage * pageSize,
      );
      setTransactions(result.transactions);
      setHasMore(result.hasMore);
      setPage(targetPage);
    } catch {
      Alert.alert("Error", "Could not load today's transactions.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTransactions(0);
    }, [loadTransactions]),
  );

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
            tintColor="#e77945"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>TODAY</Text>
              <Text style={styles.heading}>Transactions</Text>
            </View>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={19}
                color="#173f35"
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
                color="#cbd9d2"
              />
              <Text style={styles.emptyTitle}>No transactions today</Text>
              <Text style={styles.emptyText}>
                Completed sales will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <TransactionRow transaction={item} />}
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
                  color={page === 0 ? "#aebdb5" : "#173f35"}
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
                  color={!hasMore ? "#aebdb5" : "#173f35"}
                />
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function TransactionRow({ transaction }: { transaction: TransactionSummary }) {
  const isCredit = transaction.payment_type === "CREDIT";
  const amountDue = Math.max(
    0,
    transaction.total_amount - transaction.cash_received,
  );

  return (
    <View style={styles.transaction}>
      <View style={styles.transactionTopline}>
        <View style={styles.transactionIdentity}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={isCredit ? "account-clock-outline" : "cash-check"}
              size={19}
              color={isCredit ? "#bd6337" : "#e77945"}
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
        <View style={[styles.badge, isCredit && styles.creditBadge]}>
          <Text style={[styles.badgeText, isCredit && styles.creditBadgeText]}>
            {isCredit ? "CREDIT" : "CASH"}
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
            color="#60736a"
          />
          <Text style={styles.customerText}>{transaction.customer_name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f3" },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
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
  transaction: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4ebe6",
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
  transactionTitle: { color: "#173f35", fontSize: 15, fontWeight: "800" },
  transactionMeta: { color: "#71837a", fontSize: 12, marginTop: 3 },
  badge: {
    backgroundColor: "#eef4f1",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  creditBadge: { backgroundColor: "#fff0e9" },
  badgeText: { color: "#436157", fontSize: 10, fontWeight: "900" },
  creditBadgeText: { color: "#bd6337" },
  divider: { height: 1, backgroundColor: "#eef4f1", marginVertical: 12 },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  amountLabel: { color: "#71837a", fontSize: 13 },
  amountValue: { color: "#173f35", fontSize: 13, fontWeight: "800" },
  dueLabel: { color: "#bd6337", fontSize: 13, fontWeight: "700" },
  dueValue: { color: "#bd6337", fontSize: 13, fontWeight: "900" },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  customerText: { color: "#60736a", fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyTitle: {
    color: "#173f35",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: { color: "#71837a", marginTop: 6 },
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
    borderColor: "#dce6e0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  disabledButton: { opacity: 0.7 },
  pageButtonText: { color: "#173f35", fontSize: 12, fontWeight: "800" },
  disabledText: { color: "#aebdb5" },
  pageText: { color: "#60736a", fontSize: 12, fontWeight: "800" },
});
