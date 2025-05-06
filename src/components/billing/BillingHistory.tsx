
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Always attempt to fetch invoices - the user might have past invoices
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching invoices from get-invoices edge function');
      const { data, error } = await supabase.functions.invoke('get-invoices');
      
      if (error) {
        console.error('Error from get-invoices function:', error);
        setError(`Error: ${error.message || 'Failed to fetch invoices'}`);
        toast({
          title: "Failed to load invoices",
          description: "There was an issue retrieving your billing history. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Invoice data received:', data);
      
      if (data?.invoices) {
        setInvoices(data.invoices);
        if (data.invoices.length === 0) {
          console.log('No invoices found in the response');
        }
      } else {
        console.warn('No invoices property in response:', data);
        setError('No invoice data received from server');
      }
    } catch (err) {
      console.error('Error fetching invoice history:', err);
      setError(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast({
        title: "Error loading invoices",
        description: "An unexpected error occurred while fetching your billing history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setFetchAttempted(true);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd'): string => {
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency.toUpperCase(),
    }).format(dollars);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
          <p className="text-gray-500">Failed to load invoice history</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => fetchInvoices()}
          >
            Try again
          </Button>
        </div>
      );
    }

    if (invoices.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No invoice history available
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Download</TableHead>
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
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">Download PDF</span>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Hide component only if we tried to fetch invoices and got none
  if (fetchAttempted && invoices.length === 0 && !error && !subscription?.subscribed) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Billing History</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              No invoice history available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Billing History</h3>
      
      <Card>
        <CardContent className="pt-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingHistory;
