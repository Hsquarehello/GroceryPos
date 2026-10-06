import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { downloadAndInstall, UpdateInfo } from "../../utils/checkVersion";

type Props = {
  update: UpdateInfo | null;
  onDismiss: () => void;
};

type DownloadState = "ready" | "downloading" | "error";

export default function UpdateModal({ update, onDismiss }: Props) {
  const [downloadState, setDownloadState] = useState<DownloadState>("ready");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (update) {
      setDownloadState("ready");
      setProgress(0);
      setErrorMessage("");
    }
  }, [update]);

  if (!update) return null;

  const isDownloading = downloadState === "downloading";
  const isForced = update.forceUpdate;

  const startDownload = async () => {
    setDownloadState("downloading");
    setProgress(0);
    setErrorMessage("");

    try {
      await downloadAndInstall(update.apkUrl, (value) => setProgress(value));
    } catch (error) {
      setDownloadState("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("updateDownloadError"),
      );
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isForced && !isDownloading) onDismiss();
      }}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="rocket-launch"
              size={26}
              color="#fff"
            />
          </View>
          <Text style={styles.eyebrow}>{t("groceryPosUpdate")}</Text>
          <Text style={styles.title}>{t("updateAvailableTitle")}</Text>
          <Text style={styles.description}>
            {t("updateVersionMessage", { version: update.latestVersion })}
          </Text>

          {update.releaseNotes.length > 0 && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>{t("whatsNew")}</Text>
              {update.releaseNotes.map((note) => (
                <View key={note} style={styles.noteRow}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color="#f36f0a"
                  />
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>
          )}

          {update.sizeMb !== undefined && (
            <Text style={styles.sizeText}>
              {t("downloadSize", { size: update.sizeMb })}
            </Text>
          )}

          {isDownloading && (
            <View style={styles.progressArea}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress > 0
                  ? t("downloadingUpdate", {
                      percent: Math.round(progress * 100),
                    })
                  : t("preparingDownload")}
              </Text>
            </View>
          )}

          {downloadState === "error" && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color="#b33a2b"
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Pressable
            style={[
              styles.primaryButton,
              isDownloading && styles.disabledButton,
            ]}
            onPress={startDownload}
            disabled={isDownloading}>
            {isDownloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                {downloadState === "error"
                  ? t("retryDownload")
                  : t("updateNow")}
              </Text>
            )}
          </Pressable>

          {!isForced && !isDownloading && (
            <Pressable style={styles.laterButton} onPress={onDismiss}>
              <Text style={styles.laterText}>{t("later")}</Text>
            </Pressable>
          )}

          {isForced && (
            <Text style={styles.requiredText}>{t("updateRequired")}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(44, 31, 18, 0.55)",
  },
  modal: {
    backgroundColor: "#fffaf0",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f36f0a",
    marginBottom: 14,
  },
  eyebrow: {
    color: "#f36f0a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: { color: "#3a2818", fontSize: 24, fontWeight: "900", marginTop: 5 },
  description: { color: "#71837a", fontSize: 14, lineHeight: 21, marginTop: 8 },
  notes: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  notesTitle: {
    color: "#3a2818",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 9,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    gap: 8,
  },
  noteText: { flex: 1, color: "#596c63", fontSize: 13, lineHeight: 18 },
  sizeText: { color: "#8a9b95", fontSize: 11, marginTop: 12 },
  progressArea: { marginTop: 18 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f0dfb6",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#f36f0a" },
  progressText: { color: "#71837a", fontSize: 12, marginTop: 7 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff0ed",
    borderRadius: 9,
    padding: 10,
    marginTop: 14,
  },
  errorText: { flex: 1, color: "#b33a2b", fontSize: 12, lineHeight: 17 },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f36f0a",
    borderRadius: 9,
    marginTop: 18,
  },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  disabledButton: { opacity: 0.7 },
  laterButton: { alignItems: "center", paddingVertical: 13 },
  laterText: { color: "#7a6a52", fontSize: 14, fontWeight: "800" },
  requiredText: {
    color: "#bd6337",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
  },
});
