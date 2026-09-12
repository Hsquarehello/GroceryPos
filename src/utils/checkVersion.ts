import { Platform } from "react-native";
import * as Application from "expo-application";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

const VERSION_MANIFEST_URL =
  "https://gist.githubusercontent.com/Hsquarehello/19417c2c80a03040bde0e91b37cbfb9a/raw/version.json";

export type UpdateInfo = {
  latestVersion: string;
  apkUrl: string;
  forceUpdate: boolean;
  releaseNotes: string[];
  sizeMb?: number;
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

export async function downloadAndInstall(
  apkUrl: string,
  onProgress: (progress: number) => void,
) {
  if (Platform.OS !== "android") {
    throw new Error("In-app APK updates are available on Android only.");
  }

  const isDirectApkUrl =
    apkUrl.toLowerCase().endsWith(".apk") ||
    apkUrl.includes("/artifacts/") ||
    apkUrl.includes("/releases/download/");
  if (!isDirectApkUrl || apkUrl.includes("/builds/")) {
    throw new Error(
      "The update link must point directly to an APK file, not an Expo build page.",
    );
  }

  const fileUri = `${FileSystem.cacheDirectory}grocerypos-update.apk`;

  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }

  const downloadTask = FileSystem.createDownloadResumable(
    apkUrl,
    fileUri,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (totalBytesExpectedToWrite > 0) {
        onProgress(totalBytesWritten / totalBytesExpectedToWrite);
      }
    },
  );
  const downloadResult = await downloadTask.downloadAsync();

  if (!downloadResult || downloadResult.status !== 200) {
    throw new Error(
      `Download failed with status ${downloadResult?.status ?? "unknown"}`,
    );
  }

  const downloadedInfo = await FileSystem.getInfoAsync(downloadResult.uri);
  if (
    !downloadedInfo.exists ||
    !downloadedInfo.size ||
    downloadedInfo.size < 100000
  ) {
    throw new Error(
      "The downloaded update is incomplete or is not a valid APK file.",
    );
  }

  onProgress(1);
  const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    flags: 1,
    type: "application/vnd.android.package-archive",
  });
}

export default async function checkVersion(): Promise<UpdateInfo | null> {
  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const currentVersion = Application.nativeApplicationVersion || "1.0.0";
    const response = await fetch(`${VERSION_MANIFEST_URL}?t=${Date.now()}`);

    if (!response.ok) {
      throw new Error(
        `Could not check for updates (Status: ${response.status})`,
      );
    }

    const rawManifest = (await response.json()) as Partial<UpdateInfo>;
    const manifest: UpdateInfo = {
      latestVersion: rawManifest.latestVersion ?? "",
      apkUrl: rawManifest.apkUrl ?? "",
      forceUpdate: rawManifest.forceUpdate ?? false,
      releaseNotes: rawManifest.releaseNotes ?? [],
      sizeMb: rawManifest.sizeMb,
    };

    console.log(
      `[Update Check] Current: ${currentVersion} | Latest: ${manifest.latestVersion}`,
    );

    if (
      !manifest.latestVersion ||
      !manifest.apkUrl ||
      !isNewerVersion(manifest.latestVersion, currentVersion)
    ) {
      return null;
    }

    return manifest;
  } catch (error) {
    console.log("[In-App Update Error]:", error);
    return null;
  }
}
