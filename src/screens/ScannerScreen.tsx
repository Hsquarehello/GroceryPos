import React, { useState } from "react";
import {
  Alert,
  Button,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { getProductByBarcode } from "../database/productRepository";
import { useCartStore } from "../store/useCartStore";

type Props = NativeStackScreenProps<RootStackParamList, "Scanner">;
export default function ScannerScreen({ navigation, route }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const productMode = route.params?.mode === "product";
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState("");
  const [locked, setLocked] = useState(false);
  const lookup = async (barcode: string) => {
    const value = barcode.trim();
    if (!value || locked) return;
    setLocked(true);
    const product = await getProductByBarcode(value);
    if (productMode) {
      if (product) {
        Alert.alert(
          "Barcode already registered",
          `${product.name} already uses this barcode.`,
          [{ text: "Scan again", onPress: () => setLocked(false) }],
        );
      } else {
        navigation.replace("AddProduct", { barcode: value });
      }
      return;
    }
    if (product)
      Alert.alert(
        "Product found",
        `${product.name}\nStock: ${product.stock_qty}`,
        [
          {
            text: "Add to cart",
            onPress: () => {
              addItem(product);
              navigation.replace("Home");
            },
          },
          {
            text: "Edit product",
            onPress: () =>
              navigation.replace("EditProduct", { productId: product.id! }),
          },
          { text: "Scan again", onPress: () => setLocked(false) },
        ],
      );
    else
      Alert.alert("New barcode", "No product uses this barcode yet.", [
        {
          text: "Add product",
          onPress: () => navigation.replace("AddProduct", { barcode: value }),
        },
        { text: "Scan again", onPress: () => setLocked(false) },
      ]);
  };

  if (!permission)
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Checking camera permission...</Text>
      </View>
    );

  if (!permission.granted)
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.muted}>
          Use your camera to find or create a product by barcode.
        </Text>
        <Button
          title="Allow camera"
          onPress={requestPermission}
          color="#f36f0a"
        />
      </View>
    );

  return (
    <View style={styles.screen}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={locked ? undefined : ({ data }) => void lookup(data)}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "code128", "qr"],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.instruction}>
          Align the barcode inside the frame
        </Text>
      </View>
      <View style={styles.manual}>
        <Text style={styles.manualLabel}>Or enter barcode manually</Text>
        <View style={styles.manualRow}>
          <TextInput
            value={manual}
            onChangeText={setManual}
            onSubmitEditing={() => {
              Keyboard.dismiss();
              void lookup(manual);
            }}
            keyboardType="number-pad"
            placeholder="Barcode"
            placeholderTextColor="#8da098"
            style={styles.input}
          />
          <Pressable
            style={styles.find}
            onPress={() => {
              Keyboard.dismiss();
              void lookup(manual);
            }}>
            <Text style={styles.findText}>Find</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#3a2818" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 90, // Manual section Box နေရာကို မကွယ်စေရန် လွတ်ပေးထားခြင်းဖြစ်ပါတယ်
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13,35,30,0.3)",
  },
  frame: {
    width: 275,
    height: 145,
    borderWidth: 2,
    borderColor: "#f5b25d",
    borderRadius: 10,
  },
  instruction: { color: "#fff", fontWeight: "700", marginTop: 20 },
  manual: { backgroundColor: "#fffaf0", padding: 18 },
  manualLabel: {
    color: "#7a6442",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  manualRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderColor: "#f0dfb6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 13,
    color: "#3a2818",
    fontSize: 16,
  },
  find: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  findText: { color: "#fff", fontWeight: "800" },
  center: {
    flex: 1,
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 15,
  },
  title: {
    color: "#3a2818",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  muted: { color: "#8a7658", textAlign: "center" },
});
