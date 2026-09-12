import React, { useCallback, useState } from "react";
import {
  Alert,
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
} from "../database";
import { Customer } from "../types";
import { CustomerCard } from "../components/cards/CustomerCard";
import { CustomerFormModal } from "../components/modals/CustomerFormModal";
import { RepaymentModal } from "../components/modals/RepaymentModal";
import { DebtDetailModal } from "../components/modals/DebtDetailModal";

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
      resetCustomerForm();
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

  const resetCustomerForm = () => {
    setName("");
    setPhone("");
    setEditingCustomerId(null);
    setShowNewCustomer(false);
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

        {visibleCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onEdit={openEditCustomer}
            onDelete={confirmDeleteCustomer}
            onOpenDetails={(c) => void openDebtDetails(c)}
            onRepay={(c) => {
              setSelectedCustomer(c);
              setShowRepayment(true);
            }}
          />
        ))}

        {!customers.length && (
          <Text style={styles.emptyText}>No customers yet.</Text>
        )}
        {!!customers.length && !visibleCustomers.length && (
          <Text style={styles.emptyText}>No matching customers.</Text>
        )}
      </ScrollView>

      {/* Debt Detail Modal Component */}
      <DebtDetailModal
        visible={showDebtDetail}
        loading={loadingDebtDetail}
        debtDetail={debtDetail}
        onClose={() => setShowDebtDetail(false)}
        onNavigateToTransaction={(transactionId) => {
          setShowDebtDetail(false);
          navigation.navigate("Transactions", { transactionId });
        }}
        onRecordPayment={() => {
          if (!debtDetail) return;
          setShowDebtDetail(false);
          setSelectedCustomer({
            id: debtDetail.customer_id,
            name: debtDetail.name,
            phone: debtDetail.phone,
            total_debt: debtDetail.total_debt,
          });
          setShowRepayment(true);
        }}
      />

      {/* Repayment Modal Component */}
      <RepaymentModal
        visible={showRepayment}
        selectedCustomer={selectedCustomer}
        repayment={repayment}
        onChangeRepayment={setRepayment}
        onSave={() => void saveRepayment()}
        onClose={() => setShowRepayment(false)}
      />

      {/* Customer Form Modal Component */}
      <CustomerFormModal
        visible={showNewCustomer}
        editingCustomerId={editingCustomerId}
        name={name}
        phone={phone}
        onChangeName={setName}
        onChangePhone={setPhone}
        onSave={() => void saveCustomer()}
        onClose={resetCustomerForm}
      />
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
  addButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
    marginBottom: 14,
  },
  addButtonText: { color: "#fff", fontWeight: "800" },
  emptyText: { color: "#71837a", textAlign: "center", padding: 30 },
});
