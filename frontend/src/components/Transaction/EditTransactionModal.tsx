import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Wallet, CheckCircle2, Calendar, Hash, Percent } from 'lucide-react';
import type { Transaction, TransactionStatus, PaymentMethod, Customer, Service, Employee } from '../../types';
import { api } from '../../services/api';
import { roundUpTo500 } from '../../utils/format';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Transaction>) => Promise<void>;
  transaction: Transaction;
  groupTotal?: number;
}

export const EditTransactionModal = ({ isOpen, onClose, onSave, transaction, groupTotal }: EditTransactionModalProps) => {
  const [status, setStatus] = useState<TransactionStatus>(transaction.status);
  const [isPaid, setIsPaid] = useState(transaction.is_paid);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.payment_method || 'Cash');
  const [notes, setNotes] = useState(transaction.notes || '');
  const [amountReceived, setAmountReceived] = useState<number>(transaction.amount_received || (transaction.is_paid ? (groupTotal || transaction.final_price) : 0));
  const [useWallet, setUseWallet] = useState(false);
  const [surplusAction, setSurplusAction] = useState<'deposit' | 'change'>('deposit');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New states for expanded editing
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roundingEnabled, setRoundingEnabled] = useState(true);
  
  const [serviceId, setServiceId] = useState(transaction.service_id);
  const [employeeId, setEmployeeId] = useState(transaction.employee_id || '');
  const [weight, setWeight] = useState(transaction.weight);
  const [selectedTier, setSelectedTier] = useState<'normal' | 'member' | 'express' | 'reseller'>('normal');
  const [orderDate, setOrderDate] = useState(transaction.created_at.split('T')[0]);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(transaction.discount_percent > 0 ? 'percentage' : 'fixed');
  const [discountValue, setDiscountValue] = useState(transaction.discount_percent > 0 ? transaction.discount_percent : transaction.discount_amount);
  const [finalPrice, setFinalPrice] = useState(transaction.final_price);
  const [dueDate, setDueDate] = useState(transaction.due_date || '');

  useEffect(() => {
    if (transaction && isOpen) {
      setStatus(transaction.status);
      setIsPaid(transaction.is_paid);
      setPaymentMethod(transaction.payment_method || 'Cash');
      setNotes(transaction.notes || '');
      setAmountReceived(transaction.amount_received || (transaction.is_paid ? (groupTotal || transaction.final_price) : 0));
      setUseWallet(false);
      setSurplusAction('deposit');
      
      setServiceId(transaction.service_id);
      setEmployeeId(transaction.employee_id || '');
      setWeight(transaction.weight);
      setOrderDate(transaction.created_at.split('T')[0]);
      setDiscountType(transaction.discount_percent > 0 ? 'percentage' : 'fixed');
      setDiscountValue(transaction.discount_percent > 0 ? transaction.discount_percent : transaction.discount_amount);
      setFinalPrice(transaction.final_price);
      setDueDate(transaction.due_date || '');

      // Fetch supporting data
      Promise.all([
        api.getServices(),
        api.getEmployees(),
        api.getSettings(),
        api.getCustomers()
      ]).then(([s, e, settings, custs]) => {
        setServices(s
          .filter((srv: Service) => srv.is_active || srv.id === transaction.service_id)
          .sort((a: Service, b: Service) => (a.price_normal || 0) - (b.price_normal || 0))
        );
        setEmployees(e.filter((emp: Employee) => emp.is_active || emp.id === transaction.employee_id));
        if (settings) setRoundingEnabled(settings.rounding_enabled !== false);
        
        // Find customer
        let found = custs.find((c: Customer) => c.id === transaction.customer_id);
        if (!found && transaction.customer_name) {
          found = custs.find((c: Customer) => c.name.toLowerCase() === transaction.customer_name.toLowerCase());
        }
        if (found) {
          setCustomer(found);
          // Infer tier from customer type if possible
          api.getMemberTypes().then(mTypes => {
            const mType = mTypes.find((m: any) => m.id === found?.type_id);
            const typeName = mType?.name.toLowerCase() || '';
            if (typeName.includes('reseller')) setSelectedTier('reseller');
            else if (typeName.includes('member')) setSelectedTier('member');
            else setSelectedTier('normal');
          });
        }
      });
    }
  }, [transaction, isOpen]);

  // Price Calculation logic
  useEffect(() => {
    const srv = services.find(s => s.id === serviceId);
    if (!srv) return;

    let basePrice = srv.price_normal || 0;
    if (selectedTier === 'member') basePrice = srv.price_member || 0;
    else if (selectedTier === 'express') basePrice = srv.price_express || 0;
    else if (selectedTier === 'reseller') basePrice = srv.price_special || 0;

    const subtotal = basePrice * weight;
    let discAmount = 0;
    let discPercent = 0;

    if (discountType === 'percentage') {
      discPercent = Number(discountValue);
      discAmount = (subtotal * discPercent) / 100;
    } else {
      discAmount = Number(discountValue);
      discPercent = subtotal > 0 ? (discAmount / subtotal) * 100 : 0;
    }

    const calculatedFinal = roundingEnabled 
      ? roundUpTo500(Math.max(0, subtotal - discAmount))
      : Math.max(0, subtotal - discAmount);
    
    const newFinal = calculatedFinal;
    const oldFinal = transaction.final_price;
    const currentDisplayTotal = groupTotal ? (groupTotal - oldFinal + newFinal) : newFinal;

    setFinalPrice(newFinal);
    
    // Auto-update amountReceived if it was matching the total (paid status)
    if (isPaid && (amountReceived === 0 || amountReceived === (groupTotal || oldFinal))) {
      setAmountReceived(currentDisplayTotal);
    }
  }, [serviceId, weight, selectedTier, discountType, discountValue, services, roundingEnabled, isPaid]);
  
  useEffect(() => {
    const srv = services.find(s => s.id === serviceId);
    if (srv) {
      const days = srv.processing_days || 0;
      const date = new Date(orderDate);
      date.setDate(date.getDate() + days);
      setDueDate(date.toISOString());
    }
  }, [serviceId, orderDate, services]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  const displayTotal = groupTotal 
    ? (groupTotal - transaction.final_price + finalPrice)
    : finalPrice;
  
  // Live Calculations
  const walletBalance = customer?.wallet_balance || 0;
  const usedWalletAmount = useWallet ? Math.min(walletBalance, displayTotal) : 0;
  const totalIn = amountReceived + usedWalletAmount;
  const balance = totalIn - displayTotal;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const srv = services.find(s => s.id === serviceId);
      if (!srv) throw new Error('Layanan tidak ditemukan');

      let basePrice = srv.price_normal || 0;
      if (selectedTier === 'member') basePrice = srv.price_member || 0;
      else if (selectedTier === 'express') basePrice = srv.price_express || 0;
      else if (selectedTier === 'reseller') basePrice = srv.price_special || 0;

      const subtotal = basePrice * weight;
      let discAmount = 0;
      let discPercent = 0;

      if (discountType === 'percentage') {
        discPercent = Number(discountValue);
        discAmount = (subtotal * discPercent) / 100;
      } else {
        discAmount = Number(discountValue);
        discPercent = subtotal > 0 ? (discAmount / subtotal) * 100 : 0;
      }

      // 2. Update Transaction
      await onSave(transaction.id, {
        status,
        is_paid: isPaid,
        payment_method: useWallet && amountReceived === 0 ? 'Saldo' : paymentMethod,
        notes,
        service_id: serviceId,
        service_name: srv.name,
        employee_id: employeeId || undefined,
        weight: weight,
        total_price: subtotal,
        discount_amount: discAmount,
        discount_percent: discPercent,
        final_price: finalPrice,
        ...(amountReceived !== undefined ? { amount_received: amountReceived } : {}),
        due_date: dueDate,
        created_at: new Date(orderDate).toISOString()
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
          console.log(`Updating customer ${customer.id} balance: ${walletBalance} -> ${newBalance} (Surplus: ${balance}, Used Wallet: ${usedWalletAmount})`);
          await api.updateCustomerBalance(customer.id, newBalance);
        }
      }

      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      alert(`Gagal mengupdate transaksi: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content glass-card animate-scale-in" style={{ width: 'min(95%, 520px)', padding: '0', maxHeight: '95vh', overflowY: 'auto', border: '1px solid var(--glass-border)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Edit Transaksi</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {transaction.receipt_no || transaction.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Date & Status Row */}
          <div className="mobile-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Tanggal Order</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem', height: '3rem' }} 
                />
                <Calendar size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Status Pesanan</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                style={{ width: '100%', height: '3rem' }}
              >
                <option value="Baru" style={{ background: '#1a1a1a' }}>🆕 Baru</option>
                <option value="Proses" style={{ background: '#1a1a1a' }}>🔄 Proses</option>
                <option value="Siap Ambil" style={{ background: '#1a1a1a' }}>✅ Siap Ambil</option>
                <option value="Siap Kirim" style={{ background: '#1a1a1a' }}>🚚 Siap Kirim</option>
                <option value="Selesai" style={{ background: '#1a1a1a' }}>🏁 Selesai</option>
              </select>
            </div>
          </div>

          {/* Service & Employee */}
          <div className="mobile-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Layanan</label>
              <select 
                value={serviceId} 
                onChange={(e) => setServiceId(e.target.value)}
                style={{ width: '100%', height: '3rem' }}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Petugas</label>
              <select 
                value={employeeId} 
                onChange={(e) => setEmployeeId(e.target.value)}
                style={{ width: '100%', height: '3rem' }}
              >
                <option value="">Pilih Petugas</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id} style={{ background: '#1a1a1a' }}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tier & Quantity */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div className="mobile-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>TIER HARGA</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '0.4rem' }}>
                  {(['normal', 'member', 'express', 'reseller'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTier(t)}
                      style={{
                        padding: '0.5rem 0',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        borderRadius: '6px',
                        border: '1px solid var(--glass-border)',
                        background: selectedTier === t ? 'var(--primary-gradient)' : 'transparent',
                        color: selectedTier === t ? 'white' : 'var(--text-muted)'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>JUMLAH</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={weight} 
                  onChange={(e) => setWeight(Number(e.target.value))}
                  style={{ width: '100%', height: '2.5rem', textAlign: 'center', fontWeight: 700 }} 
                />
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Diskon Khusus</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select 
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                style={{ width: '70px', height: '2.5rem' }}
              >
                <option value="fixed">Rp</option>
                <option value="percentage">%</option>
              </select>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="number" 
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  style={{ width: '100%', height: '2.5rem', paddingLeft: '2rem' }} 
                />
                {discountType === 'percentage' ? 
                  <Percent size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /> :
                  <Hash size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                }
              </div>
            </div>
          </div>

          <div style={{ margin: '0.25rem 0', height: '1px', background: 'var(--glass-border)' }}></div>

          {/* Total Summary (Always Visible) */}
          <div style={{ 
            padding: '1rem 1.25rem', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, rgba(255, 0, 132, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            border: '1px solid rgba(255, 0, 132, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Tagihan {groupTotal ? '(Nota)' : ''}
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.2 }}>
                Rp {displayTotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Status Saat Ini</p>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                padding: '0.25rem 0.6rem', 
                borderRadius: '6px', 
                background: isPaid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isPaid ? '#22c55e' : '#ef4444'
              }}>
                {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
              </span>
            </div>
          </div>

          {/* Payment Section */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} style={{ color: isPaid ? '#22c55e' : 'var(--text-muted)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pembayaran</span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                <input 
                  type="checkbox" 
                  checked={isPaid} 
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsPaid(checked);
                    if (checked && amountReceived < finalPrice) {
                      setAmountReceived(finalPrice);
                    } else if (!checked) {
                      setAmountReceived(0);
                    }
                    
                    // Auto-Selesai Logic: if already ready and marked as paid
                    if (checked && (status === 'Siap Ambil' || status === 'Siap Kirim')) {
                      setStatus('Selesai');
                    }
                  }} 
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isPaid ? '#22c55e' : '#475569', transition: '.4s', borderRadius: '20px' }}>
                  <span style={{ position: 'absolute', height: '14px', width: '14px', left: isPaid ? '23px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                </span>
              </label>
            </div>

            {isPaid && (
              <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Wallet Usage omitted for brevity or integrated if needed */}
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
                      disabled={useWallet && balance >= 0}
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="Transfer Bank">🏦 Transfer</option>
                      <option value="QRIS">📱 QRIS</option>
                      <option value="Saldo" disabled>👛 Saldo</option>
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
                    <span style={{ color: 'var(--text-muted)' }}>Tagihan Akhir:</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>Rp {displayTotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span style={{ fontWeight: 600 }}>{balance >= 0 ? 'Kembalian:' : 'Sisa Kurang:'}</span>
                    <span style={{ fontWeight: 800, color: balance >= 0 ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                      Rp {Math.abs(balance).toLocaleString()}
                    </span>
                  </div>

                  {balance > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TINDAKAN KELEBIHAN:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button type="button" onClick={() => setSurplusAction('deposit')} style={{ padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', background: surplusAction === 'deposit' ? 'rgba(34, 197, 94, 0.2)' : 'transparent', border: `1px solid ${surplusAction === 'deposit' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, color: surplusAction === 'deposit' ? '#22c55e' : 'var(--text-muted)' }}>👛 Jadi Deposit</button>
                        <button type="button" onClick={() => setSurplusAction('change')} style={{ padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', background: surplusAction === 'change' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', border: `1px solid ${surplusAction === 'change' ? 'white' : 'rgba(255,255,255,0.1)'}`, color: surplusAction === 'change' ? 'white' : 'var(--text-muted)' }}>💵 Kembalian</button>
                      </div>
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
              style={{ width: '100%', minHeight: '60px', padding: '0.75rem', fontSize: '0.9rem' }}
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
    </div>,
    document.body
  );
};
