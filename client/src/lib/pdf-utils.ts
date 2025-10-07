import jsPDF from "jspdf";
import type { Transaction, DailySummary, WeeklySummary, MonthlySummary } from "@shared/schema";

// Brand colors (from the design)
const COLORS = {
  primary: [255, 102, 51], // Orange
  secondary: [26, 26, 26], // Black
  white: [255, 255, 255],
  gray: [128, 128, 128],
  lightGray: [245, 245, 245]
};

// Helper function to add header to PDF
const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  // Orange header background
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, 210, 45, 'F');
  
  // White text on orange background
  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text('Chai-Fi', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text('Modern Billing Solution', 20, 35);
  
  // Title on the right
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, 190 - titleWidth, 25);
  
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, 190 - subtitleWidth, 32);
  }
  
  // Reset text color to black
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
};

// Helper function to add footer
const addFooter = (doc: jsPDF, yPosition: number) => {
  const pageHeight = doc.internal.pageSize.height;
  const footerY = Math.max(yPosition + 20, pageHeight - 30);
  
  // Light gray line
  doc.setDrawColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
  doc.line(20, footerY - 10, 190, footerY - 10);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  doc.text('Thank you for choosing Chai-Fi!', 20, footerY);
  doc.text('For support, contact us at support@chai-fi.com', 20, footerY + 6);
  
  // Add timestamp
  const timestamp = new Date().toLocaleString();
  const timestampWidth = doc.getTextWidth(`Generated on: ${timestamp}`);
  doc.text(`Generated on: ${timestamp}`, 190 - timestampWidth, footerY + 6);
};

// Helper function to format currency
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `Rs. ${num.toFixed(2)}`;
};

export const generateInvoicePDF = async (transaction: Transaction) => {
  const doc = new jsPDF();
  
  // Header
  addHeader(doc, `Invoice #${transaction.id.slice(-8).toUpperCase()}`);
  
  let yPos = 60;
  
  // Bill Details Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('Bill Details', 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  yPos += 10;
  
  const billDetails = [
    ['Date:', transaction.date],
    ['Day:', transaction.dayName],
    ['Time:', transaction.time],
    ['Biller:', transaction.billerName],
  ];
  
  billDetails.forEach(([label, value]) => {
    doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    doc.text(label, 20, yPos);
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.text(value, 60, yPos);
    yPos += 7;
  });
  
  // Payment Details Section
  yPos = 70; // Reset to align with bill details
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text('Payment Details', 120, yPos);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  yPos += 10;
  
  const paymentDetails = [
    ['Method:', transaction.paymentMethod === 'gpay' ? 'Google Pay' : 'Cash'],
    ['Status:', 'Paid'],
    ['Transaction ID:', transaction.id.slice(-12).toUpperCase()],
  ];
  
  paymentDetails.forEach(([label, value]) => {
    doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    doc.text(label, 120, yPos);
    doc.setTextColor(value === 'Paid' ? [34, 197, 94] : COLORS.secondary);
    doc.text(value, 160, yPos);
    yPos += 7;
  });
  
  // Items Section
  yPos = 120;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('Items Ordered', 20, yPos);
  yPos += 15;
  
  // Table header
  doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
  doc.rect(20, yPos - 5, 170, 10, 'F');
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text('Item', 25, yPos);
  doc.text('Qty', 120, yPos);
  doc.text('Price', 140, yPos);
  doc.text('Total', 165, yPos);
  yPos += 10;
  
  // Items
  const items = Array.isArray(transaction.items) ? transaction.items : [];
  doc.setFont("helvetica", "normal");
  
  items.forEach((item: any) => {
    const itemTotal = parseFloat(item.price) * item.quantity;
    
    doc.text(item.name, 25, yPos);
    doc.text(item.quantity.toString(), 125, yPos);
    doc.text(formatCurrency(item.price), 140, yPos);
    doc.text(formatCurrency(itemTotal), 165, yPos);
    yPos += 8;
  });
  
  // Total Section
  yPos += 10;
  doc.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  doc.line(20, yPos, 190, yPos);
  yPos += 15;
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text('Total Amount:', 20, yPos);
  
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  const totalWidth = doc.getTextWidth(formatCurrency(transaction.totalAmount));
  doc.text(formatCurrency(transaction.totalAmount), 190 - totalWidth, yPos);
  
  // Footer
  addFooter(doc, yPos);
  
  // Save the PDF
  doc.save(`chai-fi-invoice-${transaction.id.slice(-8)}.pdf`);
};

