import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";

import { initDatabase } from "./src/database/db";
import checkVersion, { UpdateInfo } from "./src/utils/checkVersion";
import UpdateModal from "./src/components/modals/UpdateModal";
import HomeScreen from "./src/screens/HomeScreen";
import AddProductScreen from "./src/screens/AddProductScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import CartScreen from "./src/screens/CartScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import CustomersScreen from "./src/screens/CustomersScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import QuantitySoldScreen from "./src/screens/QuantitySoldScreen";

export type RootStackParamList = {
  Home: undefined;
  AddProduct: { barcode?: string } | undefined;
  EditProduct: { productId: number };
  Scanner: { mode?: "cart" | "product" } | undefined;
  Cart: undefined;
  Reports: undefined;
  Transactions:
    | { startDate?: string; endDate?: string; transactionId?: number }
    | undefined;
  QuantitySold: { startDate?: string; endDate?: string } | undefined;
  Customers: undefined;
};

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = React.useState(false);
  const [availableUpdate, setAvailableUpdate] =
    React.useState<UpdateInfo | null>(null);

  useEffect(() => {
    let isActive = true;

    const prepareApp = async () => {
      try {
        initDatabase();
        const updateInfo = await checkVersion();

        if (isActive) {
          setAvailableUpdate(updateInfo);
        }
      } catch (error) {
        console.warn("App startup failed:", error);
      } finally {
        if (isActive) {
          setReady(true);
          await SplashScreen.hideAsync();
        }
      }
    };

    void prepareApp();

    return () => {
      isActive = false;
    };
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
          name="Transactions"
          component={TransactionsScreen}
          options={{ title: "Transactions" }}
        />
        <Stack.Screen
          name="QuantitySold"
          component={QuantitySoldScreen}
          options={{ title: "Quantity sold" }}
        />
        <Stack.Screen
          name="Customers"
          component={CustomersScreen}
          options={{ title: "Customers" }}
        />
      </Stack.Navigator>
      <UpdateModal
        update={availableUpdate}
        onDismiss={() => setAvailableUpdate(null)}
      />
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
