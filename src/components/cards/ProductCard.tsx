import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Product } from "../../types";

interface ProductCardProps {
  item: Product;
  onEdit: (id: number) => void;
  onDelete: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

function ProductCard({
  item,
  onEdit,
  onDelete,
  onAddToCart,
}: ProductCardProps) {
  const isOutOfStock = item.stock_qty <= 0;
  const isLowStock = item.stock_qty > 0 && item.stock_qty < 5;

  return (
    <Pressable style={styles.card} onPress={() => onEdit(item.id!)}>
      {/* Icon Area */}
      <View style={styles.icon}>
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={24}
          color="#f36f0a"
        />
      </View>

      {/* Details Area */}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.barcode ? `Barcode: ${item.barcode}` : "No barcode"}
        </Text>
        <Text style={styles.unitLabel} numberOfLines={1}>
          {item.is_base_unit
            ? item.selling_unit === "unit"
              ? "Sold by unit"
              : `Sold by ${item.selling_unit}`
            : `Package · ${item.conversion_rate} base units`}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {item.selling_price.toLocaleString()}{" "}
            <Text style={styles.currency}>MMK</Text>
          </Text>
        </View>
      </View>

      {/* Right Column: Stock & Actions */}
      <View style={styles.rightColumn}>
        {/* Top Action: Delete */}
        <Pressable
          hitSlop={10}
          onPress={() => onDelete(item)}
          style={styles.deleteButton}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color="#aab8b2"
          />
        </Pressable>

        {/* Middle: Stock Badge */}
        <View style={styles.stockRow}>
          <View
            style={[
              styles.stockBadge,
              isOutOfStock && styles.outBadge,
              isLowStock && styles.lowBadge,
            ]}>
            <Text
              style={[
                styles.stockText,
                isOutOfStock && styles.outText,
                isLowStock && styles.lowText,
              ]}>
              {isOutOfStock
                ? "Out of stock"
                : `${item.stock_qty} ${item.is_base_unit ? item.selling_unit : "packs"}`}
            </Text>
          </View>
        </View>

        {/* Bottom Action: Add to Cart */}
        <Pressable
          style={[styles.addButton, isOutOfStock && styles.addDisabled]}
          disabled={isOutOfStock}
          onPress={() => onAddToCart(item)}>
          <MaterialCommunityIcons name="cart-plus" size={16} color="#fff" />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default memo(ProductCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1dfb8",
    alignItems: "center",
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#fff0c2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  details: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  name: {
    color: "#3a2818",
    fontSize: 15,
    fontWeight: "800",
  },
  meta: {
    color: "#9a896f",
    fontSize: 11,
    marginTop: 2,
  },
  unitLabel: {
    color: "#f36f0a",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 6,
  },
  price: {
    color: "#f36f0a",
    fontSize: 15,
    fontWeight: "800",
  },
  currency: {
    fontSize: 11,
    fontWeight: "700",
  },
  rightColumn: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 72,
  },
  deleteButton: {
    padding: 2,
  },
  stockRow: {
    marginVertical: 2,
  },
  stockBadge: {
    backgroundColor: "#fff1c2",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowBadge: {
    backgroundColor: "#fdf0ed",
  },
  outBadge: {
    backgroundColor: "#f3f4f6",
  },
  stockText: {
    color: "#7a6442",
    fontSize: 10,
    fontWeight: "700",
  },
  lowText: {
    color: "#d45e45",
  },
  outText: {
    color: "#9ca3af",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f36f0a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addDisabled: {
    backgroundColor: "#bdc9c2",
  },
  addText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
