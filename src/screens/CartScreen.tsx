import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../../App";
import { completeSale, getCustomers } from "../database";
import { useCartStore } from "../store/useCartStore";
import CartItem from "../components/cart/CartItem";
import { Customer } from "../types";

import CartSummaryFooter from "../components/layout/CartSummaryFooter";
import MoreOptionsModal from "../components/modals/MoreOptionsModal";
import CustomerSelectModal from "../components/modals/CustomerSelectModal";
import AddCustomerModal from "../components/modals/AddCustomerModal";

type Props = NativeStackScreenProps<RootStackParamList, "Cart">;

export default function CartScreen({ navigation }: Props) {
  const { items, addItem, decreaseItem, removeItem, clear, setQuantity } =
    useCartStore();
  const [cash, setCash] = useState("");
  const [discount, setDiscount] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [draftDiscount, setDraftDiscount] = useState("");
  const [draftSaleNote, setDraftSaleNote] = useState("");
  const [debtNote, setDebtNote] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [showCustomers, setShowCustomers] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const loadCustomers = async () => setCustomers(await getCustomers());

  // 1. Subtotal တွက်ချက်ခြင်း
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.selling_price * item.quantity, 0),
    [items],
  );

  // 2. Discount နှင့် Net Total တွက်ချက်ခြင်း
  const discountValue = Number(discount) || 0;
  const netTotal = Math.max(0, subtotal - discountValue);

  // 3. Change (ပြန်အမ်းငွေ) တွက်ချက်ခြင်း
  const cashValue = Number(cash) || 0;
  const change = Math.max(0, cashValue - netTotal);

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  const filteredCustomers = customers.filter((customer) =>
    customer.name
      .toLocaleLowerCase()
      .includes(customerSearch.trim().toLocaleLowerCase()),
  );

  const openMoreOptions = () => {
    setDraftDiscount(discount);
    setDraftSaleNote(saleNote);
    setShowMoreOptions(true);
  };

  const applyMoreOptions = () => {
    setDiscount(draftDiscount);
    setSaleNote(draftSaleNote);
    setShowMoreOptions(false);
  };

  const handleOpenCustomerPicker = () => {
    setCustomerSearch("");
    void loadCustomers();
    setShowCustomers(true);
  };

  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setShowCustomers(false);
  };

  const handleCustomerAdded = async (newCustomerId: number) => {
    setSelectedCustomerId(newCustomerId);
    setShowNewCustomer(false);
    await loadCustomers();
  };

  const checkout = async () => {
    if (!items.length) return;
    setCheckingOut(true);
    try {
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
          <CartSummaryFooter
            subtotal={subtotal}
            netTotal={netTotal}
            discount={discount}
            saleNote={saleNote}
            cash={cash}
            cashValue={cashValue}
            change={change}
            paymentType={paymentType}
            selectedCustomer={selectedCustomer}
            selectedCustomerId={selectedCustomerId}
            debtNote={debtNote}
            checkingOut={checkingOut}
            setCash={setCash}
            setDebtNote={setDebtNote}
            setPaymentType={setPaymentType}
            onOpenMoreOptions={openMoreOptions}
            onOpenCustomerPicker={handleOpenCustomerPicker}
            onCheckout={checkout}
          />
        )}

        <MoreOptionsModal
          visible={showMoreOptions}
          draftDiscount={draftDiscount}
          draftSaleNote={draftSaleNote}
          setDraftDiscount={setDraftDiscount}
          setDraftSaleNote={setDraftSaleNote}
          onClose={() => setShowMoreOptions(false)}
          onApply={applyMoreOptions}
        />

        <CustomerSelectModal
          visible={showCustomers}
          customers={filteredCustomers}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          onSelectCustomer={handleSelectCustomer}
          onOpenNewCustomer={() => {
            setShowCustomers(false);
            setShowNewCustomer(true);
          }}
          onClose={() => setShowCustomers(false)}
        />

        <AddCustomerModal
          visible={showNewCustomer}
          customerName={customerName}
          customerPhone={customerPhone}
          setCustomerName={setCustomerName}
          setCustomerPhone={setCustomerPhone}
          onSuccess={handleCustomerAdded}
          onClose={() => setShowNewCustomer(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 20, paddingBottom: 20 },
  topline: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#3a2818", fontSize: 30, fontWeight: "800", marginTop: 4 },
  itemCount: { color: "#71837a", fontWeight: "700", paddingBottom: 3 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: {
    color: "#3a2818",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: { color: "#71837a", marginTop: 6, textAlign: "center" },
  browse: {
    backgroundColor: "#3a2818",
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderRadius: 8,
    marginTop: 20,
  },
  browseText: { color: "#fff", fontWeight: "800" },
});
