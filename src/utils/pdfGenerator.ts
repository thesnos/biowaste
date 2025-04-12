import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Payment {
  type: string;
  amount: number;
  status: string;
  description?: string;
  requestedBy: {
    name: string;
  };
  receivedBy?: {
    name: string;
  };
  createdAt: string;
}

export const generatePaymentStatement = (payments: Payment[], startDate: string, endDate: string) => {
  // Create PDF with better quality settings
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Add custom font
  doc.setFont("helvetica", "bold");

  // Add company name and logo
  doc.setFontSize(24);
  doc.setTextColor(46, 125, 50); // Green color
  doc.text('Biowaste Solutions', 14, 20);

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33); // Dark gray
  doc.text('Payment Statement', 14, 35);

  // Add date range with better formatting
  doc.setFontSize(12);
  doc.setTextColor(75, 75, 75); // Medium gray
  doc.text(`Statement Period: ${format(new Date(startDate), 'dd MMMM yyyy')} - ${format(new Date(endDate), 'dd MMMM yyyy')}`, 14, 45);

  // Calculate totals
  const totals = payments.reduce((acc, payment) => {
    if (payment.status === 'completed') {
      if (payment.type === 'deposit') {
        acc.totalDeposits += payment.amount;
      } else if (payment.type === 'withdrawal') {
        acc.totalWithdrawals += payment.amount;
      }
    }
    return acc;
  }, { totalDeposits: 0, totalWithdrawals: 0 });

  // Add summary with better styling
  doc.setFontSize(12);
  doc.setTextColor(46, 125, 50); // Green for positive values
  doc.text(`Total Deposits: ₹${totals.totalDeposits.toFixed(2)}`, 14, 55);
  doc.setTextColor(211, 47, 47); // Red for negative values
  doc.text(`Total Withdrawals: ₹${totals.totalWithdrawals.toFixed(2)}`, 14, 63);
  doc.setTextColor(33, 33, 33); // Dark gray for net
  doc.text(`Net Movement: ₹${(totals.totalDeposits - totals.totalWithdrawals).toFixed(2)}`, 14, 71);

  // Add table with improved styling
  const tableData = payments.map(payment => [
    format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm'),
    payment.type.charAt(0).toUpperCase() + payment.type.slice(1),
    `₹${payment.amount.toFixed(2)}`,
    payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
    payment.requestedBy.name,
    payment.receivedBy?.name || '-',
    payment.description || '-'
  ]);

  autoTable(doc, {
    head: [['Date', 'Type', 'Amount', 'Status', 'Requested By', 'Received By', 'Description']],
    body: tableData,
    startY: 80,
    styles: {
      fontSize: 10,
      font: 'helvetica',
      lineColor: [237, 237, 237],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: [255, 255, 255],
      fontSize: 11,
      font: 'helvetica',
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [33, 33, 33],
      lineColor: [237, 237, 237],
      lineWidth: 0.5
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249]
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
      6: { cellWidth: 'auto' }
    },
    margin: { top: 80 }
  });

  // Add footer with better formatting
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128); // Light gray for footer
    doc.text(
      `Generated on ${format(new Date(), 'dd MMMM yyyy HH:mm')}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 25,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  return doc;
};