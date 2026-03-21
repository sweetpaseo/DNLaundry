import { useState, useEffect, type FormEvent } from 'react';
import { X, Save, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [amountReceived, setAmountReceived] = useState<number>(transaction.is_paid ? transaction.final_price : 0);
  const [useWallet, setUseWallet] = useState(false);
  const [surplusAction, setSurplusAction] = useState<'deposit' | 'change'>('deposit');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transaction && isOpen) {
      setStatus(transaction.status);
      setIsPaid(transaction.is_paid);
      setPaymentMethod(transaction.payment_method || 'Cash');
      setNotes(transaction.notes || '');
      setAmountReceived(transaction.is_paid ? transaction.final_price : 0);
      setUseWallet(false);
      setSurplusAction('deposit');
      
      api.getCustomers().then(customers => {
        const found = customers.find((c: Customer) => c.id === transaction.customer_id);
        if (found) setCustomer(found);
      });
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  // Live Calculations
  const walletBalance = customer?.wallet_balance || 0;
  const usedWalletAmount = useWallet ? Math.min(walletBalance, transaction.final_price) : 0;
  const remainingBill = transaction.final_price - usedWalletAmount;
  const totalIn = amountReceived + usedWalletAmount;
  const balance = totalIn - transaction.final_price;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Determine new is_paid status
      const willBePaid = totalIn >= transaction.final_price;

      // 2. Update Transaction
      await onSave(transaction.id, {
        status,
        is_paid: willBePaid,
        payment_method: useWallet && amountReceived === 0 ? 'Wallet' : paymentMethod,
        notes
      });

      // 3. Handle Wallet Update
      if (customer) {
        let newBalance = walletBalance;
        
        // Subtract if using wallet
        if (useWallet) {
          newBalance -= usedWalletAmount;
        }

        // Add if surplus and deposit is chosen
        if (balance > 0 && surplusAction === 'deposit') {
          newBalance += balance;
        }

        if (newBalance !== walletBalance) {
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
      <div className="modal-content glass-card animate-scale-in" style={{ width: 'min(95%, 480px)', padding: '0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Edit Transaksi</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {transaction.id.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Status Section */}
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Pesanan</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
              style={{ width: '100%', height: '3rem', fontSize: '1rem' }}
            >
              <option value="Baru" style={{ background: '#1a1a1a' }}>🆕 Baru</option>
              <option value="Proses" style={{ background: '#1a1a1a' }}>🔄 Proses</option>
              <option value="Siap Ambil" style={{ background: '#1a1a1a' }}>✅ Siap Ambil</option>
            </select>
          </div>

          {/* Payment Section */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} style={{ color: isPaid ? '#22c55e' : 'var(--text-muted)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pembayaran</span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isPaid ? '#22c55e' : '#475569', transition: '.4s', borderRadius: '20px' }}>
                  <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: isPaid ? '23px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                </span>
              </label>
            </div>

            {isPaid && (
              <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Wallet Usage */}
                {walletBalance > 0 && (
                  <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Wallet size={16} /> Saldo: Rp {walletBalance.toLocaleString()}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>Pakai Saldo?</span>
                        <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} />
                      </label>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Metode</label>
                    <select 
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      style={{ width: '100%', height: '2.5rem', borderRadius: '10px' }}
                      disabled={useWallet && remainingBill <= 0}
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="Transfer Bank">🏦 Transfer</option>
                      <option value="QRIS">📱 QRIS</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Uang Diterima</label>
                    <input 
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(Number(e.target.value))}
                      style={{ width: '100%', height: '2.5rem', borderRadius: '10px', padding: '0 0.75rem' }}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Live Summary */}
                <div style={{ marginTop: '0.25rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Tagihan:</span>
                    <span style={{ fontWeight: 700 }}>Rp {transaction.final_price.toLocaleString()}</span>
                  </div>
                  {useWallet && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#22c55e' }}>
                      <span>Pakai Saldo Dompet:</span>
                      <span>- Rp {usedWalletAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span style={{ fontWeight: 600 }}>{balance >= 0 ? 'Kembalian:' : 'Sisa Kurang:'}</span>
                    <span style={{ fontWeight: 800, color: balance >= 0 ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                      Rp {Math.abs(balance).toLocaleString()}
                    </span>
                  </div>

                  {/* Surplus Choice */}
                  {balance > 0 && (
                    <div className="animate-fade-in" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>TINDAKAN UNTUK KELEBIHAN BAYAR:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => setSurplusAction('deposit')}
                          style={{ 
                            padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer',
                            background: surplusAction === 'deposit' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                            border: `1px solid ${surplusAction === 'deposit' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                            color: surplusAction === 'deposit' ? '#22c55e' : 'var(--text-muted)',
                            fontWeight: surplusAction === 'deposit' ? 700 : 400
                          }}
                        >
                          👛 Jadi Deposit
                        </button>
                        <button 
                          type="button"
                          onClick={() => setSurplusAction('change')}
                          style={{ 
                            padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer',
                            background: surplusAction === 'change' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            border: `1px solid ${surplusAction === 'change' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            color: surplusAction === 'change' ? 'white' : 'var(--text-muted)',
                            fontWeight: surplusAction === 'change' ? 700 : 400
                          }}
                        >
                          💵 Kasih Kembalian
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Debt Info */}
                  {balance < 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.75rem' }}>
                      <AlertCircle size={14} />
                      <span>Input kurang mencukupi. Sisa akan dicatat sebagai hutang.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Catatan</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', minHeight: '80px', padding: '1rem', fontSize: '0.9rem' }}
              placeholder="Tambahkan catatan di sini..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', fontSize: '1rem' }} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
