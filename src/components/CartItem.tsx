import React, { memo, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CartItem as CartItemType } from "../types";
import { getSaleQuantityStep } from "../store/useCartStore";

interface CartItemProps {
  item: CartItemType;
  onIncrease: (item: CartItemType) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
  onUpdateQuantity?: (id: number, quantity: number) => void; // Quantity တိုက်ရိုက်ပြင်ရန်
}

function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onUpdateQuantity,
}: CartItemProps) {
  const [qtyText, setQtyText] = useState(String(item.quantity));

  // Cart ထဲက quantity ပြောင်းသွားရင် Input စာသားကိုပါ Update လုပ်ပေးရန်
  useEffect(() => {
    setQtyText(String(item.quantity));
  }, [item.quantity]);

  // Input စာသား ပြောင်းလဲချိန် တွက်ချက်မှု Logic
  const handleQtyChange = (text: string) => {
    setQtyText(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed > 0 && onUpdateQuantity) {
      onUpdateQuantity(item.id!, parsed);
    }
  };

  // Input မဟုတ်ဘဲ အပြင်နှိပ်လိုက်ချိန် သို့မဟုတ် ရိုက်ပြီးချိန်တွင် စစ်ဆေးရန်
  const handleBlur = () => {
    const parsed = parseFloat(qtyText);
    if (isNaN(parsed) || parsed <= 0) {
      setQtyText("1");
      if (onUpdateQuantity) onUpdateQuantity(item.id!, 1);
    }
  };

  return (
    <View style={styles.item}>
      {/* Top Row: Name and Delete Button */}
      <View style={styles.headerRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.meta}>
            {item.selling_price.toLocaleString()} MMK each ·{" "}
            {item.is_base_unit
              ? item.selling_unit === "unit"
                ? "per unit"
                : `per ${item.selling_unit}`
              : `Pack of ${item.conversion_rate}`}
          </Text>
        </View>

        <Pressable
          onPress={() => onRemove(item.id!)}
          hitSlop={10}
          style={styles.deleteBtn}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color="#aab8b2"
          />
        </Pressable>
      </View>

      {/* Bottom Row: Quantity Controls & Line Total */}
      <View style={styles.actionRow}>
        <View style={styles.controls}>
          <Pressable style={styles.step} onPress={() => onDecrease(item.id!)}>
            <Text style={styles.stepText}>-</Text>
          </Pressable>

          <TextInput
            style={styles.quantityInput}
            value={qtyText}
            onChangeText={handleQtyChange}
            onBlur={handleBlur}
            keyboardType={
              item.selling_unit === "unit" ? "number-pad" : "decimal-pad"
            }
            selectTextOnFocus
          />

          <Pressable style={styles.step} onPress={() => onIncrease(item)}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.lineTotal}>
          {(item.selling_price * item.quantity).toLocaleString()}{" "}
          <Text style={styles.currency}>MMK</Text>
        </Text>
      </View>
    </View>
  );
}

export default memo(CartItem);

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#fff",
    borderColor: "#f1dfb8",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    color: "#3a2818",
    fontSize: 15,
    fontWeight: "800",
  },
  meta: {
    color: "#9a896f",
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f4f2",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  step: {
    width: 30,
    height: 30,
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    color: "#3a2818",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
  quantityInput: {
    width: 44,
    height: 30,
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#3a2818",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: 0,
  },
  lineTotal: {
    color: "#f36f0a",
    fontSize: 16,
    fontWeight: "800",
  },
  currency: {
    fontSize: 11,
    fontWeight: "700",
  },
});
