const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

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
        <h2>Recordia order update</h2>
        <p>Order <strong>${escapeHtml(order._id)}</strong> is now <strong>${escapeHtml(order.orderStatus)}</strong>.</p>
        <table border="1" cellpadding="6" cellspacing="0">
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <p>Items total: ${money(order.itemsPrice)}</p>
        <p>Tax: ${money(order.taxPrice)}</p>
        <p>Shipping: ${money(order.shippingPrice)}</p>
        <p><strong>Grand total: ${money(order.totalPrice)}</strong></p>
        <p>Payment method: ${escapeHtml(order.paymentInfo?.method || 'N/A')}</p>
        <p>Status: ${escapeHtml(order.orderStatus)}</p>
    `;
};

module.exports = createOrderEmail;
