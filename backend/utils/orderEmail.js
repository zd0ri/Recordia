const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const money = (value) => `₱${Number(value || 0).toFixed(2)}`;

const createOrderEmail = (order) => {
    const rows = (order.orderItems || []).map((item) => `
        <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.quantity)}</td>
            <td>${money(item.price)}</td>
            <td>${money(item.price * item.quantity)}</td>
        </tr>
    `).join('');

    return `
      <div style="margin:0;background:#f3e8c8;padding:32px 12px;color:#3a2118;font-family:Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#fff9e9;border:3px solid #542d2d;box-shadow:8px 8px 0 #d69a2d;">
          <div style="background:#542d2d;color:#fff8e8;padding:28px 30px;text-align:center;">
            <div style="color:#f3bd3b;font:700 12px Courier New,monospace;letter-spacing:3px;">RECORDIA / SALES SLIP</div>
            <h1 style="margin:10px 0 4px;font:700 38px Georgia,serif;letter-spacing:-1px;">Order update</h1>
            <p style="margin:0;color:#f6dfb1;font:13px Courier New,monospace;">Your records are moving through the shop.</p>
          </div>
          <div style="padding:22px 30px;">
            <div style="display:inline-block;border:2px solid #9a4c2f;border-radius:50%;padding:13px 9px;color:#9a4c2f;font:700 11px Courier New,monospace;text-align:center;transform:rotate(-8deg);">STATUS<br>${escapeHtml(order.orderStatus).toUpperCase()}</div>
            <p style="font:14px Courier New,monospace;line-height:1.6;">Order <strong>${escapeHtml(order._id)}</strong> has been updated.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;font:13px Courier New,monospace;">
              <thead><tr style="background:#e8d9ae;color:#542d2d;"><th style="padding:11px;text-align:left;">Record</th><th style="padding:11px;text-align:right;">Qty</th><th style="padding:11px;text-align:right;">Price</th><th style="padding:11px;text-align:right;">Subtotal</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="border-top:2px solid #542d2d;padding-top:14px;font:13px Courier New,monospace;">
              <p style="margin:7px 0;">Items total: <strong style="float:right;">${money(order.itemsPrice)}</strong></p>
              <p style="margin:7px 0;">Tax: <strong style="float:right;">${money(order.taxPrice)}</strong></p>
              <p style="margin:7px 0;">Shipping: <strong style="float:right;">${money(order.shippingPrice)}</strong></p>
              <p style="margin:16px 0 0;border-top:2px dashed #d69a2d;padding-top:14px;font-size:18px;color:#9a4c2f;">TOTAL <strong style="float:right;">${money(order.totalPrice)}</strong></p>
            </div>
            <div style="margin-top:22px;background:#f3bd3b;padding:13px 15px;font:12px Courier New,monospace;">
              Payment: <strong>${escapeHtml(order.paymentInfo?.method || 'N/A')}</strong>
            </div>
          </div>
          <div style="background:#2c1710;color:#f6dfb1;padding:14px;text-align:center;font:11px Courier New,monospace;letter-spacing:1px;">THANK YOU FOR KEEPING THE MUSIC SPINNING</div>
        </div>
      </div>
    `;
};

module.exports = createOrderEmail;
