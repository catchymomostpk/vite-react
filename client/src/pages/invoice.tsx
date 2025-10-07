import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Share, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateInvoicePDF } from "@/lib/pdf";
import type { Transaction } from "@shared/schema";

export default function InvoicePage() {
  const [, navigate] = useLocation();
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const savedTransaction = localStorage.getItem("currentTransaction");
    if (savedTransaction) {
      setTransaction(JSON.parse(savedTransaction));
    } else {
      navigate("/menu");
    }
  }, [navigate]);

  const handleSharePDF = async () => {
    if (!transaction) return;
    
    try {
      await generateInvoicePDF(transaction);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const items = Array.isArray(transaction.items) ? transaction.items : [];

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost"
              onClick={() => navigate("/payment")}
              className="mr-4 p-2 hover:bg-muted rounded-lg transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft className="text-secondary" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-secondary" data-testid="invoice-title">Invoice</h1>
              <p className="text-muted-foreground" data-testid="invoice-subtitle">Payment successful</p>
            </div>
          </div>
          <Button 
            onClick={handleSharePDF}
            className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
            data-testid="button-share-pdf"
          >
            <Share className="mr-2" size={20} />
            Share PDF
          </Button>
        </div>

        {/* Invoice Card */}
        <Card className="shadow-lg overflow-hidden border border-border/60">
          {/* Invoice Header */}
          <div className="invoice-gradient text-white px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Coffee className="text-2xl" />
                  </div>
                  <h2 className="text-3xl font-bold" data-testid="invoice-app-name">Chai-Fi</h2>
                </div>
                <p className="opacity-90" data-testid="invoice-tagline">Modern Billing Solution</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" data-testid="invoice-number">#{transaction.id.slice(-6).toUpperCase()}</div>
                <div className="opacity-90" data-testid="invoice-label">Invoice</div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <CardContent className="px-6 py-8 sm:px-8">
            <div className="grid gap-6 mb-8 md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="font-semibold text-secondary mb-3" data-testid="bill-details-title">Bill Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-secondary sm:text-right" data-testid="text-bill-date">
                      {transaction.date}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Day:</span>
                    <span className="text-secondary sm:text-right" data-testid="text-bill-day">
                      {transaction.dayName}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="text-secondary sm:text-right" data-testid="text-bill-time">
                      {transaction.time}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Biller:</span>
                    <span className="text-secondary sm:text-right" data-testid="text-biller-name">
                      {transaction.billerName}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-secondary mb-3" data-testid="payment-details-title">Payment Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <span className="text-secondary capitalize sm:text-right" data-testid="text-payment-method">
                      {transaction.paymentMethod === "gpay" ? "Google Pay" : 
                       transaction.paymentMethod === "cash" ? "Cash" :
                       transaction.paymentMethod === "split" ? "Cash + GPay" :
                       transaction.paymentMethod === "creditor" ? "Creditor" : transaction.paymentMethod}
                    </span>
                  </div>
                  {transaction.paymentMethod === "split" && transaction.splitPayment && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground sm:pl-4">GPay Amount:</span>
                        <span className="text-secondary sm:text-right" data-testid="text-split-gpay-amount">
                          ₹{(transaction.splitPayment as any).gpayAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground sm:pl-4">Cash Amount:</span>
                        <span className="text-secondary sm:text-right" data-testid="text-split-cash-amount">
                          ₹{(transaction.splitPayment as any).cashAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  )}
                  {transaction.paymentMethod === "creditor" && transaction.creditor && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground sm:pl-4">Customer:</span>
                        <span className="text-secondary sm:text-right" data-testid="text-creditor-name">
                          {(transaction.creditor as any).name}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground sm:pl-4">Paid:</span>
                        <span className="text-secondary sm:text-right" data-testid="text-creditor-paid">
                          ₹{(transaction.creditor as any).paidAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground sm:pl-4">Balance:</span>
                        <span className="text-red-600 font-medium sm:text-right" data-testid="text-creditor-balance">
                          ₹{(transaction.creditor as any).balanceAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-green-600 font-medium sm:text-right" data-testid="text-payment-status">Paid</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-8">
              <h3 className="font-semibold text-secondary mb-4" data-testid="items-ordered-title">Items Ordered</h3>
              <div className="space-y-3">
                {items.map((item: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 bg-muted rounded-lg"
                    data-testid={`invoice-item-${index}`}
                  >
                    <div className="flex items-center justify-between sm:gap-3">
                      <span className="font-medium text-secondary" data-testid={`text-invoice-item-name-${index}`}>
                        {item.name}
                      </span>
                      <span className="text-muted-foreground" data-testid={`text-invoice-item-quantity-${index}`}>
                        x{item.quantity}
                      </span>
                    </div>
                    <span className="font-semibold text-primary sm:text-right" data-testid={`text-invoice-item-total-${index}`}>
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-border pt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xl font-bold text-secondary">Total Amount</span>
                <span className="text-2xl font-bold text-primary sm:text-right" data-testid="text-invoice-total">
                  ₹{transaction.totalAmount}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground text-sm" data-testid="text-thank-you">Thank you for choosing Chai-Fi!</p>
              <p className="text-muted-foreground text-xs mt-1" data-testid="text-support">For support, contact us at support@chai-fi.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:space-x-4">
          <Button 
            onClick={() => navigate("/menu")}
            className="w-full sm:flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            data-testid="button-new-order"
          >
            New Order
          </Button>
          <Button 
            onClick={() => navigate("/dashboard")}
            className="w-full sm:flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
            data-testid="button-view-dashboard"
          >
            View Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
