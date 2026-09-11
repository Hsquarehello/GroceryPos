import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../../App";
import { deleteProduct, getProducts } from "../database/productRepository";
import { useCartStore } from "../store/useCartStore";
import { Product } from "../types";
import ProductCard from "../components/ProductCard";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const removeItemFromCart = useCartStore((state) => state.removeItem); // Cart Store ထဲတွင် ထည့်ထားရန် လိုပါသည်
  const cartSize = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  // 1. Search Debounce Logic (300ms စောင့်ပြီးမှ Search ပြုလုပ်မည်)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // 2. Load Products Function
  const loadProducts = useCallback(async () => {
    setRefreshing(true);
    try {
      setProducts(await getProducts(debouncedSearch));
    } catch {
      Alert.alert("Error", "Could not load products");
    } finally {
      setRefreshing(false);
    }
  }, [debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      void loadProducts();
    }, [loadProducts]),
  );

  // 3. Delete Product Handler
  const remove = (product: Product) =>
    Alert.alert("Delete product?", product.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(product.id!);
            // Cart ထဲတွင် ရှိနေပါက ထို item အား ပါဝင်ဖျက်ထုတ်မည်
            if (removeItemFromCart) {
              removeItemFromCart(product.id!);
            }
            void loadProducts();
          } catch {
            Alert.alert("Error", "Could not delete product");
          }
        },
      },
    ]);

  // 4. Add to Cart Handler (with UI Feedback)
  const handleAddToCart = (product: Product) => {
    if (product.stock_qty <= 0) {
      Alert.alert("Out of Stock", "This product is currently out of stock.");
      return;
    }
    addItem(product);
  };

  // 5. Low Stock Count Calculation (Base Unit များကိုသာ စစ်ဆေးခြင်း)
  const lowStockCount = products.filter((p) => {
    // Base unit ဖြစ်ပါက stock_qty ကိုကြည့်မည်၊ Package ဖြစ်ပါက base_stock_qty ကိုကြည့်မည်
    const baseQty = p.is_base_unit ? p.stock_qty : (p.base_stock_qty ?? 0);
    return baseQty < 5;
  }).length;

  return (
    <View style={styles.screen}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>INVENTORY</Text>
          <Text style={styles.heading}>Your products</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.scanButton}
            onPress={() => navigation.navigate("Scanner")}>
            <MaterialCommunityIcons
              name="barcode-scan"
              size={20}
              color="#fff"
            />
            <Text style={styles.scanText}>Scan</Text>
          </Pressable>
        </View>
      </View>

      {/* Search Input */}
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search name or barcode"
        placeholderTextColor="#8a9b95"
        style={styles.search}
      />

      {/* Summary Row */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{products.length} products</Text>
        <Text style={styles.warning}>{lowStockCount} low stock</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={42}
              color="#d7e0dc"
            />
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptyText}>
              Add your first item to start tracking stock.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onEdit={(id) =>
              navigation.navigate("EditProduct", { productId: id })
            }
            onDelete={remove}
            onAddToCart={handleAddToCart}
          />
        )}
      />

      {/* Floating Action Button */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddProduct")}>
        <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        <Text style={styles.fabText}>Add product</Text>
      </Pressable>

      <View style={styles.navBar}>
        <NavItem
          icon="home-variant"
          label="Home"
          active
          onPress={() => navigation.navigate("Home")}
        />
        <NavItem
          icon="chart-line"
          label="Reports"
          onPress={() => navigation.navigate("Reports")}
        />
        <NavItem
          icon="account-cash-outline"
          label="Debt"
          onPress={() => navigation.navigate("Customers")}
        />
        <NavItem
          icon="cart-outline"
          label="Cart"
          onPress={() => navigation.navigate("Cart")}
          badge={cartSize}
        />
      </View>
    </View>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  badge = 0,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active?: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.navItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.navIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={active ? "#f36f0a" : "#8a7658"}
        />
        {badge > 0 && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffaf0", padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: "#3a2818", fontSize: 30, fontWeight: "800", marginTop: 4 },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#3a2818",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  scanText: { color: "#fff", fontWeight: "700" },
  search: {
    backgroundColor: "#fff",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: "#3a2818",
  },
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#3a2818",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },
  emptyText: { color: "#71837a", marginTop: 6, textAlign: "center" },
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
  navBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
    elevation: 5,
    shadowColor: "#6b481d",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  navItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navIconWrap: { position: "relative" },
  navLabel: { color: "#71837a", fontSize: 10, fontWeight: "700" },
  navLabelActive: { color: "#f36f0a" },
  navBadge: {
    position: "absolute",
    left: 13,
    top: -7,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: "#f36f0a",
    alignItems: "center",
    justifyContent: "center",
  },
  navBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
