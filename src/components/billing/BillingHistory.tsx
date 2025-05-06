
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Invoice {
  id: string;
  number: string;
  created: number;
  amount_paid: number;
  currency: string;
  status: string;
  hosted_invoice_url: string;
  invoice_pdf: string;
  description?: string;
}

interface BillingHistoryProps {
  subscription: {
    subscribed: boolean;
  } | null;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({ subscription }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subscription?.subscribed) {
      fetchInvoices();
    }
  }, [subscription?.subscribed]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-invoices');
      
      if (error) {
        console.error('Error fetching invoices:', error);
        return;
      }
      
      if (data?.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error('Error fetching invoice history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd'): string => {
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency.toUpperCase(),
    }).format(dollars);
  };

  if (!subscription?.subscribed) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Billing History</h3>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md">Past Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{new Date(invoice.created * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {invoice.description || `Invoice ${invoice.number}`}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount_paid, invoice.currency)}</TableCell>
                    <TableCell className="text-right">
                      {invoice.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                        >
                          <fileText className="h-4 w-4" />
                          <span className="sr-only">Download PDF</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No invoice history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingHistory;
