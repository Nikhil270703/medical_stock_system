const PDFDocument = require('pdfkit');

exports.generateBillPDF = (bill, res) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Header Details
  doc.fillColor('#0f172a').fontSize(22).text('TAX INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#64748b').text('Original Copy', { align: 'right' });
  doc.moveDown(2);

  // Bill From & Bill To columns
  const initialY = doc.y;
  doc.fillColor('#0f172a').fontSize(12).text('Billed To:', 50, initialY);
  doc.fontSize(10).fillColor('#334155');
  doc.text(bill.customer.name, 50, initialY + 15);
  doc.text(`Mobile: ${bill.customer.mobile}`, 50, initialY + 30);
  doc.text(`Address: ${bill.customer.address}`, 50, initialY + 45, { width: 220 });
  if (bill.customer.gstNumber) {
    doc.text(`GSTIN: ${bill.customer.gstNumber}`, 50, initialY + 75);
  }

  // Invoice Meta
  doc.fillColor('#0f172a').fontSize(12).text('Invoice Details:', 320, initialY);
  doc.fontSize(10).fillColor('#334155');
  doc.text(`Invoice No: ${bill.invoiceNumber}`, 320, initialY + 15);
  doc.text(`Invoice Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 320, initialY + 30);
  doc.text(`Payment Status: ${bill.status}`, 320, initialY + 45);

  doc.moveDown(4);

  // Table Columns Headers
  let tableY = doc.y + 40;
  doc.fillColor('#475569').fontSize(10);
  doc.text('Item Description', 50, tableY);
  doc.text('Price (Rs.)', 240, tableY, { width: 70, align: 'right' });
  doc.text('Qty', 320, tableY, { width: 40, align: 'right' });
  doc.text('GST Rate', 370, tableY, { width: 60, align: 'right' });
  doc.text('Amount (Rs.)', 440, tableY, { width: 100, align: 'right' });

  // Border line under header
  doc.moveTo(50, tableY + 15).lineTo(540, tableY + 15).strokeColor('#cbd5e1').lineWidth(1).stroke();

  let itemY = tableY + 25;
  doc.fillColor('#0f172a');
  bill.items.forEach(item => {
    doc.text(item.product.name, 50, itemY, { width: 180 });
    doc.text(item.price.toFixed(2), 240, itemY, { width: 70, align: 'right' });
    doc.text(`${item.quantity} ${item.product.unit || 'pcs'}`, 320, itemY, { width: 40, align: 'right' });
    
    const taxRate = item.cgst + item.sgst + item.igst;
    doc.text(`${taxRate}%`, 370, itemY, { width: 60, align: 'right' });
    
    const lineTotal = item.price * item.quantity;
    doc.text(lineTotal.toFixed(2), 440, itemY, { width: 100, align: 'right' });
    
    itemY += 20;
  });

  // Border line under items
  doc.moveTo(50, itemY).lineTo(540, itemY).strokeColor('#cbd5e1').stroke();

  // Summary figures
  let summaryY = itemY + 15;
  doc.fillColor('#475569');
  doc.text('Subtotal:', 320, summaryY, { width: 110, align: 'right' });
  doc.fillColor('#0f172a').text(bill.subtotal.toFixed(2), 440, summaryY, { width: 100, align: 'right' });

  if (bill.cgstTotal > 0) {
    summaryY += 15;
    doc.fillColor('#475569').text('CGST:', 320, summaryY, { width: 110, align: 'right' });
    doc.fillColor('#0f172a').text(bill.cgstTotal.toFixed(2), 440, summaryY, { width: 100, align: 'right' });
  }

  if (bill.sgstTotal > 0) {
    summaryY += 15;
    doc.fillColor('#475569').text('SGST:', 320, summaryY, { width: 110, align: 'right' });
    doc.fillColor('#0f172a').text(bill.sgstTotal.toFixed(2), 440, summaryY, { width: 100, align: 'right' });
  }

  if (bill.igstTotal > 0) {
    summaryY += 15;
    doc.fillColor('#475569').text('IGST:', 320, summaryY, { width: 110, align: 'right' });
    doc.fillColor('#0f172a').text(bill.igstTotal.toFixed(2), 440, summaryY, { width: 100, align: 'right' });
  }

  summaryY += 20;
  doc.moveTo(320, summaryY - 5).lineTo(540, summaryY - 5).strokeColor('#94a3b8').stroke();
  doc.fillColor('#0f172a').fontSize(12);
  doc.text('Grand Total:', 320, summaryY, { width: 110, align: 'right' });
  doc.text(`Rs. ${bill.totalAmount.toFixed(2)}`, 440, summaryY, { width: 100, align: 'right' });

  doc.end();
};

exports.generateQuotationPDF = (quotation, res) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Header Details
  doc.fillColor('#0369a1').fontSize(22).text('QUOTATION', { align: 'right' });
  doc.fontSize(10).fillColor('#64748b').text('Estimates Only', { align: 'right' });
  doc.moveDown(2);

  // columns
  const initialY = doc.y;
  doc.fillColor('#0f172a').fontSize(12).text('Prepared For:', 50, initialY);
  doc.fontSize(10).fillColor('#334155');
  doc.text(quotation.customer.name, 50, initialY + 15);
  doc.text(`Mobile: ${quotation.customer.mobile}`, 50, initialY + 30);
  doc.text(`Address: ${quotation.customer.address}`, 50, initialY + 45, { width: 220 });

  // Quotation Meta
  doc.fillColor('#0f172a').fontSize(12).text('Quotation Details:', 320, initialY);
  doc.fontSize(10).fillColor('#334155');
  doc.text(`Quotation ID: Q-${quotation._id.toString().substring(18).toUpperCase()}`, 320, initialY + 15);
  doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, 320, initialY + 30);
  doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`, 320, initialY + 45);

  doc.moveDown(4);

  // Table Columns Headers
  let tableY = doc.y + 40;
  doc.fillColor('#475569').fontSize(10);
  doc.text('Item Description', 50, tableY);
  doc.text('Unit Price (Rs.)', 260, tableY, { width: 80, align: 'right' });
  doc.text('Quantity', 350, tableY, { width: 70, align: 'right' });
  doc.text('Subtotal (Rs.)', 440, tableY, { width: 100, align: 'right' });

  // Border line under header
  doc.moveTo(50, tableY + 15).lineTo(540, tableY + 15).strokeColor('#cbd5e1').lineWidth(1).stroke();

  let itemY = tableY + 25;
  doc.fillColor('#0f172a');
  quotation.items.forEach(item => {
    doc.text(item.product.name, 50, itemY, { width: 200 });
    doc.text(item.price.toFixed(2), 260, itemY, { width: 80, align: 'right' });
    doc.text(`${item.quantity} ${item.product.unit || 'pcs'}`, 350, itemY, { width: 70, align: 'right' });
    
    const lineTotal = item.price * item.quantity;
    doc.text(lineTotal.toFixed(2), 440, itemY, { width: 100, align: 'right' });
    
    itemY += 20;
  });

  // Border line under items
  doc.moveTo(50, itemY).lineTo(540, itemY).strokeColor('#cbd5e1').stroke();

  // Summary figures
  let summaryY = itemY + 15;
  doc.fillColor('#0f172a').fontSize(12);
  doc.text('Estimated Total:', 300, summaryY, { width: 130, align: 'right' });
  doc.text(`Rs. ${quotation.totalAmount.toFixed(2)}`, 440, summaryY, { width: 100, align: 'right' });

  doc.end();
};

