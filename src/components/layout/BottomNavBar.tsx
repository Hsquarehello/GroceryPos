import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../i18n";

interface BottomNavBarProps {
  activeRoute: string;
  cartSize: number;
  onNavigate: (routeName: any) => void;
}

export const BottomNavBar = React.memo(
  ({ activeRoute, cartSize, onNavigate }: BottomNavBarProps) => {
    return (
      <View style={styles.navBar}>
        <NavItem
          icon="home-variant"
          label={t("home")}
          active={activeRoute === "Home"}
          onPress={() => onNavigate("Home")}
        />
        <NavItem
          icon="chart-line"
          label={t("reports")}
          active={activeRoute === "Reports"}
          onPress={() => onNavigate("Reports")}
        />
        <NavItem
          icon="package-variant-closed"
          label={t("batchHistory")}
          active={activeRoute === "PurchaseBatchHistory"}
          onPress={() => onNavigate("PurchaseBatchHistory")}
        />
        <NavItem
          icon="account-cash-outline"
          label={t("debt")}
          active={activeRoute === "Customers"}
          onPress={() => onNavigate("Customers")}
        />
        <NavItem
          icon="cart-outline"
          label={t("cart")}
          active={activeRoute === "Cart"}
          onPress={() => onNavigate("Cart")}
          badge={cartSize}
        />
      </View>
    );
  },
);

interface NavItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active?: boolean;
  badge?: number;
  onPress: () => void;
}

function NavItem({
  icon,
  label,
  active = false,
  badge = 0,
  onPress,
}: NavItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
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
      <Text
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: "#6b481d",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  navItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 16,
  },
  navItemPressed: {
    opacity: 0.7,
  },
  navIconWrap: {
    width: 42,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconWrapActive: {
    backgroundColor: "#fff0c2",
  },
  navLabel: {
    color: "#71837a",
    fontSize: 9,
    fontWeight: "700",
    maxWidth: 56,
    textAlign: "center",
  },
  navLabelActive: {
    color: "#f36f0a",
    fontWeight: "900",
  },
  navBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: "#f36f0a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  navBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});