export const generateDailySummaryPDF = async (summary: DailySummary, transactions: Transaction[]) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Daily Summary', summary.date);
  
  let yPos = 65;
  
  // Summary Overview
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text(`Daily Summary - ${summary.date}`, 20, yPos);
  yPos += 20;
  
  // Summary Cards
  const summaryData = [
    ['Total Sales', formatCurrency(summary.totalAmount), COLORS.primary],
    ['GPay Payments', formatCurrency(summary.gpayAmount), [34, 197, 94]],
    ['Cash Payments', formatCurrency(summary.cashAmount), [107, 114, 128]],
    ['Total Orders', summary.orderCount.toString(), [59, 130, 246]],
  ];
  
  summaryData.forEach(([label, value, color], index) => {
    const xPos = 20 + (index % 2) * 85;
    const yOffset = Math.floor(index / 2) * 30;
    
    // Card background
    doc.setFillColor(color[0], color[1], color[2], 0.1);
    doc.rect(xPos, yPos + yOffset - 5, 80, 25, 'F');
    
    // Border
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.rect(xPos, yPos + yOffset - 5, 80, 25);
    
    // Label
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    doc.text(label, xPos + 5, yPos + yOffset + 2);
    
    // Value
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, xPos + 5, yPos + yOffset + 12);
  });
  
  yPos += 70;
  
  // Payment Breakdown
  if (summary.gpayAmount !== '0.00' || summary.cashAmount !== '0.00') {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.text('Payment Method Breakdown', 20, yPos);
    yPos += 15;
    
    const totalAmount = parseFloat(summary.totalAmount);
    const gpayPercent = totalAmount > 0 ? ((parseFloat(summary.gpayAmount) / totalAmount) * 100).toFixed(1) : '0.0';
    const cashPercent = totalAmount > 0 ? ((parseFloat(summary.cashAmount) / totalAmount) * 100).toFixed(1) : '0.0';
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`GPay: ${formatCurrency(summary.gpayAmount)} (${gpayPercent}%)`, 20, yPos);
    doc.text(`Cash: ${formatCurrency(summary.cashAmount)} (${cashPercent}%)`, 20, yPos + 10);
    yPos += 25;
  }
  
  addFooter(doc, yPos);
  
  doc.save(`chai-fi-daily-summary-${summary.date}.pdf`);
};

export const generateWeeklySummaryPDF = async (summary: WeeklySummary, transactions: Transaction[]) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Weekly Summary', `${summary.weekStart} to ${summary.weekEnd}`);
  
  let yPos = 65;
  
  // Summary Overview
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text(`Weekly Summary - ${summary.weekStart} to ${summary.weekEnd}`, 20, yPos);
  yPos += 20;
  
  // Summary Cards (same as daily but with weekly data)
  const summaryData = [
    ['Total Sales', formatCurrency(summary.totalAmount), COLORS.primary],
    ['GPay Payments', formatCurrency(summary.gpayAmount), [34, 197, 94]],
    ['Cash Payments', formatCurrency(summary.cashAmount), [107, 114, 128]],
    ['Total Orders', summary.orderCount.toString(), [59, 130, 246]],
  ];
  
  summaryData.forEach(([label, value, color], index) => {
    const xPos = 20 + (index % 2) * 85;
    const yOffset = Math.floor(index / 2) * 30;
    
    // Card background
    doc.setFillColor(color[0], color[1], color[2], 0.1);
    doc.rect(xPos, yPos + yOffset - 5, 80, 25, 'F');
    
    // Border
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.rect(xPos, yPos + yOffset - 5, 80, 25);
    
    // Label
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    doc.text(label, xPos + 5, yPos + yOffset + 2);
    
    // Value
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, xPos + 5, yPos + yOffset + 12);
  });
  
  yPos += 70;
  
  // Payment Breakdown
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('Weekly Payment Analysis', 20, yPos);
  yPos += 15;
  
  const totalAmount = parseFloat(summary.totalAmount);
  const gpayPercent = totalAmount > 0 ? ((parseFloat(summary.gpayAmount) / totalAmount) * 100).toFixed(1) : '0.0';
  const cashPercent = totalAmount > 0 ? ((parseFloat(summary.cashAmount) / totalAmount) * 100).toFixed(1) : '0.0';
  const avgOrderValue = summary.orderCount > 0 ? (totalAmount / summary.orderCount).toFixed(2) : '0.00';
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`GPay: ${formatCurrency(summary.gpayAmount)} (${gpayPercent}%)`, 20, yPos);
  doc.text(`Cash: ${formatCurrency(summary.cashAmount)} (${cashPercent}%)`, 20, yPos + 8);
  doc.text(`Average Order Value: ${formatCurrency(avgOrderValue)}`, 20, yPos + 16);
  doc.text(`Orders per Day: ${(summary.orderCount / 7).toFixed(1)}`, 20, yPos + 24);
  
  addFooter(doc, yPos + 30);
  
  doc.save(`chai-fi-weekly-summary-${summary.weekStart}.pdf`);
};

