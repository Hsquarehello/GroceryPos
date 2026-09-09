import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { initDatabase } from "./src/database/db";
import HomeScreen from "./src/screens/HomeScreen";
import AddProductScreen from "./src/screens/AddProductScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import CartScreen from "./src/screens/CartScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import CustomersScreen from "./src/screens/CustomersScreen";

export type RootStackParamList = {
  Home: undefined;
  AddProduct: { barcode?: string } | undefined;
  EditProduct: { productId: number };
  Scanner: { mode?: "cart" | "product" } | undefined;
  Cart: undefined;
  Reports: undefined;
  Customers: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    initDatabase();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: "#173f35",
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Products" }}
        />
        <Stack.Screen
          name="AddProduct"
          component={AddProductScreen}
          options={{ title: "Add product" }}
        />
        <Stack.Screen
          name="EditProduct"
          component={AddProductScreen}
          options={{ title: "Edit product" }}
        />
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{ title: "Scan barcode" }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ title: "Checkout" }}
        />
        <Stack.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ title: "Daily report" }}
        />
        <Stack.Screen
          name="Customers"
          component={CustomersScreen}
          options={{ title: "Customers" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
