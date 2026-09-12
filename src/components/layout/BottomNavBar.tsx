import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface BottomNavBarProps {
  activeRoute: string;
  cartSize: number;
  onNavigate: (routeName: any) => void;
}

export const BottomNavBar = React.memo(({ activeRoute, cartSize, onNavigate }: BottomNavBarProps) => {
  return (
    <View style={styles.navBar}>
      <NavItem
        icon="home-variant"
        label="Home"
        active={activeRoute === "Home"}
        onPress={() => onNavigate("Home")}
      />
      <NavItem
        icon="chart-line"
        label="Reports"
        active={activeRoute === "Reports"}
        onPress={() => onNavigate("Reports")}
      />
      <NavItem
        icon="account-cash-outline"
        label="Debt"
        active={activeRoute === "Customers"}
        onPress={() => onNavigate("Customers")}
      />
      <NavItem
        icon="cart-outline"
        label="Cart"
        active={activeRoute === "Cart"}
        onPress={() => onNavigate("Cart")}
        badge={cartSize}
      />
    </View>
  );
});

interface NavItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active?: boolean;
  badge?: number;
  onPress: () => void;
}

function NavItem({ icon, label, active = false, badge = 0, onPress }: NavItemProps) {
  return (
    <Pressable
      style={styles.navItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.navIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={active ? "#f36f0a" : "#8a7658"}
        />
        {badge > 0 && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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