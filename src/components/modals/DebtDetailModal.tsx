import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomerDebtDetail } from "../../database";
import { t } from "../../i18n";

interface DebtDetailModalProps {
  visible: boolean;
  loading: boolean;
  debtDetail: CustomerDebtDetail | null;
  onClose: () => void;
  onNavigateToTransaction: (transactionId: number) => void;
  onRecordPayment: () => void;
}

export const DebtDetailModal: React.FC<DebtDetailModalProps> = ({
  visible,
  loading,
  debtDetail,
  onClose,
  onNavigateToTransaction,
  onRecordPayment,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.detailModalContent}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.modalTitle}>{t("debtHistory")}</Text>
              <Text style={styles.modalSubtext}>
                {debtDetail?.name ?? t("customer")}
              </Text>
            </View>
            <Pressable style={styles.closeIconButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color="#3a2818" />
            </Pressable>
          </View>

          {loading ? (
            <Text style={styles.emptyText}>{t("loadingDebtDetails")}</Text>
          ) : debtDetail ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailSummaryCard}>
                <Text style={styles.summaryLabel}>{t("outstanding")}</Text>
                <Text style={styles.detailSummaryValue}>
                  {debtDetail.total_debt.toLocaleString()} MMK
                </Text>
                <Text style={styles.summaryMeta}>
                  {t("debtSummaryMeta", {
                    sales: debtDetail.sales.length,
                    repayments: debtDetail.repayments.length,
                  })}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>{t("creditSales")}</Text>
              {debtDetail.sales.length ? (
                debtDetail.sales.map((sale) => (
                  <Pressable
                    key={sale.id}
                    style={({ pressed }) => [
                      styles.historyItem,
                      pressed && styles.historyItemPressed,
                    ]}
                    onPress={() => onNavigateToTransaction(sale.id)}>
                    <View style={styles.historyRow}>
                      <View style={styles.historyTitleRow}>
                        <Text style={styles.historyTitle}>
                          {t("saleNumber", { id: sale.id })}
                        </Text>
                        <MaterialCommunityIcons
                          name="open-in-new"
                          size={15}
                          color="#f36f0a"
                        />
                      </View>
                      <Text style={styles.historyAmount}>
                        {sale.remaining_amount.toLocaleString()} MMK
                      </Text>
                    </View>
                    <Text style={styles.historyMeta}>
                      {new Date(sale.created_at).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {t("saleTotalLabel")}:{" "}
                      {sale.total_amount.toLocaleString()} MMK ·
                      {t("paidNowLabel")}: {sale.cash_received.toLocaleString()}{" "}
                      MMK
                    </Text>
                    {sale.debt_note ? (
                      <Text style={styles.historyNote}>{sale.debt_note}</Text>
                    ) : null}
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>{t("noCreditSales")}</Text>
              )}

              <Text style={styles.sectionTitle}>{t("repayments")}</Text>
              {debtDetail.repayments.length ? (
                debtDetail.repayments.map((repaymentItem) => (
                  <View key={repaymentItem.id} style={styles.historyItem}>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyTitle}>
                        {t("paymentNumber", { id: repaymentItem.id })}
                      </Text>
                      <Text style={styles.historyAmountPositive}>
                        +{repaymentItem.amount_paid.toLocaleString()} MMK
                      </Text>
                    </View>
                    <Text style={styles.historyMeta}>
                      {new Date(repaymentItem.created_at).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>{t("noRepayments")}</Text>
              )}

              <Pressable style={styles.addButton} onPress={onRecordPayment}>
                <MaterialCommunityIcons
                  name="cash-check"
                  size={17}
                  color="#fff"
                />
                <Text style={styles.addButtonText}>{t("recordPayment")}</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>{t("noDebtDetailsAvailable")}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(107, 72, 29, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  detailModalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    maxHeight: "85%",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: "#3a2818",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtext: { color: "#71837a", fontSize: 13, marginBottom: 12 },
  detailSummaryCard: {
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  summaryLabel: {
    color: "#b8d1c3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  detailSummaryValue: {
    color: "#bd6337",
    fontSize: 22,
    fontWeight: "900",
  },
  summaryMeta: { color: "#71837a", fontSize: 12, marginTop: 4 },
  sectionTitle: {
    color: "#3a2818",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  historyItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dfb6",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyItemPressed: { opacity: 0.72 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  historyTitle: { color: "#3a2818", fontSize: 13, fontWeight: "800" },
  historyAmount: { color: "#bd6337", fontSize: 13, fontWeight: "800" },
  historyAmountPositive: { color: "#4c8b68", fontSize: 13, fontWeight: "800" },
  historyMeta: { color: "#71837a", fontSize: 12, marginTop: 4 },
  historyNote: {
    color: "#7a6a52",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  addButton: {
    backgroundColor: "#f36f0a",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 14,
    marginBottom: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "800" },
  emptyText: { color: "#71837a", textAlign: "center", padding: 30 },
});
