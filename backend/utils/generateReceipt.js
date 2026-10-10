const PDFDocument = require('pdfkit');

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const generateReceipt = (order) => new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 50 });
    const chunks = [];

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.fontSize(24).text('Recordia', { align: 'center' });
    document.moveDown();
    document.fontSize(11).text(`Order ID: ${order._id}`);
    document.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}`);
    document.text(`Customer: ${order.user?.name || 'Customer'}`);
    document.moveDown();

    document.fontSize(13).text('Items', { underline: true });
    document.moveDown(0.5);
    document.fontSize(10);
    document.text('Product', 50, document.y, { continued: true, width: 220 });
    document.text('Qty', 270, document.y, { continued: true, width: 45 });
    document.text('Price', 315, document.y, { continued: true, width: 80 });
    document.text('Subtotal', 395, document.y);
    document.moveDown(0.5);

    for (const item of order.orderItems || []) {
        const y = document.y;
        document.text(String(item.name || ''), 50, y, { width: 220 });
        document.text(String(item.quantity), 270, y, { width: 45 });
        document.text(money(item.price), 315, y, { width: 80 });
        document.text(money(item.price * item.quantity), 395, y, { width: 100 });
        document.moveDown(0.5);
    }

    document.moveDown();
    document.text(`Items total: ${money(order.itemsPrice)}`);
    document.text(`Tax: ${money(order.taxPrice)}`);
    document.text(`Shipping: ${money(order.shippingPrice)}`);
    document.fontSize(14).text(`GRAND TOTAL: ${money(order.totalPrice)}`);
    document.moveDown();
    document.fontSize(11).text(`Payment method: ${order.paymentInfo?.method || 'N/A'}`);
    document.text(`Status: ${order.orderStatus}`);
    document.end();
});

module.exports = generateReceipt;
