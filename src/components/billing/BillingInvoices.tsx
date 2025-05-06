
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, AlertTriangle, RefreshCw } from 'lucide-react';
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

interface BillingInvoicesProps {
  subscription: {
    subscribed: boolean;
  } | null;
}

const BillingInvoices: React.FC<BillingInvoicesProps> = ({ subscription }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (subscription?.subscribed) {
      fetchInvoices();
    } else {
      setLoading(false);
      setFetchAttempted(true);
    }
  }, [subscription]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching invoices...');
      const { data, error } = await supabase.functions.invoke('get-invoices');
      
      if (error) {
        console.error('Error fetching invoices:', error);
        setError(`Failed to load invoices: ${error.message}`);
        return;
      }
      
      if (!data?.invoices) {
        console.error('No invoices data returned:', data);
        setError('No invoice data returned from server');
        return;
      }
      
      console.log('Invoices fetched successfully:', data.invoices.length);
      setInvoices(data.invoices);
    } catch (err) {
      console.error('Exception fetching invoices:', err);
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setFetchAttempted(true);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    });
    return formatter.format(amount / 100);
  };

  const renderError = () => {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
        </div>
        <p className="text-red-500 mb-4">
          {error || 'Failed to load invoice history'}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => fetchInvoices()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </div>
    );
  };

  const renderLoading = () => {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  };

  const renderInvoiceTable = () => {
    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{formatDate(invoice.created)}</TableCell>
                <TableCell>{invoice.number || '-'}</TableCell>
                <TableCell>
                  {formatCurrency(invoice.amount_paid, invoice.currency)}
                  <p className="text-xs text-gray-500">{invoice.description}</p>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Download Invoice</span>
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchInvoices}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
        </div>
      </>
    );
  };

  // Only hide component if we tried to fetch invoices and got none
  // AND the user doesn't have an active subscription
  if (fetchAttempted && invoices.length === 0 && !error && !subscription?.subscribed) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Billing History</h3>
        {!loading && invoices.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchInvoices}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {loading ? renderLoading() : 
           error ? renderError() : 
           invoices.length > 0 ? renderInvoiceTable() : 
           <div className="text-center py-8 text-gray-500">
             No invoice history available
           </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingInvoices;
