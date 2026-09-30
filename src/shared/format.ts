const moneyFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string | null | undefined = "ARS"
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "Sin monto";
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return "Sin monto";
  }

  const prefix = currency === "USD" ? "USD" : "$";
  return `${prefix} ${moneyFormatter.format(numericAmount)}`;
}

export function formatDisplayDate(
  value: string | null | undefined,
  emptyLabel = "Sin fecha"
): string {
  if (!value) {
    return emptyLabel;
  }

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (isoDate) {
    return `${isoDate[3]}-${isoDate[2]}-${isoDate[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());

  return `${day}-${month}-${year}`;
}

export function formatDisplayDateTime(
  value: string | null | undefined,
  emptyLabel = "Sin fecha"
): string {
  if (!value) {
    return emptyLabel;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatDisplayDate(value, emptyLabel);
  }

  const datePart = formatDisplayDate(value, emptyLabel);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${datePart} ${hours}:${minutes}`;
}
