import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { addProductBatch, getProducts } from "../database/productRepository";
import { Product } from "../types";
import { useDebounce } from "../hooks/useDebounce";
import { formatMoney } from "../utils/formatters";
import { t } from "../i18n";
import { getResponsiveContentStyle } from "../utils/responsive";

type Props = NativeStackScreenProps<RootStackParamList, "Restock">;

export default function RestockScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(true);
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

  const parsedQuantityValue = Number(quantity.replace(/[^0-9.]/g, "")) || 0;
  const parsedCostValue = Number(costPrice.replace(/[^0-9.]/g, "")) || 0;
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          getResponsiveContentStyle(width, 760),
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="package-down"
              size={25}
              color="#21664e"
            />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{t("inventoryManagement")}</Text>
            <Text style={styles.title}>{t("restockTitle")}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{t("restockSubtitle")}</Text>

        <View style={styles.sectionHeading}>
          <Text style={styles.stepNumber}>01</Text>
          <Text style={styles.sectionTitle}>{t("selectProductToRestock")}</Text>
        </View>

        {selectedProduct && !isProductPickerOpen ? (
          <Pressable
            style={styles.selectedProduct}
            onPress={() => setIsProductPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t("selectProductToRestock")}>
            <View style={styles.productIcon}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={21}
                color="#21664e"
              />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {selectedProduct.name}
              </Text>
              <Text style={styles.productMeta}>
                {selectedProduct.stock_qty}{" "}
                {selectedProduct.is_base_unit
                  ? selectedProduct.selling_unit
                  : t("package")}{" "}
                {t("inStock")}
              </Text>
            </View>
            <View style={styles.selectedBadge}>
              <MaterialCommunityIcons name="check" size={15} color="#21664e" />
              <Text style={styles.selectedText}>{t("selected")}</Text>
            </View>
          </Pressable>
        ) : (
          <>
            <View style={styles.searchBox}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#73877c"
              />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={t("searchNameBarcode")}
                placeholderTextColor="#8a9b95"
                returnKeyType="search"
              />
            </View>

            {products.length > 0 ? (
              <View style={styles.productList}>
                {products.map((product) => {
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <Pressable
                      key={product.id}
                      style={[
                        styles.productRow,
                        isSelected && styles.selectedRow,
                      ]}
                      onPress={() => {
                        setSelectedProduct(product);
                        setIsProductPickerOpen(false);
                      }}>
                      <View style={styles.productIcon}>
                        <MaterialCommunityIcons
                          name="package-variant-closed"
                          size={20}
                          color={isSelected ? "#21664e" : "#8a7658"}
                        />
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.productMeta}>
                          {product.stock_qty}{" "}
                          {product.is_base_unit
                            ? product.selling_unit
                            : t("package")}{" "}
                          {t("inStock")}
                        </Text>
                        {!product.is_base_unit ? (
                          <Text style={styles.packageMeta}>
                            {t("packageBaseUnits", {
                              count: product.conversion_rate,
                            })}
                          </Text>
                        ) : null}
                      </View>
                      <MaterialCommunityIcons
                        name={isSelected ? "check-circle" : "chevron-right"}
                        size={21}
                        color={isSelected ? "#21664e" : "#a2afa5"}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyProducts}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={28}
                  color="#a2afa5"
                />
                <Text style={styles.emptyProductsText}>{t("noProducts")}</Text>
              </View>
            )}
          </>
        )}

        {selectedProduct && (
          <View style={styles.formSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.stepNumber}>02</Text>
              <Text style={styles.sectionTitle}>{t("pricingStock")}</Text>
            </View>

            <View
              style={[styles.inputGrid, isCompact && styles.inputGridCompact]}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("restockQuantity")}</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#8a9b95"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("batchTotalCost")}</Text>
                <TextInput
                  style={styles.input}
                  value={costPrice}
                  onChangeText={setCostPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#8a9b95"
                />
              </View>
            </View>

            {parsedQuantityValue > 0 && parsedCostValue > 0 ? (
              <View style={styles.unitCostSummary}>
                <MaterialCommunityIcons
                  name="calculator-variant-outline"
                  size={18}
                  color="#21664e"
                />
                <Text style={styles.unitCostLabel}>{t("unitCostPrice")}</Text>
                <Text style={styles.unitCostValue}>
                  {formatMoney(unitCostPrice)}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("batchNumberOptional")}</Text>
              <TextInput
                style={styles.input}
                value={batchNumber}
                onChangeText={setBatchNumber}
                placeholder={t("batchNumberPlaceholder")}
                placeholderTextColor="#8a9b95"
                autoCapitalize="characters"
              />
            </View>

            <Pressable
              style={[styles.saveButton, saving && styles.disabled]}
              onPress={saveBatch}
              disabled={saving}
              accessibilityRole="button">
              <MaterialCommunityIcons
                name={saving ? "loading" : "check-circle-outline"}
                size={20}
                color="#fff"
              />
              <Text style={styles.saveText}>
                {saving ? t("saving") : t("saveRestock")}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f8f4" },
  content: { paddingVertical: 20, paddingBottom: 36 },
  header: { flexDirection: "row", alignItems: "center", gap: 13 },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#e3efe6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#b86c24", fontSize: 11, fontWeight: "800" },
  title: { color: "#203b30", fontSize: 26, fontWeight: "900", marginTop: 3 },
  subtitle: {
    color: "#68786e",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 25,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  stepNumber: {
    color: "#21664e",
    fontSize: 11,
    fontWeight: "900",
    backgroundColor: "#e3efe6",
    overflow: "hidden",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  sectionTitle: { color: "#203b30", fontSize: 14, fontWeight: "900", flex: 1 },
  searchBox: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce6dd",
    borderRadius: 12,
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 12, color: "#203b30" },
  productList: { marginTop: 10, gap: 8 },
  productRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e8e1",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  selectedRow: { borderColor: "#6d9b7c", backgroundColor: "#edf5ee" },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f0f4ef",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1, minWidth: 0 },
  productName: { color: "#203b30", fontSize: 14, fontWeight: "800" },
  productMeta: { color: "#75847a", fontSize: 11, marginTop: 3 },
  packageMeta: {
    color: "#a96222",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  selectedProduct: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderWidth: 1,
    borderColor: "#8bb19a",
    borderRadius: 12,
    backgroundColor: "#edf5ee",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dcecdf",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  selectedText: { color: "#21664e", fontSize: 10, fontWeight: "900" },
  emptyProducts: { alignItems: "center", paddingVertical: 26, gap: 8 },
  emptyProductsText: { color: "#75847a", fontWeight: "700" },
  formSection: {
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#dce6dd",
  },
  inputGrid: { flexDirection: "row", gap: 12 },
  inputGridCompact: { flexDirection: "column", gap: 0 },
  inputGroup: { flex: 1, minWidth: 0, marginBottom: 14 },
  label: {
    color: "#65766b",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce6dd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#203b30",
  },
  unitCostSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e7f1e8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: -2,
    marginBottom: 15,
  },
  unitCostLabel: { color: "#456b55", fontSize: 12, fontWeight: "700", flex: 1 },
  unitCostValue: { color: "#21664e", fontSize: 14, fontWeight: "900" },
  saveButton: {
    minHeight: 54,
    backgroundColor: "#21664e",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
    marginTop: 7,
  },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
