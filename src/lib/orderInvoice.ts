import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

export type InvoiceLabels = {
  invoiceTitle: string;
  invoiceNo: string;
  createdAt: string;
  customer: string;
  phone: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  product: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  subtotal: string;
  shippingFee: string;
  shippingDiscount: string;
  couponDiscount: string;
  vatIncluded: string;
  total: string;
  note: string;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export function getOrderInvoiceValues(order: Order) {
  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const subtotal = Number(order.subtotal ?? itemsSubtotal);
  const shippingFee = Number(order.shippingFee ?? 0);
  const shippingDiscount = Number(order.shippingDiscount ?? 0);
  const couponDiscount = Number(order.couponDiscount ?? 0);

  // Product prices are treated as VAT-inclusive, so VAT is informational and
  // does not change the historical order total.
  const vatIncluded = Math.round(itemsSubtotal * (10 / 110));

  return {
    itemsSubtotal,
    subtotal,
    shippingFee,
    shippingDiscount,
    couponDiscount,
    vatIncluded,
    total: Number(order.totalAmount || 0),
  };
}

export function buildOrderInvoiceHtml(
  order: Order,
  labels: InvoiceLabels,
  locale: string,
) {
  const values = getOrderInvoiceValues(order);
  const address = [
    order.shippingAddress.detailAddress,
    order.shippingAddress.ward,
    order.shippingAddress.district,
    order.shippingAddress.province,
  ]
    .filter(Boolean)
    .join(", ");
  const createdAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td class="num">${escapeHtml(item.quantity)}</td>
          <td class="num">${escapeHtml(formatPrice(item.price))}</td>
          <td class="num">${escapeHtml(formatPrice(item.price * item.quantity))}</td>
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.invoiceTitle)} #${escapeHtml(order._id.slice(-8).toUpperCase())}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #f59e0b; padding-bottom: 16px; }
    .brand { font-size: 28px; font-weight: 800; }
    .brand span { color: #f59e0b; }
    .muted { color: #6b7280; font-size: 13px; }
    .section { margin-top: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; }
    th { background: #fffbeb; font-size: 13px; }
    .num { text-align: right; white-space: nowrap; }
    .summary { width: 360px; margin-left: auto; margin-top: 20px; }
    .summary-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f3f4f6; }
    .total { font-size: 20px; font-weight: 800; color: #d97706; }
    .note { margin-top: 20px; padding: 12px; background: #f9fafb; border-radius: 10px; color: #4b5563; font-size: 13px; }
    @media print { body { margin: 18px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Paw<span>Mart</span></div>
      <div class="muted">${escapeHtml(labels.invoiceTitle)}</div>
    </div>
    <div>
      <strong>${escapeHtml(labels.invoiceNo)}:</strong> #${escapeHtml(order._id.slice(-8).toUpperCase())}<br />
      <span class="muted">${escapeHtml(labels.createdAt)}: ${escapeHtml(createdAt)}</span>
    </div>
  </div>

  <div class="section grid">
    <div>
      <strong>${escapeHtml(labels.customer)}</strong><br />
      ${escapeHtml(order.shippingAddress.fullName)}<br />
      ${escapeHtml(labels.phone)}: ${escapeHtml(order.shippingAddress.phone)}<br />
      ${escapeHtml(labels.address)}: ${escapeHtml(address)}
    </div>
    <div>
      <strong>${escapeHtml(labels.paymentMethod)}</strong>: ${escapeHtml(order.paymentMethod)}<br />
      <strong>${escapeHtml(labels.paymentStatus)}</strong>: ${escapeHtml(order.paymentStatus)}
    </div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(labels.product)}</th>
          <th class="num">${escapeHtml(labels.quantity)}</th>
          <th class="num">${escapeHtml(labels.unitPrice)}</th>
          <th class="num">${escapeHtml(labels.lineTotal)}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="summary">
    <div class="summary-row"><span>${escapeHtml(labels.subtotal)}</span><strong>${escapeHtml(formatPrice(values.subtotal))}</strong></div>
    <div class="summary-row"><span>${escapeHtml(labels.shippingFee)}</span><strong>${escapeHtml(formatPrice(values.shippingFee))}</strong></div>
    <div class="summary-row"><span>${escapeHtml(labels.shippingDiscount)}</span><strong>-${escapeHtml(formatPrice(values.shippingDiscount))}</strong></div>
    <div class="summary-row"><span>${escapeHtml(labels.couponDiscount)}</span><strong>-${escapeHtml(formatPrice(values.couponDiscount))}</strong></div>
    <div class="summary-row"><span>${escapeHtml(labels.vatIncluded)}</span><strong>${escapeHtml(formatPrice(values.vatIncluded))}</strong></div>
    <div class="summary-row total"><span>${escapeHtml(labels.total)}</span><span>${escapeHtml(formatPrice(values.total))}</span></div>
  </div>

  <div class="note">${escapeHtml(labels.note)}</div>
</body>
</html>`;
}

export function printOrderInvoice(
  order: Order,
  labels: InvoiceLabels,
  locale: string,
) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return false;
  win.document.open();
  win.document.write(buildOrderInvoiceHtml(order, labels, locale));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
  return true;
}

export function downloadOrderInvoice(
  order: Order,
  labels: InvoiceLabels,
  locale: string,
) {
  const html = buildOrderInvoiceHtml(order, labels, locale);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pawmart-invoice-${order._id.slice(-8).toUpperCase()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
