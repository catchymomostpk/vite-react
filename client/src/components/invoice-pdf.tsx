import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/lib/pdf-utils";
import type { Transaction } from "@shared/schema";

interface InvoicePDFProps {
  transaction: Transaction;
  className?: string;
}

export function InvoicePDF({ transaction, className }: InvoicePDFProps) {
  const handleDownload = async () => {
    try {
      await generateInvoicePDF(transaction);
    } catch (error) {
      console.error("Failed to generate invoice PDF:", error);
    }
  };

  return (
    <Button 
      onClick={handleDownload}
      className={className}
      data-testid="button-download-invoice"
    >
      <Download className="mr-2" size={16} />
      Download Invoice
    </Button>
  );
}

export function SummaryPDFButton({ 
  type, 
  data, 
  transactions = [] 
}: { 
  type: "daily" | "weekly" | "monthly";
  data: any;
  transactions?: any[];
}) {
  const handleDownload = async () => {
    try {
      const { generateDailySummaryPDF, generateWeeklySummaryPDF, generateMonthlySummaryPDF } = await import("@/lib/pdf-utils");
      
      switch (type) {
        case "daily":
          await generateDailySummaryPDF(data, transactions);
          break;
        case "weekly":
          await generateWeeklySummaryPDF(data, transactions);
          break;
        case "monthly":
          await generateMonthlySummaryPDF(data, transactions);
          break;
      }
    } catch (error) {
      console.error(`Failed to generate ${type} summary PDF:`, error);
    }
  };

  return (
    <Button 
      onClick={handleDownload}
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-accent"
      data-testid={`button-download-${type}`}
    >
      <Download className="mr-2" size={16} />
      Download
    </Button>
  );
}
