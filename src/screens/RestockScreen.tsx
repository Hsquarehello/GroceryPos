import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import {
  addProductBatch,
  getProducts,
} from "../database/productRepository";
import { Product } from "../types";
import { useDebounce } from "../hooks/useDebounce";
import { formatMoney } from "../utils/formatters";
import { t } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Restock">;

export default function RestockScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const loadProducts = useCallback(async () => {
    setProducts(await getProducts(debouncedSearch));
  }, [debouncedSearch]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const parsedQuantityValue =
    Number(quantity.replace(/[^0-9.]/g, "")) || 0;
  const parsedCostValue =
    Number(costPrice.replace(/[^0-9.]/g, "")) || 0;
  const unitCostPrice =
    parsedQuantityValue > 0 ? parsedCostValue / parsedQuantityValue : 0;

  const saveBatch = async () => {
    if (!selectedProduct) {
      Alert.alert(t("missingDetail"), t("selectProductToRestock"));
      return;
    }
    const parsedQuantity = Number(quantity.replace(/[^0-9.]/g, ""));
    const parsedCost = Number(costPrice.replace(/[^0-9.]/g, ""));
    if (parsedQuantity <= 0 || parsedCost <= 0) {
      Alert.alert(t("invalidRestock"), t("restockValuesRequired"));
      return;
    }

    setSaving(true);
    try {
      await addProductBatch(
        selectedProduct.id!,
        parsedQuantity,
        parsedCost / parsedQuantity,
        batchNumber,
      );
      Alert.alert(t("restockComplete"), t("restockCompleteMessage"));
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t("error"),
        error instanceof Error ? error.message : t("failedRestock"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="height">
      {/* Scrollable product list */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>{t("inventoryManagement")}</Text>
        <Text style={styles.title}>{t("restockTitle")}</Text>
        <Text style={styles.subtitle}>{t("restockSubtitle")}</Text>

        <Text style={styles.sectionTitle}>{t("selectProductToRestock")}</Text>
        {products.map((product) => (
          <Pressable
            key={product.id}
            style={[
              styles.productRow,
              selectedProduct?.id === product.id && styles.selectedRow,
            ]}
            onPress={() => setSelectedProduct(product)}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>
                {product.stock_qty}{" "}
                {product.is_base_unit
                  ? product.selling_unit
                  : t("package")}{" "}
                {t("inStock")}
              </Text>
              {!product.is_base_unit ? (
                <Text style={styles.packageMeta}>
                  {t("packageBaseUnits", { count: product.conversion_rate })}
                </Text>
              ) : null}
            </View>
            {selectedProduct?.id === product.id ? (
              <Text style={styles.selectedText}>{t("selected")}</Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>

      {/* Fixed form */}
      <View style={styles.formPanel}>
        <Text style={styles.label}>{t("searchNameBarcode")}</Text>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder={t("searchNameBarcode")}
          placeholderTextColor="#8a9b95"
        />

        <Text style={styles.label}>{t("restockQuantity")}</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#8a9b95"
        />
        <Text style={styles.label}>{t("batchTotalCost")}</Text>
        <TextInput
          style={styles.input}
          value={costPrice}
          onChangeText={setCostPrice}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#8a9b95"
        />
        {parsedQuantityValue > 0 && parsedCostValue > 0 ? (
          <Text style={styles.unitCostText}>
            {t("unitCostPrice")}: {formatMoney(unitCostPrice)}
          </Text>
        ) : null}
        <Text style={styles.label}>{t("batchNumberOptional")}</Text>
        <TextInput
          style={styles.input}
          value={batchNumber}
          onChangeText={setBatchNumber}
          placeholder={t("batchNumberPlaceholder")}
          placeholderTextColor="#8a9b95"
        />

        <Pressable
          style={[styles.saveButton, saving && styles.disabled]}
          onPress={saveBatch}
          disabled={saving}>
          <Text style={styles.saveText}>
            {saving ? t("saving") : t("saveRestock")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0" },
  listArea: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 20 },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: { color: "#3a2818", fontSize: 28, fontWeight: "800", marginTop: 4 },
  subtitle: {
    color: "#71837a",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#3a2818",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },
  productRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 10,
    padding: 13,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedRow: { borderColor: "#f36f0a", backgroundColor: "#fff5df" },
  productInfo: { flex: 1 },
  productName: { color: "#3a2818", fontSize: 14, fontWeight: "800" },
  productMeta: { color: "#8a9b95", fontSize: 11, marginTop: 3 },
  packageMeta: {
    color: "#f36f0a",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  selectedText: { color: "#f36f0a", fontSize: 11, fontWeight: "900" },
  formPanel: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0dfb6",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    elevation: 5,
    shadowColor: "#6b481d",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
  },
  label: {
    color: "#7a6a52",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 9,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#3a2818",
  },
  unitCostText: {
    color: "#2f7d62",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 16,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.6 },
});