export const generateMonthlySummaryPDF = async (summary: MonthlySummary, transactions: Transaction[]) => {
  const doc = new jsPDF();
  
  const monthName = new Date(summary.month + '-01').toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  addHeader(doc, 'Monthly Summary', monthName);
  
  let yPos = 65;
  
  // Summary Overview
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text(`Monthly Summary - ${monthName}`, 20, yPos);
  yPos += 20;
  
  // Large summary cards
  const summaryData = [
    ['Total Revenue', formatCurrency(summary.totalAmount), COLORS.primary],
    ['GPay Revenue', formatCurrency(summary.gpayAmount), [34, 197, 94]],
    ['Cash Revenue', formatCurrency(summary.cashAmount), [107, 114, 128]],
    ['Total Orders', summary.orderCount.toString(), [59, 130, 246]],
  ];
  
  summaryData.forEach(([label, value, color], index) => {
    const xPos = 20 + (index % 2) * 85;
    const yOffset = Math.floor(index / 2) * 35;
    
    // Card background
    doc.setFillColor(color[0], color[1], color[2], 0.1);
    doc.rect(xPos, yPos + yOffset - 5, 80, 30, 'F');
    
    // Border
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.rect(xPos, yPos + yOffset - 5, 80, 30);
    
    // Label
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    doc.text(label, xPos + 5, yPos + yOffset + 2);
    
    // Value
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, xPos + 5, yPos + yOffset + 15);
  });
  
  yPos += 80;
  
  // Monthly Analysis
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('Monthly Business Analysis', 20, yPos);
  yPos += 15;
  
  const totalAmount = parseFloat(summary.totalAmount);
  const gpayPercent = totalAmount > 0 ? ((parseFloat(summary.gpayAmount) / totalAmount) * 100).toFixed(1) : '0.0';
  const cashPercent = totalAmount > 0 ? ((parseFloat(summary.cashAmount) / totalAmount) * 100).toFixed(1) : '0.0';
  const avgOrderValue = summary.orderCount > 0 ? (totalAmount / summary.orderCount).toFixed(2) : '0.00';
  const avgDailyRevenue = (totalAmount / 30).toFixed(2); // Approximate 30 days
  const avgDailyOrders = (summary.orderCount / 30).toFixed(1);
  
  const analysisData = [
    ['Payment Distribution:'],
    [`  • GPay: ${formatCurrency(summary.gpayAmount)} (${gpayPercent}%)`],
    [`  • Cash: ${formatCurrency(summary.cashAmount)} (${cashPercent}%)`],
    [''],
    ['Performance Metrics:'],
    [`  • Average Order Value: ${formatCurrency(avgOrderValue)}`],
    [`  • Daily Revenue Average: ${formatCurrency(avgDailyRevenue)}`],
    [`  • Daily Orders Average: ${avgDailyOrders}`],
  ];
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  analysisData.forEach((line) => {
    if (line.startsWith('Payment Distribution:') || line.startsWith('Performance Metrics:')) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    }
    
    doc.text(line, 20, yPos);
    yPos += 7;
  });
  
  addFooter(doc, yPos + 10);
  
  doc.save(`chai-fi-monthly-summary-${summary.month}.pdf`);
};
