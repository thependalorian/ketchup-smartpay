/**
 * Open Banking Payments Page - Ketchup Portal
 * Purpose: Initiate payments (PIS) and view payment history
 */
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card, Input, Label } from '@smartpay/ui';

export default function OpenBankingPayments() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [reference, setReference] = useState('');

  return (
    <Layout title="Send Payment" subtitle="Initiate payments (Open Banking PIS)">
      <div className="space-y-6 max-w-xl">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">New payment</h3>
          <p className="text-sm text-muted-foreground mb-4">Initiate a payment via Open Banking. Requires linked account and consent.</p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (NAD)</Label>
              <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="recipient">Recipient account ID</Label>
              <Input id="recipient" placeholder="Account identifier" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="reference">Reference</Label>
              <Input id="reference" placeholder="Payment reference" value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1" />
            </div>
            <Button disabled={!amount || !recipient}>Initiate payment</Button>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Recent payments</h3>
          <p className="text-sm text-muted-foreground">Payment history will appear here once the PIS flow is connected.</p>
        </Card>
      </div>
    </Layout>
  );
}
