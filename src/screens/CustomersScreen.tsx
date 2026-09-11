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
  getCustomers,
  repayCustomerDebt,
} from "../database/productRepository";
import { Customer } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Customers">;

export default function CustomersScreen({ navigation }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [repayment, setRepayment] = useState("");
  const [showRepayment, setShowRepayment] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
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
      await createCustomer(name, phone);
      setName("");
      setPhone("");
      setShowNewCustomer(false);
      await loadCustomers();
    } catch (error) {
      Alert.alert(
        "Could not add customer",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const saveRepayment = async () => {
    if (!selectedCustomer) return;
    try {
      await repayCustomerDebt(selectedCustomer.id!, Number(repayment));
      setRepayment("");
      setShowRepayment(false);
      setSelectedCustomer(null);
      await loadCustomers();
    } catch (error) {
      Alert.alert(
        "Could not record repayment",
        error instanceof Error ? error.message : "Please try again.",
      );
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
            tintColor="#e77945"
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
              color="#173f35"
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
            <View style={styles.cardInfo}>
              <Text style={styles.name}>{customer.name}</Text>
              {!!customer.phone && (
                <Text style={styles.phone}>{customer.phone}</Text>
              )}
              <Text
                style={[styles.debt, customer.total_debt === 0 && styles.paid]}>
                {customer.total_debt.toLocaleString()} MMK outstanding
              </Text>
            </View>
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
        onRequestClose={() => setShowNewCustomer(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add customer</Text>
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
              <Text style={styles.addButtonText}>Save customer</Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowNewCustomer(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f3" },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
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
  summary: {
    backgroundColor: "#173f35",
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
    borderColor: "#dce6e0",
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#173f35",
    fontSize: 14,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  clearSearch: { padding: 4 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4ebe6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  cardInfo: { flex: 1 },
  name: { color: "#173f35", fontSize: 16, fontWeight: "800" },
  phone: { color: "#71837a", fontSize: 12, marginTop: 3 },
  debt: { color: "#bd6337", fontSize: 13, fontWeight: "800", marginTop: 8 },
  paid: { color: "#4c8b68" },
  repayButton: {
    backgroundColor: "#e77945",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  disabledButton: { backgroundColor: "#bdc9c2" },
  repayText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  addButton: {
    backgroundColor: "#e77945",
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
    backgroundColor: "rgba(23, 63, 53, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 14, padding: 18 },
  modalTitle: {
    color: "#173f35",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtext: { color: "#71837a", fontSize: 13, marginBottom: 12 },
  input: {
    backgroundColor: "#f5f7f3",
    borderColor: "#dce6e0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: "#173f35",
    marginTop: 10,
  },
  cancelButton: { alignItems: "center", padding: 12 },
  cancelText: { color: "#60736a", fontWeight: "800" },
});
