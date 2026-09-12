import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  refundTransaction,
  TransactionDetail,
} from "../../database/productRepository";
import { formatMoney } from "../../utils/formatters";
import { DetailAmount } from "../layout/DetailAmount";

interface TransactionDetailModalProps {
  detail: TransactionDetail | null;
  loading: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export function TransactionDetailModal({
  detail,
  loading,
  onClose,
  onChanged,
}: TransactionDetailModalProps) {
  const [processing, setProcessing] = useState(false);
  const isCredit = detail?.payment_type === "CREDIT";
  const outstanding = detail
    ? Math.max(0, detail.total_amount - detail.cash_received)
    : 0;

  const refund = () => {
    if (!detail || detail.status === "REFUNDED") return;
    Alert.alert(
      "Refund sale",
      `Return all items from Sale #${detail.id} to stock?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refund",
          style: "destructive",
          onPress: async () => {
            setProcessing(true);
            try {
              await refundTransaction(detail.id);
              await onChanged();
              Alert.alert(
                "Refund complete",
                "The sale was refunded and stock was restored.",
              );
            } catch (error) {
              Alert.alert(
                "Could not refund sale",
                error instanceof Error ? error.message : "Please try again.",
              );
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={loading || detail !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.modalEyebrow}>TRANSACTION DETAIL</Text>
              <Text style={styles.modalTitle}>
                {detail ? `Sale #${detail.id}` : "Loading sale"}
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color="#3a2818" />
            </Pressable>
          </View>

          {loading || !detail ? (
            <View style={styles.loadingDetail}>
              <Text style={styles.detailMuted}>
                Loading transaction details...
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.detailDate}>
                {new Date(detail.created_at).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Text>

              <View style={styles.detailStatusRow}>
                <View
                  style={[
                    styles.badge,
                    isCredit && styles.creditBadge,
                    detail.status === "REFUNDED" && styles.refundedBadge,
                  ]}>
                  <Text
                    style={[
                      styles.badgeText,
                      isCredit && styles.creditBadgeText,
                      detail.status === "REFUNDED" && styles.refundedBadgeText,
                    ]}>
                    {detail.status === "REFUNDED"
                      ? "REFUNDED"
                      : isCredit
                        ? "CREDIT"
                        : "CASH"}
                  </Text>
                </View>
                {detail.customer_name ? (
                  <Text style={styles.detailCustomer}>
                    {detail.customer_name}
                    {detail.customer_phone ? ` · ${detail.customer_phone}` : ""}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.detailSectionTitle}>Items</Text>
              {detail.items.map((item) => (
                <View key={item.id} style={styles.detailItem}>
                  <View style={styles.detailItemInfo}>
                    <Text style={styles.detailItemName}>
                      {item.product_name}
                    </Text>
                    <Text style={styles.detailMuted}>
                      {item.quantity} {item.selling_unit} ×{" "}
                      {formatMoney(item.unit_price)}
                    </Text>
                  </View>
                  <Text style={styles.detailItemTotal}>
                    {formatMoney(item.line_total)}
                  </Text>
                </View>
              ))}

              <View style={styles.detailTotals}>
                <DetailAmount label="Discount" value={detail.discount_amount} />
                <DetailAmount
                  label="Sale total"
                  value={detail.total_amount}
                  strong
                />
                <DetailAmount
                  label={isCredit ? "Paid now" : "Collected"}
                  value={isCredit ? detail.cash_received : detail.total_amount}
                />
                {!isCredit && (
                  <DetailAmount label="Change" value={detail.change_amount} />
                )}
                {isCredit && (
                  <DetailAmount
                    label="Outstanding"
                    value={outstanding}
                    danger
                    strong
                  />
                )}
              </View>

              {detail.sale_note || detail.debt_note ? (
                <View style={styles.notesBox}>
                  {detail.sale_note ? (
                    <Text style={styles.noteText}>
                      Sale note: {detail.sale_note}
                    </Text>
                  ) : null}
                  {detail.debt_note ? (
                    <Text style={styles.noteText}>
                      Debt note: {detail.debt_note}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.detailActions}>
                {detail.status !== "REFUNDED" ? (
                  <Pressable
                    style={[styles.actionButton, styles.refundButton]}
                    onPress={refund}
                    disabled={processing}>
                    <MaterialCommunityIcons
                      name="cash-refund"
                      size={17}
                      color="#a33e2b"
                    />
                    <Text style={styles.refundButtonText}>Refund sale</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#fff1c2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  creditBadge: { backgroundColor: "#fff1c2" },
  badgeText: { color: "#7a6442", fontSize: 10, fontWeight: "900" },
  creditBadgeText: { color: "#bd6337" },
  refundedBadge: { backgroundColor: "#f4e4df" },
  refundedBadgeText: { color: "#a33e2b" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(44, 31, 18, 0.45)",
  },
  detailModal: {
    backgroundColor: "#fffaf0",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: "88%",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalEyebrow: {
    color: "#f36f0a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  modalTitle: {
    color: "#3a2818",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
  },
  loadingDetail: { paddingVertical: 42, alignItems: "center" },
  detailDate: { color: "#71837a", fontSize: 13, marginBottom: 12 },
  detailStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 16,
  },
  detailCustomer: { color: "#7a6a52", fontSize: 12, fontWeight: "700" },
  detailSectionTitle: {
    color: "#3a2818",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1dfb8",
    borderRadius: 9,
    padding: 11,
    marginBottom: 7,
  },
  detailItemInfo: { flex: 1, paddingRight: 10 },
  detailItemName: { color: "#3a2818", fontSize: 13, fontWeight: "800" },
  detailItemTotal: { color: "#3a2818", fontSize: 13, fontWeight: "900" },
  detailMuted: { color: "#71837a", fontSize: 12, marginTop: 3 },
  detailTotals: {
    borderTopWidth: 1,
    borderTopColor: "#f0dfb6",
    marginTop: 8,
    paddingTop: 9,
  },
  notesBox: {
    backgroundColor: "#fff1c2",
    borderRadius: 9,
    padding: 11,
    marginTop: 14,
  },
  noteText: { color: "#7a6a52", fontSize: 12, lineHeight: 18 },
  detailActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  refundButton: { backgroundColor: "#f4e4df" },
  refundButtonText: { color: "#a33e2b", fontSize: 12, fontWeight: "900" },
});
