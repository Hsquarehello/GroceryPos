import { Alert, Platform } from "react-native";
import * as Application from "expo-application";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

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

async function downloadAndInstall(apkUrl: string) {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    // 1. cacheDirectory သို့ ပြောင်းလဲထားပါသည် (Android FileProvider Compliant ဖြစ်စေရန်)
    const fileUri = `${FileSystem.cacheDirectory}update.apk`;

    // ယခင်ရှိပြီးသား APK ဖိုင်အဟောင်းရှိရင် ဖျက်ပါမည်
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }

    // 2. Download ဆွဲခြင်း
    const downloadResult = await FileSystem.downloadAsync(apkUrl, fileUri);

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    // 3. Content URI ယူပြီး Installer ပွင့်စေခြင်း
    const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: "application/vnd.android.package-archive",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Download/Install Error]:", error);
    Alert.alert("Install Failed", `Could not install update: ${message}`);
  }
}

export default async function checkVersion() {
  try {
    const currentVersion = Application.nativeApplicationVersion || "1.0.0";
    const response = await fetch(`${VERSION_MANIFEST_URL}?t=${Date.now()}`);

    if (!response.ok) {
      throw new Error(`Could not check for updates (Status: ${response.status})`);
    }

    const manifest = (await response.json()) as VersionManifest;

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

    const updateAction = () => {
      // Download မစမီ Alert ပြပြီးမှ နောက်ကွယ်မှ ဒေါင်းလုဒ်စမည်
      Alert.alert(
        "Downloading Update",
        "The update is downloading in the background. The installer will launch automatically.",
        [{ text: "OK" }],
      );
      downloadAndInstall(manifest.apkUrl);
    };

    Alert.alert(
      `GroceryPOS ${manifest.latestVersion} is available`,
      "Update now to get the latest features and fixes.",
      manifest.forceUpdate
        ? [{ text: "Update now", onPress: updateAction }]
        : [
            { text: "Later", style: "cancel" },
            { text: "Update now", onPress: updateAction },
          ],
      { cancelable: !manifest.forceUpdate }, // Force Update အခြေအနေတွင် Alert ကို အပြင်နှိပ်ပြီး ပိတ်၍မရအောင် တားဆီးသည်
    );
  } catch (error) {
    console.log("[In-App Update Error]:", error);
  }
}