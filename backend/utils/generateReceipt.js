const PDFDocument = require('pdfkit');

const money = (value) => `PHP ${Number(value || 0).toFixed(2)}`;
const safe = (value) => String(value ?? '');

const generateReceipt = (order) => new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    const pageWidth = document.page.width;
    const pageHeight = document.page.height;
    const margin = 48;
    const contentWidth = pageWidth - (margin * 2);
    const colors = {
        paper: '#fff8e8',
        cream: '#f3dfb5',
        brown: '#542d2d',
        dark: '#2c1710',
        orange: '#d94b2b',
        gold: '#f3bd3b',
        olive: '#71804c',
        ink: '#684a39',
        line: '#d9c995'
    };

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.rect(0, 0, pageWidth, pageHeight).fill(colors.paper);
    document.rect(0, 0, pageWidth, 154).fill(colors.brown);
    document.circle(pageWidth - 84, 75, 35).lineWidth(2).stroke(colors.gold);
    document.fillColor(colors.gold).font('Helvetica-Bold').fontSize(10)
        .text('RECORDIA', pageWidth - 118, 67, { width: 68, align: 'center' });
    document.fillColor(colors.paper).font('Helvetica-Bold').fontSize(30)
        .text('RECORDIA', margin, 38);
    document.fillColor(colors.gold).font('Helvetica').fontSize(9)
        .text('VINTAGE SALES SLIP / KEEP THE MUSIC SPINNING', margin, 83);
    document.fillColor(colors.paper).font('Helvetica').fontSize(9)
        .text('CUSTOMER RECEIPT', margin, 116);

    document.roundedRect(margin, 176, contentWidth, 76, 4).fill(colors.cream);
    document.fillColor(colors.brown).font('Helvetica-Bold').fontSize(12)
        .text('ORDER RECEIVED', margin + 18, 191);
    document.fillColor(colors.ink).font('Courier').fontSize(9)
        .text(`Order ID: ${safe(order._id)}`, margin + 18, 213)
        .text(`Date: ${new Date(order.createdAt || 0).toLocaleString()}`, margin + 18, 228);
    document.fillColor(colors.orange).font('Helvetica-Bold').fontSize(10)
        .text(safe(order.orderStatus).toUpperCase(), pageWidth - margin - 118, 208, {
            width: 100,
            align: 'center'
        });
    document.roundedRect(pageWidth - margin - 118, 199, 100, 30, 15).lineWidth(2).stroke(colors.orange);

    let y = 282;
    document.fillColor(colors.brown).font('Helvetica-Bold').fontSize(13)
        .text('PURCHASED RECORDS', margin, y);
    y += 24;
    document.rect(margin, y, contentWidth, 28).fill(colors.dark);
    document.fillColor(colors.gold).font('Helvetica-Bold').fontSize(9)
        .text('RECORD', margin + 12, y + 9)
        .text('QTY', margin + 310, y + 9)
        .text('PRICE', margin + 360, y + 9)
        .text('SUBTOTAL', margin + 430, y + 9);
    y += 28;

    for (const [index, item] of (order.orderItems || []).entries()) {
        const rowHeight = 35;
        document.rect(margin, y, contentWidth, rowHeight)
            .fill(index % 2 === 0 ? '#fff8e8' : '#f8efd9');
        document.fillColor(colors.brown).font('Helvetica').fontSize(9)
            .text(safe(item.name), margin + 12, y + 12, { width: 280, ellipsis: true })
            .text(String(item.quantity), margin + 310, y + 12, { width: 35, align: 'right' })
            .text(money(item.price), margin + 360, y + 12, { width: 60, align: 'right' })
            .text(money(item.price * item.quantity), margin + 430, y + 12, { width: 68, align: 'right' });
        document.moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight)
            .lineWidth(.5).stroke(colors.line);
        y += rowHeight;
    }

    y += 26;
    const summaryX = pageWidth - margin - 235;
    document.roundedRect(summaryX, y, 235, 132, 4).fill(colors.cream);
    document.fillColor(colors.ink).font('Courier').fontSize(9)
        .text('Items total', summaryX + 16, y + 18)
        .text(money(order.itemsPrice), summaryX + 115, y + 18, { width: 102, align: 'right' })
        .text('Tax', summaryX + 16, y + 40)
        .text(money(order.taxPrice), summaryX + 115, y + 40, { width: 102, align: 'right' })
        .text('Shipping', summaryX + 16, y + 62)
        .text(money(order.shippingPrice), summaryX + 115, y + 62, { width: 102, align: 'right' });
    document.moveTo(summaryX + 16, y + 84).lineTo(summaryX + 219, y + 84)
        .lineWidth(1.5).stroke(colors.brown);
    document.fillColor(colors.orange).font('Helvetica-Bold').fontSize(12)
        .text('TOTAL PAID', summaryX + 16, y + 99)
        .text(money(order.totalPrice), summaryX + 115, y + 99, { width: 102, align: 'right' });

    y += 160;
    const blockWidth = (contentWidth - 14) / 2;
    document.roundedRect(margin, y, blockWidth, 78, 4).fill('#e8d9ae');
    document.roundedRect(margin + blockWidth + 14, y, blockWidth, 78, 4).fill('#f3bd3b');
    document.fillColor(colors.brown).font('Helvetica-Bold').fontSize(9)
        .text('PAYMENT METHOD', margin + 14, y + 14)
        .text('DELIVERY ADDRESS', margin + blockWidth + 28, y + 14);
    document.fillColor(colors.ink).font('Courier').fontSize(9)
        .text(safe(order.paymentInfo?.method || 'N/A'), margin + 14, y + 36)
        .text(`${safe(order.shippingInfo?.address)}, ${safe(order.shippingInfo?.city)}`, margin + blockWidth + 28, y + 36, { width: blockWidth - 42 });

    document.rect(0, pageHeight - 48, pageWidth, 48).fill(colors.dark);
    document.fillColor(colors.cream).font('Courier').fontSize(9)
        .text('THANK YOU FOR KEEPING THE MUSIC SPINNING  /  RECORDIA', 0, pageHeight - 30, {
            width: pageWidth,
            align: 'center'
        });
    document.end();
});

module.exports = generateReceipt;
