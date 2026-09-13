import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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

// Components
import { ProductBasicInfoForm } from "../components/forms/ProductBasicInfoForm";
import {
  ProductUnitConfigForm,
  UnitCategory,
} from "../components/forms/ProductUnitConfigForm";
import { ProductPricingStockForm } from "../components/forms/ProductPricingStockForm";
import {
  SelectedUnit,
  WeightUnitPickerModal,
} from "../components/modals/WeightUnitPickerModal";
import { BaseProductPickerModal } from "../components/modals/BaseProductPickerModal";
import { t } from "../i18n";

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
    { productId?: number; barcode?: string } | undefined;

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
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [unitCategory, setUnitCategory] = useState<UnitCategory>("unit");
  const [selectedUnit, setSelectedUnit] = useState<SelectedUnit>("pcs");

  // Barcode Auto-fill
  useEffect(() => {
    if (initialBarcode !== undefined) {
      setForm((prev) => ({ ...prev, barcode: initialBarcode }));
    }
  }, [initialBarcode]);

  // Edit Mode: Fetch Product
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
          const loadedUnit: SelectedUnit =
            prod.selling_unit === "unit"
              ? "pcs"
              : (prod.selling_unit as SelectedUnit);
          setSelectedUnit(loadedUnit);
          setUnitCategory(loadedUnit === "pcs" ? "unit" : "weight");
        }
      });
    }
  }, [productId]);

  // Fetch Base Products
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

  const updateSelectedUnit = (nextUnit: SelectedUnit) => {
    setSelectedUnit(nextUnit);
    setUnitCategory(nextUnit === "pcs" ? "unit" : "weight");
    setForm((current) => ({
      ...current,
      selling_unit: nextUnit === "pcs" ? "unit" : nextUnit,
    }));
  };

  const selectUnitCategory = (nextCategory: UnitCategory) => {
    setUnitCategory(nextCategory);
    if (nextCategory === "unit") {
      updateSelectedUnit("pcs");
    } else if (selectedUnit === "pcs") {
      updateSelectedUnit("kg");
    }
  };

  // Base product details
  const selectedParent = baseProducts.find((p) => p.id === form.parent_id);
  const parentBaseStock = selectedParent
    ? (selectedParent.base_stock_qty ?? selectedParent.stock_qty)
    : 0;

  const calculatedPackageStock =
    selectedParent && form.conversion_rate > 0
      ? Math.floor(parentBaseStock / form.conversion_rate)
      : 0;

  useEffect(() => {
    if (editing && !form.is_base_unit && selectedParent) {
      setTargetPackageQty(calculatedPackageStock);
    }
  }, [editing, form.is_base_unit, selectedParent, calculatedPackageStock]);

  const saveProductHandler = async () => {
    if (!form.name.trim()) {
      Alert.alert(t("missingDetail"), t("enterProductName"));
      return;
    }
    if (form.selling_price <= 0) {
      Alert.alert(t("invalidPrice"), t("priceGreaterZero"));
      return;
    }
    if (!form.is_base_unit) {
      if (!form.parent_id) {
        Alert.alert(t("missingBaseProduct"), t("selectBaseProduct"));
        return;
      }
      if (form.conversion_rate <= 1) {
        Alert.alert(t("invalidConversion"), t("conversionGreaterOne"));
        return;
      }
    }

    setSaving(true);
    try {
      if (editing && productId !== undefined) {
        await updateProduct(productId, form);
        if (!form.is_base_unit && targetPackageQty !== calculatedPackageStock) {
          await updatePackageStock(form, targetPackageQty);
        }
      } else {
        const newId = await createProduct(form);
        if (!form.is_base_unit && initialPackageQty > 0) {
          await addStockFromPackage(newId, initialPackageQty);
        }
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t("error"),
        error instanceof Error ? error.message : t("failedSaveProduct"),
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
          <Text style={styles.eyebrow}>{t("inventoryManagement")}</Text>
          <Text style={styles.headerTitle}>
            {editing ? t("editProduct") : t("addNewProduct")}
          </Text>
        </View>

        {/* 1. Basic Details */}
        <ProductBasicInfoForm
          name={form.name}
          barcode={form.barcode}
          editing={editing}
          onUpdateField={updateField}
          onScanPress={() =>
            navigation.navigate("Scanner", { mode: "product" })
          }
        />

        {/* 2. Unit & Packaging Config */}
        <ProductUnitConfigForm
          unitCategory={unitCategory}
          selectedUnit={selectedUnit}
          isBaseUnit={form.is_base_unit}
          selectedParent={selectedParent}
          conversionRate={form.conversion_rate}
          onSelectUnitCategory={selectUnitCategory}
          onOpenWeightPicker={() => setShowWeightPicker(true)}
          onToggleBaseUnit={(isBase) => {
            if (isBase) {
              setForm((prev) => ({
                ...prev,
                is_base_unit: true,
                parent_id: null,
                conversion_rate: 1,
              }));
            } else {
              setUnitCategory("unit");
              setSelectedUnit("pcs");
              setForm((prev) => ({
                ...prev,
                is_base_unit: false,
                selling_unit: "unit",
              }));
            }
          }}
          onOpenParentPicker={() => setShowPicker(true)}
          onUpdateConversionRate={(val) => updateField("conversion_rate", val)}
        />

        {/* 3. Pricing & Stock */}
        <ProductPricingStockForm
          costPrice={form.cost_price}
          sellingPrice={form.selling_price}
          stockQty={form.stock_qty}
          isBaseUnit={form.is_base_unit}
          sellingUnit={form.selling_unit}
          selectedUnit={selectedUnit}
          editing={editing}
          selectedParent={selectedParent}
          targetPackageQty={targetPackageQty}
          initialPackageQty={initialPackageQty}
          onUpdateField={updateField}
          onTargetPackageQtyChange={setTargetPackageQty}
          onInitialPackageQtyChange={setInitialPackageQty}
        />

        {/* Action Button */}
        <Pressable
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={saveProductHandler}
          disabled={saving}>
          <Text style={styles.saveBtnText}>
            {saving ? t("saving") : editing ? t("update") : t("save")}
          </Text>
        </Pressable>

        {/* Modals */}
        <WeightUnitPickerModal
          visible={showWeightPicker}
          selectedUnit={selectedUnit}
          onSelectUnit={updateSelectedUnit}
          onClose={() => setShowWeightPicker(false)}
        />

        <BaseProductPickerModal
          visible={showPicker}
          baseProducts={baseProducts}
          currentProductId={productId}
          onSelectProduct={(id) =>
            setForm((prev) => ({ ...prev, parent_id: id }))
          }
          onClose={() => setShowPicker(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffaf0" },
  content: { padding: 20, paddingBottom: 120 },
  header: { marginBottom: 20 },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: "#3a2818",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: "#f36f0a",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#ffffff", fontWeight: "800", fontSize: 16 },
  disabledBtn: { opacity: 0.6 },
});
