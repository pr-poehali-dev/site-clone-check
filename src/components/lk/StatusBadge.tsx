interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  draft:            { color: "#6b7280", bg: "#f3f4f6" },
  awaiting_offers:  { color: "#2563eb", bg: "#dbeafe" },
  choosing_offer:   { color: "#7c3aed", bg: "#ede9fe" },
  awaiting_payment: { color: "#d97706", bg: "#fef3c7" },
  paid:             { color: "#059669", bg: "#d1fae5" },
  completed:        { color: "#10b981", bg: "#d1fae5" },
  cancelled:        { color: "#dc2626", bg: "#fee2e2" },
  expired:          { color: "#9ca3af", bg: "#f3f4f6" },
  active:           { color: "#2563eb", bg: "#dbeafe" },
  withdrawn:        { color: "#6b7280", bg: "#f3f4f6" },
  selected:         { color: "#059669", bg: "#d1fae5" },
  rejected:         { color: "#dc2626", bg: "#fee2e2" },
};

const STATUS_LABELS: Record<string, string> = {
  draft:            "Черновик",
  awaiting_offers:  "Ожидает предложений",
  choosing_offer:   "Выбор предложения",
  awaiting_payment: "Ожидает оплаты",
  paid:             "Оплачено",
  completed:        "Завершено",
  cancelled:        "Отменено",
  expired:          "Истёк срок",
  active:           "Активно",
  withdrawn:        "Отозвано",
  selected:         "Выбрано",
  rejected:         "Отклонено",
};

export default function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || { color: "#374151", bg: "#e5e7eb" };
  const text = label || STATUS_LABELS[status] || status;
  const padding = size === "sm" ? "2px 8px" : "3px 10px";
  const fontSize = size === "sm" ? "0.72rem" : "0.78rem";
  return (
    <span style={{
      display: "inline-block", padding, borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}
