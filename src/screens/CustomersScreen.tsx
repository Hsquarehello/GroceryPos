import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../../App";
import {
  createCustomer,
  CustomerDebtDetail,
  deleteCustomer,
  getCustomerDebtDetail,
  getCustomers,
  repayCustomerDebt,
  updateCustomer,
} from "../database/productRepository";
import { Customer } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Customers">;

export default function CustomersScreen({ navigation }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [debtDetail, setDebtDetail] = useState<CustomerDebtDetail | null>(null);
  const [repayment, setRepayment] = useState("");
  const [showRepayment, setShowRepayment] = useState(false);
  const [showDebtDetail, setShowDebtDetail] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(
    null,
  );
  const [loadingDebtDetail, setLoadingDebtDetail] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");

  const loadCustomers = useCallback(async () => {
    setRefreshing(true);
    try {
      setCustomers(await getCustomers());
    } catch {
      Alert.alert("Error", "Could not load customers.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCustomers();
    }, [loadCustomers]),
  );

  const saveCustomer = async () => {
    try {
      if (editingCustomerId !== null) {
        await updateCustomer(editingCustomerId, name, phone);
      } else {
        await createCustomer(name, phone);
      }
      setName("");
      setPhone("");
      setEditingCustomerId(null);
      setShowNewCustomer(false);
      await loadCustomers();
    } catch (error) {
      Alert.alert(
        editingCustomerId !== null
          ? "Could not update customer"
          : "Could not add customer",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id ?? null);
    setName(customer.name);
    setPhone(customer.phone ?? "");
    setShowNewCustomer(true);
  };

  const confirmDeleteCustomer = (customer: Customer) => {
    if (!customer.id) return;

    Alert.alert(
      "Delete customer",
      `Delete ${customer.name}? This will remove the customer record and their repayment history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomer(customer.id!);
              if (selectedCustomer?.id === customer.id) {
                setSelectedCustomer(null);
              }
              if (debtDetail?.customer_id === customer.id) {
                setShowDebtDetail(false);
                setDebtDetail(null);
              }
              await loadCustomers();
            } catch (error) {
              Alert.alert(
                "Could not delete customer",
                error instanceof Error ? error.message : "Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const saveRepayment = async () => {
    if (!selectedCustomer) return;
    try {
      await repayCustomerDebt(selectedCustomer.id!, Number(repayment));
      setRepayment("");
      setShowRepayment(false);
      setSelectedCustomer(null);
      if (showDebtDetail && debtDetail) {
        const refreshed = await getCustomerDebtDetail(selectedCustomer.id!);
        setDebtDetail(refreshed);
      }
      await loadCustomers();
    } catch (error) {
      Alert.alert(
        "Could not record repayment",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const openDebtDetails = async (customer: Customer) => {
    if (!customer.id) return;
    setSelectedCustomer(customer);
    setLoadingDebtDetail(true);
    try {
      const detail = await getCustomerDebtDetail(customer.id);
      setDebtDetail(detail);
      setShowDebtDetail(true);
    } catch (error) {
      Alert.alert(
        "Could not load debt details",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoadingDebtDetail(false);
    }
  };

  const totalDebt = customers.reduce(
    (sum, customer) => sum + customer.total_debt,
    0,
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleCustomers = normalizedSearch
    ? customers.filter((customer) =>
        [customer.name, customer.phone ?? ""].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearch),
        ),
      )
    : customers;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadCustomers}
            tintColor="#f36f0a"
          />
        }>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>ACCOUNTS RECEIVABLE</Text>
            <Text style={styles.heading}>Customers</Text>
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

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Total outstanding</Text>
            <Text style={styles.summaryValue}>
              {totalDebt.toLocaleString()} MMK
            </Text>
          </View>
          <Text style={styles.customerCount}>
            {visibleCustomers.length} of {customers.length} customers
          </Text>
        </View>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#71837a" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Search by name or phone"
            placeholderTextColor="#9aaa9f"
            autoCapitalize="none"
            returnKeyType="search"
          />
          {!!search && (
            <Pressable
              style={styles.clearSearch}
              onPress={() => setSearch("")}
              accessibilityLabel="Clear customer search">
              <MaterialCommunityIcons
                name="close-circle"
                size={19}
                color="#9aaa9f"
              />
            </Pressable>
          )}
        </View>

        {visibleCustomers.map((customer) => (
          <View key={customer.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Pressable
                style={styles.editIconButton}
                onPress={() => openEditCustomer(customer)}
                accessibilityLabel={`Edit ${customer.name}`}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color="#3a2818"
                />
              </Pressable>

              <Pressable
                style={styles.deleteIconButton}
                onPress={() => confirmDeleteCustomer(customer)}
                accessibilityLabel={`Delete ${customer.name}`}>
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={18}
                  color="#bd6337"
                />
              </Pressable>
            </View>

            <Pressable onPress={() => void openDebtDetails(customer)}>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{customer.name}</Text>
                {!!customer.phone && (
                  <Text style={styles.phone}>{customer.phone}</Text>
                )}
                <Text
                  style={[
                    styles.debt,
                    customer.total_debt === 0 && styles.paid,
                  ]}>
                  {customer.total_debt.toLocaleString()} MMK outstanding
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.repayButton,
                customer.total_debt === 0 && styles.disabledButton,
              ]}
              disabled={customer.total_debt === 0}
              onPress={() => {
                setSelectedCustomer(customer);
                setShowRepayment(true);
              }}>
              <MaterialCommunityIcons
                name="cash-check"
                size={17}
                color="#fff"
              />
              <Text style={styles.repayText}>Repay</Text>
            </Pressable>
          </View>
        ))}

        {!customers.length && (
          <Text style={styles.emptyText}>No customers yet.</Text>
        )}
        {!!customers.length && !visibleCustomers.length && (
          <Text style={styles.emptyText}>No matching customers.</Text>
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => setShowNewCustomer(true)}>
          <MaterialCommunityIcons
            name="account-plus-outline"
            size={20}
            color="#fff"
          />
          <Text style={styles.addButtonText}>Add customer</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showDebtDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDebtDetail(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.modalTitle}>Debt history</Text>
                <Text style={styles.modalSubtext}>
                  {debtDetail?.name ?? "Customer"}
                </Text>
              </View>
              <Pressable
                style={styles.closeIconButton}
                onPress={() => setShowDebtDetail(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color="#3a2818"
                />
              </Pressable>
            </View>

            {loadingDebtDetail ? (
              <Text style={styles.emptyText}>Loading debt details...</Text>
            ) : debtDetail ? (
              <>
                <View style={styles.detailSummaryCard}>
                  <Text style={styles.summaryLabel}>Outstanding</Text>
                  <Text style={styles.detailSummaryValue}>
                    {debtDetail.total_debt.toLocaleString()} MMK
                  </Text>
                  <Text style={styles.summaryMeta}>
                    {debtDetail.sales.length} credit sale
                    {debtDetail.sales.length === 1 ? "" : "s"} ·{" "}
                    {debtDetail.repayments.length} repayment
                    {debtDetail.repayments.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Credit sales</Text>
                {debtDetail.sales.length ? (
                  debtDetail.sales.map((sale) => (
                    <View key={sale.id} style={styles.historyItem}>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyTitle}>Sale #{sale.id}</Text>
                        <Text style={styles.historyAmount}>
                          {sale.remaining_amount.toLocaleString()} MMK
                        </Text>
                      </View>
                      <Text style={styles.historyMeta}>
                        {new Date(sale.created_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Text>
                      <Text style={styles.historyMeta}>
                        Sale total: {sale.total_amount.toLocaleString()} MMK ·
                        Paid now: {sale.cash_received.toLocaleString()} MMK
                      </Text>
                      {sale.debt_note ? (
                        <Text style={styles.historyNote}>{sale.debt_note}</Text>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    No credit sales recorded.
                  </Text>
                )}

                <Text style={styles.sectionTitle}>Repayments</Text>
                {debtDetail.repayments.length ? (
                  debtDetail.repayments.map((repaymentItem) => (
                    <View key={repaymentItem.id} style={styles.historyItem}>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyTitle}>
                          Payment #{repaymentItem.id}
                        </Text>
                        <Text style={styles.historyAmountPositive}>
                          +{repaymentItem.amount_paid.toLocaleString()} MMK
                        </Text>
                      </View>
                      <Text style={styles.historyMeta}>
                        {new Date(repaymentItem.created_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No repayments yet.</Text>
                )}

                <Pressable
                  style={styles.addButton}
                  onPress={() => {
                    setShowDebtDetail(false);
                    setSelectedCustomer({
                      id: debtDetail.customer_id,
                      name: debtDetail.name,
                      phone: debtDetail.phone,
                      total_debt: debtDetail.total_debt,
                    });
                    setShowRepayment(true);
                  }}>
                  <MaterialCommunityIcons
                    name="cash-check"
                    size={17}
                    color="#fff"
                  />
                  <Text style={styles.addButtonText}>Record payment</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.emptyText}>No debt details available.</Text>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRepayment}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRepayment(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record repayment</Text>
            <Text style={styles.modalSubtext}>
              {selectedCustomer?.name} owes{" "}
              {selectedCustomer?.total_debt.toLocaleString()} MMK
            </Text>
            <TextInput
              value={repayment}
              onChangeText={setRepayment}
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="Amount paid"
              placeholderTextColor="#9aaa9f"
            />
            <Pressable
              style={styles.addButton}
              onPress={() => void saveRepayment()}>
              <Text style={styles.addButtonText}>Save repayment</Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowRepayment(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNewCustomer}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNewCustomer(false);
          setEditingCustomerId(null);
          setName("");
          setPhone("");
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCustomerId !== null ? "Edit customer" : "Add customer"}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#9aaa9f"
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="Phone (optional)"
              placeholderTextColor="#9aaa9f"
            />
            <Pressable
              style={styles.addButton}
              onPress={() => void saveCustomer()}>
              <Text style={styles.addButtonText}>
                {editingCustomerId !== null
                  ? "Update customer"
                  : "Save customer"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setShowNewCustomer(false);
                setEditingCustomerId(null);
                setName("");
                setPhone("");
              }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
  summary: {
    backgroundColor: "#3a2818",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  summaryLabel: {
    color: "#b8d1c3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 6,
  },
  customerCount: { color: "#d6e5dc", fontWeight: "700" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#3a2818",
    fontSize: 14,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  clearSearch: { padding: 4 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1dfb8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  deleteIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  cardInfo: { flex: 1 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
  },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  inlineButtonText: { color: "#3a2818", fontWeight: "700", fontSize: 12 },
  name: { color: "#3a2818", fontSize: 16, fontWeight: "800" },
  phone: { color: "#71837a", fontSize: 12, marginTop: 3 },
  debt: { color: "#bd6337", fontSize: 13, fontWeight: "800", marginTop: 8 },
  paid: { color: "#4c8b68" },
  repayButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    width: "100%",
  },
  disabledButton: { backgroundColor: "#bdc9c2" },
  repayText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  addButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "800" },
  emptyText: { color: "#71837a", textAlign: "center", padding: 30 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(107, 72, 29, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 14, padding: 18 },
  detailModalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    maxHeight: "85%",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: "#3a2818",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtext: { color: "#71837a", fontSize: 13, marginBottom: 12 },
  detailSummaryCard: {
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  detailSummaryValue: {
    color: "#bd6337",
    fontSize: 22,
    fontWeight: "900",
  },
  summaryMeta: { color: "#71837a", fontSize: 12, marginTop: 4 },
  sectionTitle: {
    color: "#3a2818",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  historyItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTitle: { color: "#3a2818", fontSize: 13, fontWeight: "800" },
  historyAmount: { color: "#bd6337", fontSize: 13, fontWeight: "800" },
  historyAmountPositive: { color: "#4c8b68", fontSize: 13, fontWeight: "800" },
  historyMeta: { color: "#71837a", fontSize: 12, marginTop: 4 },
  historyNote: {
    color: "#7a6a52",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#fffaf0",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: "#3a2818",
    marginTop: 10,
  },
  cancelButton: { alignItems: "center", padding: 12 },
  cancelText: { color: "#7a6a52", fontWeight: "800" },
});