exports.generateCustomerStatementPDF = (customer, ledger, res) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fillColor('#0f172a').fontSize(20).text('CUSTOMER ACCOUNT STATEMENT', { align: 'center' });
  doc.moveDown(1.5);

  const initialY = doc.y;
  doc.fontSize(12).fillColor('#0f172a').text('Customer Details:', 50, initialY);
  doc.fontSize(10).fillColor('#334155');
  doc.text(customer.name, 50, initialY + 15);
  doc.text(`Mobile: ${customer.mobile}`, 50, initialY + 30);
  doc.text(`Address: ${customer.address}`, 50, initialY + 45, { width: 250 });

  const outstanding = ledger.length > 0 ? ledger[ledger.length - 1].runningBalance : 0;
  doc.fontSize(12).fillColor('#0f172a').text('Account Balance:', 350, initialY);
  doc.fontSize(18).fillColor('#b91c1c').text(`Rs. ${outstanding.toFixed(2)}`, 350, initialY + 15);
  doc.fontSize(10).fillColor('#64748b').text('Net Outstanding Dues', 350, initialY + 35);

  doc.moveDown(4.5);

  let tableY = doc.y + 40;
  doc.fillColor('#475569').fontSize(10);
  doc.text('Date', 50, tableY);
  doc.text('Transaction Details', 125, tableY);
  doc.text('Ref Number', 230, tableY);
  doc.text('Debit (+)', 310, tableY, { width: 70, align: 'right' });
  doc.text('Credit (-)', 380, tableY, { width: 70, align: 'right' });
  doc.text('Balance', 460, tableY, { width: 80, align: 'right' });

  doc.moveTo(50, tableY + 15).lineTo(540, tableY + 15).strokeColor('#cbd5e1').lineWidth(1).stroke();

  let itemY = tableY + 25;
  doc.fillColor('#0f172a');
  ledger.forEach(item => {
    doc.text(new Date(item.date).toLocaleDateString(), 50, itemY);
    doc.text(item.type, 125, itemY);
    doc.text(item.ref, 230, itemY, { width: 75, overflow: 'ellipsis' });
    doc.text(item.debit > 0 ? item.debit.toFixed(2) : '-', 310, itemY, { width: 70, align: 'right' });
    doc.text(item.credit > 0 ? item.credit.toFixed(2) : '-', 380, itemY, { width: 70, align: 'right' });
    doc.text(item.runningBalance.toFixed(2), 460, itemY, { width: 80, align: 'right' });
    
    itemY += 20;
    
    if (itemY > 700) {
      doc.addPage();
      itemY = 50;
      doc.fillColor('#475569').fontSize(10);
      doc.text('Date', 50, itemY);
      doc.text('Transaction Details', 125, itemY);
      doc.text('Ref Number', 230, itemY);
      doc.text('Debit (+)', 310, itemY, { width: 70, align: 'right' });
      doc.text('Credit (-)', 380, itemY, { width: 70, align: 'right' });
      doc.text('Balance', 460, itemY, { width: 80, align: 'right' });
      doc.moveTo(50, itemY + 15).lineTo(540, itemY + 15).strokeColor('#cbd5e1').stroke();
      itemY += 25;
      doc.fillColor('#0f172a');
    }
  });

  doc.end();
};

