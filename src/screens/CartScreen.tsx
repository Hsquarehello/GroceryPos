import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../../App";
import {
  completeSale,
  createCustomer,
  getCustomers,
} from "../database/productRepository";
import { useCartStore } from "../store/useCartStore";
import CartItem from "../components/CartItem";
import { Customer } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Cart">;

export default function CartScreen({ navigation }: Props) {
  const { items, addItem, decreaseItem, removeItem, clear, setQuantity } =
    useCartStore();
  const [cash, setCash] = useState("");
  const [discount, setDiscount] = useState(""); // Discount state
  const [saleNote, setSaleNote] = useState("");
  const [debtNote, setDebtNote] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [showCustomers, setShowCustomers] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const loadCustomers = async () => setCustomers(await getCustomers());

  // 1. Subtotal (မူလစုစုပေါင်း) တွက်ချက်ခြင်း
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.selling_price * item.quantity, 0),
    [items],
  );

  // 2. Discount နှင့် Net Total (Discount နှုတ်ပြီးကျသင့်ငွေ) တွက်ချက်ခြင်း
  const discountValue = Number(discount) || 0;
  const netTotal = Math.max(0, subtotal - discountValue);

  // 3. Change (ပြန်အမ်းငွေ) ကို Net Total ဖြင့် တွက်ချက်ခြင်း
  const cashValue = Number(cash) || 0;
  const change = Math.max(0, cashValue - netTotal);
  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  const checkout = async () => {
    if (!items.length) return;
    setCheckingOut(true);
    try {
      // completeSale ထဲသို့ cashValue နှင့် discountValue တို့ကို ထည့်သွင်းပေးလိုက်သည်
      const sale = await completeSale(
        items,
        cashValue,
        discountValue,
        paymentType,
        selectedCustomerId,
        saleNote,
        debtNote,
      );
      clear();
      setCash("");
      setDiscount("");
      setSaleNote("");
      setDebtNote("");
      setPaymentType("CASH");
      setSelectedCustomerId(null);
      Alert.alert(
        "Sale complete",
        paymentType === "CREDIT"
          ? cashValue === 0
            ? `Full credit: ${sale.total_amount.toLocaleString()} MMK owed by ${selectedCustomer?.name}.`
            : `Split payment: ${(
                sale.total_amount - cashValue
              ).toLocaleString()} MMK remains owed by ${selectedCustomer?.name}.`
          : `Change: ${sale.change_amount.toLocaleString()} MMK`,
        [{ text: "Done", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert(
        "Could not complete sale",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.topline}>
            <View>
              <Text style={styles.eyebrow}>CURRENT SALE</Text>
              <Text style={styles.heading}>Checkout</Text>
            </View>
            <Text style={styles.itemCount}>{items.length} items</Text>
          </View>
          {!items.length ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="cart-outline"
                size={52}
                color="#d7e0dc"
              />
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptyText}>
                Add products from inventory or scan a barcode.
              </Text>
              <Pressable
                style={styles.browse}
                onPress={() => navigation.goBack()}>
                <Text style={styles.browseText}>Browse products</Text>
              </Pressable>
            </View>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={addItem}
                onDecrease={decreaseItem}
                onRemove={removeItem}
                onUpdateQuantity={setQuantity}
              />
            ))
          )}
        </ScrollView>

        {items.length > 0 && (
          <View style={styles.footer}>
            {/* Subtotal (မူလစုစုပေါင်း) */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.subtotalText}>
                {subtotal.toLocaleString()} MMK
              </Text>
            </View>

            {/* Discount Input Field */}
            <Text style={styles.cashLabel}>Discount (MMK)</Text>
            <TextInput
              value={discount}
              onChangeText={setDiscount}
              style={styles.cashInput}
              keyboardType="decimal-pad"
              placeholder="Enter discount amount"
              placeholderTextColor="#9aaa9f"
            />

            <Text style={styles.cashLabel}>Sale note (optional)</Text>
            <TextInput
              value={saleNote}
              onChangeText={setSaleNote}
              style={[styles.cashInput, styles.noteInput]}
              multiline
              numberOfLines={2}
              placeholder="e.g. Broken product - discount applied"
              placeholderTextColor="#9aaa9f"
            />

            {/* Net Total (Discount နှုတ်ပြီး နောက်ဆုံးကျသင့်ငွေ) */}
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={styles.totalLabel}>Net Total</Text>
              <Text style={styles.total}>{netTotal.toLocaleString()} MMK</Text>
            </View>

            {/* Cash Received Input */}
            <View style={styles.paymentToggle}>
              {(["CASH", "CREDIT"] as const).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.paymentOption,
                    paymentType === type && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentType(type)}>
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentType === type && styles.paymentOptionTextActive,
                    ]}>
                    {type === "CASH" ? "Cash" : "Credit"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {paymentType === "CASH" ? (
              <>
                <Text style={styles.cashLabel}>Cash received</Text>
                <TextInput
                  value={cash}
                  onChangeText={setCash}
                  style={styles.cashInput}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor="#9aaa9f"
                />
              </>
            ) : (
              <>
                <Text style={styles.cashLabel}>
                  Paid now (0 for full credit)
                </Text>
                <TextInput
                  value={cash}
                  onChangeText={setCash}
                  style={styles.cashInput}
                  keyboardType="decimal-pad"
                  placeholder="0 for full credit"
                  placeholderTextColor="#9aaa9f"
                />
                <View style={styles.creditSummary}>
                  <Text style={styles.creditSummaryLabel}>
                    {cashValue === 0 ? "Full credit" : "Split payment"}
                  </Text>
                  <Text style={styles.creditSummaryValue}>
                    Due: {Math.max(0, netTotal - cashValue).toLocaleString()}{" "}
                    MMK
                  </Text>
                </View>
                <Pressable
                  style={styles.customerPicker}
                  onPress={() => {
                    void loadCustomers();
                    setShowCustomers(true);
                  }}>
                  <Text style={styles.customerPickerText}>
                    {selectedCustomer?.name ?? "Select customer"}
                  </Text>
                  <MaterialCommunityIcons
                    name="account-search-outline"
                    size={20}
                    color="#60736a"
                  />
                </Pressable>
                <Text style={styles.cashLabel}>Debt note (optional)</Text>
                <TextInput
                  value={debtNote}
                  onChangeText={setDebtNote}
                  style={[styles.cashInput, styles.noteInput]}
                  multiline
                  numberOfLines={2}
                  placeholder="e.g. Customer will pay next Friday"
                  placeholderTextColor="#9aaa9f"
                />
              </>
            )}

            {paymentType === "CASH" && (
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Change due</Text>
                <Text style={styles.change}>{change.toLocaleString()} MMK</Text>
              </View>
            )}

            {/* Checkout Button */}
            <Pressable
              style={[
                styles.pay,
                (checkingOut ||
                  (paymentType === "CASH"
                    ? cashValue < netTotal
                    : !selectedCustomerId ||
                      cashValue < 0 ||
                      cashValue > netTotal)) &&
                  styles.disabled,
              ]}
              onPress={checkout}
              disabled={
                checkingOut ||
                (paymentType === "CASH"
                  ? cashValue < netTotal
                  : !selectedCustomerId ||
                    cashValue < 0 ||
                    cashValue > netTotal)
              }>
              <Text style={styles.payText}>
                {checkingOut
                  ? "Processing..."
                  : `Complete sale  ${netTotal.toLocaleString()} MMK`}
              </Text>
            </Pressable>
          </View>
        )}

        <Modal
          visible={showCustomers}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCustomers(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select customer</Text>
              <ScrollView style={styles.customerList}>
                {customers.map((customer) => (
                  <Pressable
                    key={customer.id}
                    style={styles.customerRow}
                    onPress={() => {
                      setSelectedCustomerId(customer.id!);
                      setShowCustomers(false);
                    }}>
                    <View>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      <Text style={styles.customerDebt}>
                        {customer.total_debt.toLocaleString()} MMK owed
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={styles.newCustomerButton}
                onPress={() => {
                  setShowCustomers(false);
                  setShowNewCustomer(true);
                }}>
                <Text style={styles.newCustomerText}>+ Add customer</Text>
              </Pressable>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowCustomers(false)}>
                <Text style={styles.closeButtonText}>Cancel</Text>
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
                style={styles.cashInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Name"
                placeholderTextColor="#9aaa9f"
              />
              <TextInput
                style={styles.cashInput}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Phone (optional)"
                placeholderTextColor="#9aaa9f"
                keyboardType="phone-pad"
              />
              <Pressable
                style={styles.newCustomerButton}
                onPress={async () => {
                  try {
                    const id = await createCustomer(
                      customerName,
                      customerPhone,
                    );
                    setSelectedCustomerId(id);
                    setCustomerName("");
                    setCustomerPhone("");
                    setShowNewCustomer(false);
                    await loadCustomers();
                  } catch (error) {
                    Alert.alert(
                      "Could not add customer",
                      error instanceof Error
                        ? error.message
                        : "Please try again.",
                    );
                  }
                }}>
                <Text style={styles.newCustomerText}>Save customer</Text>
              </Pressable>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowNewCustomer(false)}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f3" },
  content: { padding: 20, paddingBottom: 20 },
  topline: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#e77945",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#173f35", fontSize: 30, fontWeight: "800", marginTop: 4 },
  itemCount: { color: "#71837a", fontWeight: "700", paddingBottom: 3 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: {
    color: "#173f35",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: { color: "#71837a", marginTop: 6, textAlign: "center" },
  browse: {
    backgroundColor: "#173f35",
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderRadius: 8,
    marginTop: 20,
  },
  browseText: { color: "#fff", fontWeight: "800" },
  footer: {
    backgroundColor: "#fff",
    borderTopColor: "#dce6e0",
    borderTopWidth: 1,
    padding: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { color: "#60736a", fontSize: 15, fontWeight: "700" },
  subtotalText: { color: "#60736a", fontSize: 16, fontWeight: "800" },
  total: { color: "#173f35", fontSize: 22, fontWeight: "900" },
  cashLabel: {
    color: "#436157",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cashInput: {
    backgroundColor: "#f5f7f3",
    borderColor: "#dce6e0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#173f35",
    fontSize: 15,
  },
  noteInput: {
    minHeight: 54,
    textAlignVertical: "top",
  },
  changeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  changeLabel: { color: "#71837a", fontSize: 16, fontWeight: "700" },
  change: { color: "#e77945", fontSize: 18, fontWeight: "800" },
  pay: {
    backgroundColor: "#e77945",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.45 },
  payText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  paymentToggle: {
    flexDirection: "row",
    backgroundColor: "#eef4f1",
    borderRadius: 8,
    padding: 3,
    marginTop: 10,
  },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 6,
  },
  paymentOptionActive: { backgroundColor: "#173f35" },
  paymentOptionText: { color: "#60736a", fontWeight: "800" },
  paymentOptionTextActive: { color: "#fff" },
  customerPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f7f3",
    borderColor: "#dce6e0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  customerPickerText: { color: "#173f35", fontSize: 15, fontWeight: "700" },
  creditSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eef4f1",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  creditSummaryLabel: { color: "#60736a", fontSize: 12, fontWeight: "800" },
  creditSummaryValue: { color: "#bd6337", fontSize: 13, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(23, 63, 53, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#173f35",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  customerList: { maxHeight: 260 },
  customerRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef4f1",
  },
  customerName: { color: "#173f35", fontSize: 15, fontWeight: "800" },
  customerDebt: { color: "#71837a", fontSize: 12, marginTop: 3 },
  newCustomerButton: {
    backgroundColor: "#e77945",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 14,
  },
  newCustomerText: { color: "#fff", fontWeight: "800" },
  closeButton: { alignItems: "center", padding: 12, marginTop: 4 },
  closeButtonText: { color: "#60736a", fontWeight: "800" },
});
