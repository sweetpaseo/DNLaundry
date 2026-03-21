import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Transaction, TransactionStatus, PaymentMethod, Customer } from '../../types';
import { api } from '../../services/api';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Transaction>) => Promise<void>;
  transaction: Transaction;
}

export const EditTransactionModal = ({ isOpen, onClose, onSave, transaction }: EditTransactionModalProps) => {
  const [status, setStatus] = useState<TransactionStatus>(transaction.status);
  const [isPaid, setIsPaid] = useState(transaction.is_paid);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.payment_method || 'Cash');
  const [notes, setNotes] = useState(transaction.notes || '');
  const [amountReceived, setAmountReceived] = useState<number>(transaction.final_price);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transaction && isOpen) {
      setStatus(transaction.status);
      setIsPaid(transaction.is_paid);
      setPaymentMethod(transaction.payment_method || 'Cash');
      setNotes(transaction.notes || '');
      setAmountReceived(transaction.final_price);
      
      // Fetch customer for wallet balance
      api.getCustomers().then(customers => {
        const found = customers.find((c: Customer) => c.id === transaction.customer_id);
        if (found) setCustomer(found);
      });
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Update Transaction
      await onSave(transaction.id, {
        status,
        is_paid: isPaid,
        payment_method: paymentMethod,
        notes
      });

      // 2. Handle Wallet Logic if it's a member and payment is being finalized
      if (customer && isPaid && !transaction.is_paid) {
        let newBalance = customer.wallet_balance || 0;
        
        if (paymentMethod === 'Wallet') {
          newBalance -= transaction.final_price;
        } else if (amountReceived > transaction.final_price) {
          const excess = amountReceived - transaction.final_price;
          newBalance += excess;
          alert(`Kelebihan bayar Rp ${excess.toLocaleString()} telah masuk ke saldo dompet ${customer.name}`);
        }

        if (newBalance !== (customer.wallet_balance || 0)) {
          await api.updateCustomerBalance(customer.id, newBalance);
        }
      }

      onClose();
    } catch (error) {
      alert('Gagal mengupdate transaksi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card animate-scale-in" style={{ width: 'min(95%, 450px)', padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Edit Transaksi</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status Pesanan</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
              style={{ width: '100%', height: '3rem' }}
            >
              <option value="Baru" style={{ background: '#1a1a1a' }}>Baru</option>
              <option value="Proses" style={{ background: '#1a1a1a' }}>Proses</option>
              <option value="Siap Ambil" style={{ background: '#1a1a1a' }}>Siap Ambil</option>
            </select>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isPaid} 
                  onChange={(e) => setIsPaid(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Status Pembayaran (LUNAS)</span>
              </label>
            </div>

            {isPaid && (
              <div className="form-group animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cara Pembayaran</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{ width: '100%', height: '2.5rem', borderRadius: '8px' }}
                  >
                    <option value="Cash" style={{ background: '#1a1a1a' }}>💵 Cash (Tunai)</option>
                    <option value="Transfer Bank" style={{ background: '#1a1a1a' }}>🏦 Transfer Bank</option>
                    <option value="QRIS" style={{ background: '#1a1a1a' }}>📱 QRIS</option>
                    {customer && (customer.wallet_balance || 0) >= transaction.final_price && (
                      <option value="Wallet" style={{ background: '#1a1a1a' }}>👛 Saldo Dompet (Rp {(customer.wallet_balance || 0).toLocaleString()})</option>
                    )}
                  </select>
                </div>

                {paymentMethod !== 'Wallet' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Jumlah Diterima (Rp)</label>
                    <input 
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(Number(e.target.value))}
                      style={{ width: '100%', height: '2.5rem', borderRadius: '8px' }}
                      min={transaction.final_price}
                    />
                    {amountReceived > transaction.final_price && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 600 }}>
                         + Rp {(amountReceived - transaction.final_price).toLocaleString()} masuk ke Saldo Dompet
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Catatan</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', minHeight: '100px', padding: '1rem' }}
              placeholder="Tambahkan catatan di sini..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
