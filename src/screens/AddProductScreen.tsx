import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
  addStockFromPackage,
  createProduct,
  getBaseProducts,
  getProductById,
  ProductInput,
  updatePackageStock,
  updateProduct,
} from "../database/productRepository";
import { Product } from "../types";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "AddProduct" | "EditProduct"
>;

const blankForm: ProductInput = {
  barcode: null,
  name: "",
  selling_unit: "unit",
  cost_price: 0,
  selling_price: 0,
  stock_qty: 0,
  parent_id: null,
  conversion_rate: 1,
  is_base_unit: true,
};

export default function AddProductScreen({ navigation, route }: Props) {
  const editing = route.name === "EditProduct";
  const params = route.params as
    | { productId?: number; barcode?: string }
    | undefined;

  const productId = editing ? params?.productId : undefined;
  const initialBarcode = params?.barcode;

  const [form, setForm] = useState<ProductInput>({
    ...blankForm,
    barcode: initialBarcode ?? "",
  });

  const [initialPackageQty, setInitialPackageQty] = useState<number>(0);
  const [targetPackageQty, setTargetPackageQty] = useState<number>(0);
  const [baseProducts, setBaseProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Scanner မှ Barcode ပါလာပါက Form ထဲသို့ Auto ထည့်ပေးခြင်း
  useEffect(() => {
    if (initialBarcode !== undefined) {
      setForm((prev) => ({ ...prev, barcode: initialBarcode }));
    }
  }, [initialBarcode]);

  // Edit Mode အတွက် Product Data ဆွဲယူခြင်း
  useEffect(() => {
    if (productId !== undefined) {
      void getProductById(productId).then((prod) => {
        if (prod) {
          setForm({
            barcode: prod.barcode ?? "",
            name: prod.name,
            selling_unit: prod.selling_unit,
            cost_price: prod.cost_price,
            selling_price: prod.selling_price,
            stock_qty: prod.stock_qty,
            parent_id: prod.parent_id,
            conversion_rate: prod.conversion_rate,
            is_base_unit: prod.is_base_unit,
          });
        }
      });
    }
  }, [productId]);

  // Base Products စာရင်း ရယူခြင်း
  useEffect(() => {
    void getBaseProducts().then(setBaseProducts);
  }, [editing]);

  const updateField = (key: keyof ProductInput, value: string) => {
    setForm((current) => ({
      ...current,
      [key]:
        key === "name" || key === "barcode" || key === "selling_unit"
          ? value
          : Number(value.replace(/[^0-9.]/g, "")) || 0,
    }));
  };

  // Select လုပ်ထားသော Base Product ၏ Package Stock ကို တွက်ချက်ခြင်း
  const selectedParent = baseProducts.find((p) => p.id === form.parent_id);
  const parentBaseStock = selectedParent
    ? (selectedParent.base_stock_qty ?? selectedParent.stock_qty)
    : 0;

  const calculatedPackageStock =
    selectedParent && form.conversion_rate > 0
      ? Math.floor(parentBaseStock / form.conversion_rate)
      : 0;

  // Edit Mode တွင် Package Stock Initial Value ကို Synchronize လုပ်ပေးခြင်း
  useEffect(() => {
    if (editing && !form.is_base_unit && selectedParent) {
      setTargetPackageQty(calculatedPackageStock);
    }
  }, [editing, form.is_base_unit, selectedParent, calculatedPackageStock]);

  const saveProductHandler = async () => {
    if (!form.name.trim()) {
      Alert.alert("Missing Detail", "Please enter product name.");
      return;
    }
    if (form.selling_price <= 0) {
      Alert.alert("Invalid Price", "Selling price must be greater than zero.");
      return;
    }
    if (!form.is_base_unit) {
      if (!form.parent_id) {
        Alert.alert(
          "Missing Base Product",
          "Please select a base product for this package.",
        );
        return;
      }
      if (form.conversion_rate <= 1) {
        Alert.alert(
          "Invalid Conversion Rate",
          "Base units per package must be greater than 1.",
        );
        return;
      }
    }

    setSaving(true);
    try {
      if (editing && productId !== undefined) {
        // 1. Product Form Details ကို Update လုပ်မည်
        await updateProduct(productId, form);

        // 2. Package Product ကို Edit လုပ်သည့်အခါ Package Qty ပြောင်းလဲသွားပါက Base Stock ကို ပြန်တွက်မည်
        if (!form.is_base_unit && targetPackageQty !== calculatedPackageStock) {
          await updatePackageStock(form, targetPackageQty);
        }
      } else {
        const newId = await createProduct(form);
        // Package Product ဖြစ်ပြီး Initial Pack Qty ထည့်ထားပါက Base Stock သို့ တိုက်ရိုက် ပေါင်းမည်
        if (!form.is_base_unit && initialPackageQty > 0) {
          await addStockFromPackage(newId, initialPackageQty);
        }
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save product.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>INVENTORY MANAGEMENT</Text>
          <Text style={styles.headerTitle}>
            {editing ? "Edit Product" : "Add New Product"}
          </Text>
        </View>

        {/* 1. Basic Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Details</Text>

          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(val) => updateField("name", val)}
            placeholder="e.g. Coca-Cola 330ml Can"
            placeholderTextColor="#8a9b95"
          />

          <Text style={styles.label}>Barcode</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.barcode ?? ""}
              onChangeText={(val) => updateField("barcode", val)}
              placeholder="Scan or type barcode"
              placeholderTextColor="#8a9b95"
              keyboardType="number-pad"
            />
            {!editing && (
              <Pressable
                style={styles.scanBtn}
                onPress={() =>
                  navigation.navigate("Scanner", { mode: "product" })
                }>
                <MaterialCommunityIcons
                  name="barcode-scan"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.scanBtnText}>Scan</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* 2. Unit Type Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Unit & Packaging Config</Text>
          <Text style={styles.label}>Select Product Unit Type</Text>

          <View style={styles.segmentContainer}>
            {(["unit", "kg", "g"] as const).map((unit) => (
              <Pressable
                key={unit}
                style={[
                  styles.segmentBtn,
                  form.selling_unit === unit && styles.segmentActive,
                ]}
                onPress={() =>
                  setForm((prev) => ({ ...prev, selling_unit: unit }))
                }>
                <Text
                  style={[
                    styles.segmentText,
                    form.selling_unit === unit && styles.segmentActiveText,
                  ]}>
                  {unit === "unit" ? "By unit" : `By ${unit}`}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.infoSubtext}>
            Weighted products use price and stock in the selected unit. Barcode
            is optional.
          </Text>

          <View style={styles.segmentContainer}>
            <Pressable
              style={[
                styles.segmentBtn,
                form.is_base_unit && styles.segmentActive,
              ]}
              onPress={() =>
                setForm((prev) => ({
                  ...prev,
                  is_base_unit: true,
                  parent_id: null,
                  conversion_rate: 1,
                }))
              }>
              <Text
                style={[
                  styles.segmentText,
                  form.is_base_unit && styles.segmentActiveText,
                ]}>
                Single Unit (Base)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentBtn,
                !form.is_base_unit && styles.segmentActive,
              ]}
              onPress={() =>
                setForm((prev) => ({
                  ...prev,
                  is_base_unit: false,
                  selling_unit: "unit",
                }))
              }>
              <Text
                style={[
                  styles.segmentText,
                  !form.is_base_unit && styles.segmentActiveText,
                ]}>
                Package / Box
              </Text>
            </Pressable>
          </View>

          {/* Package Product Configuration */}
          {!form.is_base_unit && (
            <View style={styles.packageBox}>
              <Text style={styles.label}>Base Product Link *</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={() => setShowPicker(true)}>
                <Text style={styles.pickerText}>
                  {selectedParent
                    ? selectedParent.name
                    : "-- Select Base Single Unit --"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color="#60736a"
                />
              </Pressable>

              <Text style={styles.label}>
                Items Inside Package (Conversion Rate) *
              </Text>
              <TextInput
                style={styles.input}
                value={String(form.conversion_rate || "")}
                onChangeText={(val) => updateField("conversion_rate", val)}
                keyboardType="number-pad"
                placeholder="e.g. 24 cans per box"
                placeholderTextColor="#8a9b95"
              />
            </View>
          )}
        </View>

        {/* 3. Pricing & Stock */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing & Stock</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Cost Price</Text>
              <TextInput
                style={styles.input}
                value={String(form.cost_price || "")}
                onChangeText={(val) => updateField("cost_price", val)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#8a9b95"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Selling Price *</Text>
              <TextInput
                style={styles.input}
                value={String(form.selling_price || "")}
                onChangeText={(val) => updateField("selling_price", val)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#8a9b95"
              />
            </View>
          </View>

          {/* Stock Input Handling */}
          {form.is_base_unit ? (
            <>
              <Text style={styles.label}>Available Base Stock Qty</Text>
              <TextInput
                style={styles.input}
                value={String(form.stock_qty || "")}
                onChangeText={(val) => updateField("stock_qty", val)}
                keyboardType={
                  form.selling_unit === "unit" ? "number-pad" : "decimal-pad"
                }
                placeholder="0"
                placeholderTextColor="#8a9b95"
              />
            </>
          ) : editing ? (
            <View style={styles.packageStockBox}>
              <Text style={styles.label}>Available Package Stock Qty</Text>
              <TextInput
                style={styles.input}
                value={String(targetPackageQty)}
                onChangeText={(val) =>
                  setTargetPackageQty(Number(val.replace(/[^0-9]/g, "")) || 0)
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#8a9b95"
              />
              <Text style={styles.infoSubtext}>
                * Updating package count will recalculate Base Product (
                {selectedParent?.name ?? "Base Unit"}) stock.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Initial Packages To Add To Stock</Text>
              <TextInput
                style={styles.input}
                value={String(initialPackageQty || "")}
                onChangeText={(val) =>
                  setInitialPackageQty(Number(val.replace(/[^0-9]/g, "")) || 0)
                }
                keyboardType="number-pad"
                placeholder="0 (Enter box count)"
                placeholderTextColor="#8a9b95"
              />
            </>
          )}
        </View>

        {/* Action Buttons */}
        <Pressable
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={saveProductHandler}
          disabled={saving}>
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : editing ? "Update Product" : "Save Product"}
          </Text>
        </Pressable>

        {/* Parent Product Picker Modal */}
        <Modal visible={showPicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Base Unit Product</Text>
              <ScrollView style={{ maxHeight: 280 }}>
                {baseProducts
                  .filter((p) => p.id !== productId)
                  .map((p) => (
                    <Pressable
                      key={p.id}
                      style={styles.modalItem}
                      onPress={() => {
                        setForm((prev) => ({ ...prev, parent_id: p.id! }));
                        setShowPicker(false);
                      }}>
                      <Text style={styles.modalItemText}>{p.name}</Text>
                      <Text style={styles.modalItemSub}>
                        Stock: {p.stock_qty}
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>
              <Pressable
                style={styles.closeBtn}
                onPress={() => setShowPicker(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f3" },
  content: { padding: 20, paddingBottom: 120 }, // Android အတွက် Padding တိုးပေးထားသည်
  header: { marginBottom: 20 },
  eyebrow: {
    color: "#e77945",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: "#173f35",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dce6e0",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#173f35",
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#60736a",
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce6e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#173f35",
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  scanBtn: {
    backgroundColor: "#173f35",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  scanBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f4f1",
    borderRadius: 8,
    padding: 4,
    marginTop: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentActive: { backgroundColor: "#173f35" },
  segmentText: { color: "#60736a", fontWeight: "700", fontSize: 13 },
  segmentActiveText: { color: "#ffffff" },
  packageBox: { marginTop: 6 },
  pickerTrigger: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce6e0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: { fontSize: 15, color: "#173f35" },
  packageStockBox: { marginTop: 4 },
  infoSubtext: { fontSize: 11, color: "#8a9b95", marginTop: 6 },
  saveBtn: {
    backgroundColor: "#e77945",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#ffffff", fontWeight: "800", fontSize: 16 },
  disabledBtn: { opacity: 0.6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(23, 63, 53, 0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#173f35",
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eef2ef",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemText: { fontSize: 15, fontWeight: "700", color: "#173f35" },
  modalItemSub: { fontSize: 12, color: "#8a9b95" },
  closeBtn: { marginTop: 16, alignItems: "center" },
  closeText: { color: "#bd6337", fontWeight: "800" },
});
