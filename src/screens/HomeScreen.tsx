import React, { useCallback, useMemo, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { RootStackParamList } from "../../App";
import { deleteProduct, getProducts } from "../database/productRepository";
import { useCartStore } from "../store/useCartStore";
import { Product } from "../types";

import ProductCard from "../components/cards/ProductCard";
import { HomeHeader } from "../components/layout/HomeHeader";
import { ProductEmptyState } from "../components/common/ProductEmptyState";
import { BottomNavBar } from "../components/layout/BottomNavBar";

import { useDebounce } from "../hooks/useDebounce";
import { t } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const addItem = useCartStore((state) => state.addItem);
  const removeItemFromCart = useCartStore((state) => state.removeItem);
  const cartSize = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  // 1. Load Products Function
  const loadProducts = useCallback(async () => {
    setRefreshing(true);
    try {
      setProducts(await getProducts(debouncedSearch));
    } catch {
      Alert.alert(t("error"), t("couldNotLoadProducts"));
    } finally {
      setRefreshing(false);
    }
  }, [debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      void loadProducts();
    }, [loadProducts]),
  );

  // 2. Low Stock Count Calculation (Optimized using useMemo)
  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const baseQty = p.is_base_unit ? p.stock_qty : (p.base_stock_qty ?? 0);
      return baseQty < 5;
    }).length;
  }, [products]);

  // 3. Delete Product Handler
  const handleRemove = useCallback(
    (product: Product) => {
      Alert.alert(t("deleteProductQuestion"), product.name, [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(product.id!);
              if (removeItemFromCart) {
                removeItemFromCart(product.id!);
              }
              void loadProducts();
            } catch {
              Alert.alert(t("error"), t("couldNotDeleteProduct"));
            }
          },
        },
      ]);
    },
    [removeItemFromCart, loadProducts],
  );

  // 4. Add to Cart Handler
  const handleAddToCart = useCallback(
    (product: Product) => {
      if (product.stock_qty <= 0) {
        Alert.alert(t("outOfStock"), t("outOfStockMessage"));
        return;
      }
      addItem(product);
    },
    [addItem],
  );

  return (
    <View style={styles.screen}>
      <HomeHeader
        search={search}
        onSearchChange={setSearch}
        onScanPress={() => navigation.navigate("Scanner")}
      />

      {/* Summary Row */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {t("productCount", { count: products.length })}
        </Text>
        <Text style={styles.warning}>
          {t("lowStockCount", { count: lowStockCount })}
        </Text>
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadProducts}
            tintColor="#f36f0a"
          />
        }
        contentContainerStyle={products.length ? styles.list : styles.emptyList}
        ListEmptyComponent={<ProductEmptyState />}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onEdit={(id) =>
              navigation.navigate("EditProduct", { productId: id })
            }
            onDelete={handleRemove}
            onAddToCart={handleAddToCart}
          />
        )}
      />

      {/* Floating Action Button */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddProduct")}>
        <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        <Text style={styles.fabText}>{t("addProduct")}</Text>
      </Pressable>
      <Pressable
        style={styles.restockFab}
        onPress={() => navigation.navigate("Restock")}>
        <MaterialCommunityIcons name="package-down" size={22} color="#fff" />
        <Text style={styles.fabText}>{t("restock")}</Text>
      </Pressable>

      {/* Navigation Bar */}
      <BottomNavBar
        activeRoute="Home"
        cartSize={cartSize}
        onNavigate={(route) => navigation.navigate(route)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0", padding: 20 },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 18,
  },
  summaryLabel: { color: "#7a6a52", fontWeight: "700" },
  warning: { color: "#bd6337", fontWeight: "700" },
  list: { paddingBottom: 150 },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 160,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 82,
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 7,
    elevation: 3,
  },
  fabText: { color: "#fff", fontWeight: "800" },
  restockFab: {
    position: "absolute",
    right: 20,
    bottom: 136,
    backgroundColor: "#3a2818",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 7,
    elevation: 3,
  },
});
