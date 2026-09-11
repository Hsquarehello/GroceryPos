import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Application from "expo-application";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

import { initDatabase } from "./src/database/db";
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
  Transactions: undefined;
  QuantitySold: undefined;
  Customers: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// 1. Permanent Raw URL (Commit Hash /3dfb37... ကို ဖြုတ်ထားသည်)
const VERSION_MANIFEST_URL =
  "https://gist.githubusercontent.com/Hsquarehello/19417c2c80a03040bde0e91b37cbfb9a/raw/version.json";

type VersionManifest = {
  latestVersion: string;
  apkUrl: string;
  forceUpdate: boolean;
};

function isNewerVersion(latestVersion: string, currentVersion: string) {
  const latestParts = latestVersion.split(".").map(Number);
  const currentParts = currentVersion.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    const latestPart = latestParts[index] || 0;
    const currentPart = currentParts[index] || 0;

    if (latestPart !== currentPart) {
      return latestPart > currentPart;
    }
  }

  return false;
}

export default function App() {
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    initDatabase();
    setReady(true);

    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    try {
      // 2. Development Mode အတွက် Fallback version ("1.0.0") ထည့်ပေးထားသည်
      const currentVersion = Application.nativeApplicationVersion || "1.0.0";

      const response = await fetch(`${VERSION_MANIFEST_URL}?t=${Date.now()}`); // Cache ခေတ္တမမှတ်မိစေရန် timestamp ထည့်ထားသည်
      if (!response.ok) {
        throw new Error("Could not check for updates");
      }

      const manifest: VersionManifest = await response.json();

      console.log(
        `[Update Check] Current: ${currentVersion} | Latest: ${manifest.latestVersion}`,
      );

      if (
        !manifest.latestVersion ||
        !manifest.apkUrl ||
        !isNewerVersion(manifest.latestVersion, currentVersion)
      ) {
        return;
      }

      Alert.alert(
        `GroceryPOS ${manifest.latestVersion} is available`,
        "Update now to get the latest features and fixes.",
        manifest.forceUpdate
          ? [
              {
                text: "Update now",
                onPress: () => handleDownloadAndInstall(manifest.apkUrl),
              },
            ]
          : [
              { text: "Later", style: "cancel" },
              {
                text: "Update now",
                onPress: () => handleDownloadAndInstall(manifest.apkUrl),
              },
            ],
      );
    } catch (error) {
      // 3. Debug လုပ်ရလွယ်ကူစေရန် console log ပြထားသည်
      console.log("[In-App Update Error]:", error);
    }
  };

  // 4. Browser မဖွင့်ဘဲ APK ကို တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲပြီး Install လုပ်ပေးမည့် Function
  const handleDownloadAndInstall = async (apkUrl: string) => {
    if (Platform.OS !== "android") return;

    try {
      Alert.alert(
        "Downloading...",
        "APK ကို ဒေါင်းလုဒ်ဆွဲနေပါသည်။ ခေတ္တစောင့်ဆိုင်းပေးပါ...",
      );

      const fileUri = FileSystem.documentDirectory + "update.apk";
      const downloadRes = await FileSystem.downloadAsync(apkUrl, fileUri);

      const contentUri = await FileSystem.getContentUriAsync(downloadRes.uri);

      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
        type: "application/vnd.android.package-archive",
      });
    } catch (error: any) {
      Alert.alert("Install Failed", error.message);
    }
  };

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
