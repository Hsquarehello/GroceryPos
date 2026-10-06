import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNarrow = width < 360;
  const isWide = width >= 768;
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
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
    <View
      style={[
        styles.screen,
        isNarrow && styles.screenNarrow,
        isWide && styles.screenWide,
      ]}>
      <View style={styles.pageContent}>
        <HomeHeader
          search={search}
          onSearchChange={setSearch}
          onScanPress={() => navigation.navigate("Scanner")}
        />

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>
            {t("productCount", { count: products.length })}
          </Text>
          <Text style={styles.warning}>
            {t("lowStockCount", { count: lowStockCount })}
          </Text>
        </View>
      </View>

      <FlatList
        style={styles.productList}
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

      {isActionMenuOpen && (
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setIsActionMenuOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t("close")}
        />
      )}

      <View
        style={[
          styles.fabActions,
          { bottom: Math.max(insets.bottom, 8) + 114 },
          isNarrow && styles.fabActionsNarrow,
        ]}>
        {isActionMenuOpen && (
          <>
            <Pressable
              style={styles.fabMenuItem}
              onPress={() => {
                setIsActionMenuOpen(false);
                navigation.navigate("Restock");
              }}
              accessibilityRole="button"
              accessibilityLabel={t("restock")}>
              <Text style={styles.fabMenuLabel}>{t("restock")}</Text>
              <View style={styles.fabMenuIcon}>
                <MaterialCommunityIcons
                  name="package-down"
                  size={22}
                  color="#3a2818"
                />
              </View>
            </Pressable>
            <Pressable
              style={styles.fabMenuItem}
              onPress={() => {
                setIsActionMenuOpen(false);
                navigation.navigate("AddProduct");
              }}
              accessibilityRole="button"
              accessibilityLabel={t("addProduct")}>
              <Text style={styles.fabMenuLabel}>{t("addProduct")}</Text>
              <View style={styles.fabMenuIcon}>
                <MaterialCommunityIcons
                  name="package-variant-plus"
                  size={22}
                  color="#f36f0a"
                />
              </View>
            </Pressable>
          </>
        )}
        <Pressable
          style={styles.fabTrigger}
          onPress={() => setIsActionMenuOpen((isOpen) => !isOpen)}
          accessibilityRole="button"
          accessibilityLabel={t("moreOptions")}
          accessibilityState={{ expanded: isActionMenuOpen }}>
          <MaterialCommunityIcons
            name={isActionMenuOpen ? "close" : "plus"}
            size={28}
            color="#fff"
          />
        </Pressable>
      </View>

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
  screenNarrow: { padding: 12 },
  screenWide: { padding: 32 },
  pageContent: { width: "100%", maxWidth: 1040, alignSelf: "center" },
  productList: { width: "100%", maxWidth: 1040, alignSelf: "center" },
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
  menuBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  fabActions: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    gap: 10,
    zIndex: 2,
  },
  fabActionsNarrow: { right: 12 },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fabMenuLabel: {
    color: "#3a2818",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontWeight: "800",
    elevation: 3,
  },
  fabMenuIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    elevation: 3,
  },
  fabTrigger: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f36f0a",
    elevation: 6,
  },
});
