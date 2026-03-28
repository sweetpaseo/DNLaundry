import { useState, useEffect } from 'react';
import { Printer, Trash2, CheckCircle, Clock, Search, Loader2, Edit3, Wallet } from 'lucide-react';
import type { Transaction, TransactionStatus, Customer } from '../../types';
import { api } from '../../services/api';
import { ReceiptModal } from './ReceiptModal';
import { EditTransactionModal } from './EditTransactionModal';
import { WhatsAppIcon } from '../Icons'; 
import { getWhatsAppUrl } from '../../utils/whatsapp';
import { getDisplayId, formatDisplayId } from '../../utils/customer';

interface TransactionListProps {
  currentUser?: any;
}

export const TransactionList = ({ currentUser }: TransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | 'Semua'>('Semua');
  const [paymentFilter, setPaymentFilter] = useState<'Semua' | 'Lunas' | 'Belum Lunas'>('Semua');
  const [timeFilter, setTimeFilter] = useState<'Semua' | 'Hari Ini' | '7 Hari' | '30 Hari' | 'Kustom'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchTransactions = async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Transaction>) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      
      // 1. Update the MUST-HAVE fields for the specific item
      await api.updateTransaction(id, data);

      // 2. If it's part of a group, sync group-level fields only
      if (transaction?.group_id) {
        const otherItems = transactions.filter(t => t.group_id === transaction.group_id && t.id !== id);
        for (const item of otherItems) {
          // Only update fields that are actually present in the data
          const updateObj: any = {};
          if (data.status !== undefined) updateObj.status = data.status;
          if (data.is_paid !== undefined) updateObj.is_paid = data.is_paid;
          if (data.payment_method !== undefined) updateObj.payment_method = data.payment_method;
          if (data.notes !== undefined) updateObj.notes = data.notes;
          if (data.created_at !== undefined) updateObj.created_at = data.created_at;

          if (Object.keys(updateObj).length > 0) {
            await api.updateTransaction(item.id, updateObj);
          }
        }
      }
      
      fetchTransactions();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  };

  const handleDelete = async (groupId: string) => {
    if (window.confirm(`Hapus semua item dalam transaksi ini?`)) {
      try {
        const groupItems = transactions.filter(t => (t.group_id || t.id) === groupId);
        for (const item of groupItems) {
          await api.deleteTransaction(item.id);
        }
        fetchTransactions();
      } catch (e) {
        alert('Gagal menghapus transaksi');
      }
    }
  };

  const handleWhatsAppShare = (group: Transaction[]) => {
    if (!settings?.phone) {
      alert('Nomor WhatsApp toko belum diatur di pengaturan.');
      return;
    }

    const firstTransaction = group[0];
    const totalGroupPrice = group.reduce((sum, item) => sum + item.final_price, 0);
    const allPaid = group.every(item => item.is_paid);

    const receiptId = firstTransaction.receipt_no || (firstTransaction.group_id || firstTransaction.id).slice(0, 8).toUpperCase();
    
    let message = `*DETAIL TRANSAKSI LAUNDRY*\n`;
    message += `No. Nota: *#${receiptId}*\n\n`;
    const customer = customers.find(c => c.id === firstTransaction.customer_id) || customers.find(c => c.name === firstTransaction.customer_name);
    const customerDisplayId = customer ? getDisplayId(customer) : (firstTransaction.customer?.customer_id || `#DN-${(firstTransaction.customer_id || '').slice(0, 5).toUpperCase()}`);
    message += `Nama Pelanggan: *${firstTransaction.customer_name}* (${formatDisplayId(customerDisplayId)})\n`;
    message += `Status: *${firstTransaction.status}*\n`;
    const formatDateOnly = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });
      } catch (e) {
        return dateStr;
      }
    };

    message += `Tanggal Masuk: ${formatDateOnly(firstTransaction.created_at)}\n`;
    if (firstTransaction.due_date) {
      message += `Estimasi Selesai: ${formatDateOnly(firstTransaction.due_date)}\n`;
    }
    
    message += `\n*Daftar Layanan:*\n`;
    group.forEach((item, index) => {
      message += `${index + 1}. ${item.service_name} (${item.weight} ${item.unit || 'kg'}) - Rp ${item.final_price.toLocaleString('id-ID')}\n`;
    });
    
    message += `\nTotal Pembayaran: *Rp ${totalGroupPrice.toLocaleString('id-ID')}*\n`;
    message += `Status Pembayaran: *${allPaid ? 'LUNAS' : 'BELUM LUNAS'}*\n`;

    if (!allPaid && (settings?.bank_name || settings?.qris_url)) {
      message += `\n*Informasi Pembayaran (Transfer):*\n`;
      if (settings.bank_name) {
        message += `${settings.bank_name}\n`;
        message += `No. Rek: ${settings.bank_account_number}\n`;
        message += `A.n: ${settings.bank_account_name}\n`;
      }
      if (settings.qris_whatsapp_url || settings.qris_url) {
        message += `\nLink QRIS: ${settings.qris_whatsapp_url || settings.qris_url}\n`;
      }
    }

    message += `\n${settings?.footer_text || 'Terima kasih telah menggunakan layanan kami!'}\n\n`;
    message += `*${settings?.name}*\n`;
    message += `WA: ${settings?.phone}\n`;
    message += `Alamat: ${settings?.address}`;

    if (!firstTransaction) return;

    const recipientPhone = customer?.phone || (firstTransaction as any).customer?.phone || (firstTransaction as any).customers?.phone;

    if (!recipientPhone) {
      const displayId = customer ? getDisplayId(customer) : (firstTransaction.customer?.customer_id || (firstTransaction.customer_id ? `#DN-${firstTransaction.customer_id.slice(0, 5).toUpperCase()}` : 'N/A'));
      alert(`Nomor WhatsApp pelanggan tidak ditemukan.\n(Pelanggan: ${firstTransaction.customer_name || 'Tidak diketahui'}, ID: ${formatDisplayId(displayId)})`);
      return;
    }

    const whatsappUrl = getWhatsAppUrl(recipientPhone, message);
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    fetchTransactions();
    api.getSettings().then(setSettings).catch(() => {});
    api.getCustomers().then(setCustomers).catch(() => {});
  }, []);

  const getStatusStyle = (status: TransactionStatus) => {
    switch (status) {
      case 'Baru': return { bg: 'rgba(255, 0, 132, 0.1)', color: '#FF0084' };
      case 'Proses': return { bg: 'rgba(211, 211, 211, 0.1)', color: '#D3D3D3' };
      case 'Siap Ambil': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399' };
      case 'Siap Kirim': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' };
      case 'Selesai': return { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' };
    }
  };

  // 1. Group ALL transactions first
  const groupedOrders = transactions.reduce((acc, t) => {
    const gid = t.group_id || t.id;
    if (!acc[gid]) acc[gid] = [];
    acc[gid].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // 2. Filter the GROUPS
  const filteredGroups = Object.values(groupedOrders).filter(group => {
    const t = group[0];
    
    // Status Filter (matches if any item in group matches, or just primary)
    const matchesStatus = filter === 'Semua' || t.status === filter;
    
    // Payment Status Filter (Nota level)
    const allPaid = group.every(item => item.is_paid);
    const matchesPayment = paymentFilter === 'Semua' || (paymentFilter === 'Lunas' ? allPaid : !allPaid);

    // Time Filter
    let matchesTime = true;
    const createdAt = new Date(t.created_at);
    const now = new Date();
    if (timeFilter === 'Hari Ini') {
      matchesTime = createdAt.toDateString() === now.toDateString();
    } else if (timeFilter === '7 Hari') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      matchesTime = createdAt >= sevenDaysAgo;
    } else if (timeFilter === '30 Hari') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      matchesTime = createdAt >= thirtyDaysAgo;
    } else if (timeFilter === 'Kustom') {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start) {
        start.setHours(0, 0, 0, 0);
        matchesTime = matchesTime && createdAt >= start;
      }
      if (end) {
        end.setHours(23, 59, 59, 999);
        matchesTime = matchesTime && createdAt <= end;
      }
    }

    // Search Filter (customer name)
    const matchesSearch = !searchTerm || t.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPayment && matchesTime && matchesSearch;
  }).sort((a, b) => {
    const tA = a[0];
    const tB = b[0];

    // Primary sort: receipt_no (if exists) descending
    if (tA.receipt_no && tB.receipt_no) {
      if (tA.receipt_no !== tB.receipt_no) {
        return tB.receipt_no.localeCompare(tA.receipt_no);
      }
    }

    // Secondary sort: created_at descending
    const timeA = new Date(tA.created_at).getTime();
    const timeB = new Date(tB.created_at).getTime();
    return timeB - timeA;
  });

  const totalFilteredAmount = filteredGroups.reduce((sum: number, group: Transaction[]) => {
    const groupTotal = group.reduce((groupSum: number, item: Transaction) => groupSum + (item.final_price || 0), 0);
    return sum + groupTotal;
  }, 0);

  return (
    <div className="transaction-list">
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              placeholder="Cari transaksi (nama pelanggan)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem', height: '3rem' }} 
            />
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <div className="filter-container">
            {/* Filter by Waktu */}
            <div className="filter-item">
              <label className="filter-label">Filter by Waktu</label>
              <div className="desktop-filter-buttons" style={{ display: 'flex', gap: '0.4rem' }}>
                {['Semua', 'Hari Ini', '7 Hari', '30 Hari', 'Kustom'].map(tf => (
                  <button 
                    key={tf} 
                    onClick={() => setTimeFilter(tf as any)}
                    className={`tab-btn ${timeFilter === tf ? 'active' : ''}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <select 
                className="mobile-filter-select"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
              >
                {['Semua', 'Hari Ini', '7 Hari', '30 Hari', 'Kustom'].map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            {/* Filter by Proses */}
            <div className="filter-item">
              <label className="filter-label">Filter by Proses</label>
              <div className="desktop-filter-buttons" style={{ display: 'flex', gap: '0.4rem' }}>
                {['Semua', 'Baru', 'Proses', 'Siap Ambil', 'Siap Kirim', 'Selesai'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setFilter(s as any)}
                    className={`tab-btn ${filter === s ? 'active' : ''}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <select 
                className="mobile-filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                {['Semua', 'Baru', 'Proses', 'Siap Ambil', 'Siap Kirim', 'Selesai'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Filter by Payment */}
            <div className="filter-item">
              <label className="filter-label">Filter by Payment</label>
              <div className="desktop-filter-buttons" style={{ display: 'flex', gap: '0.4rem' }}>
                {['Semua', 'Lunas', 'Belum Lunas'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setPaymentFilter(p as any)}
                    className={`tab-btn ${paymentFilter === p ? 'active' : ''}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <select 
                className="mobile-filter-select"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
              >
                {['Semua', 'Lunas', 'Belum Lunas'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Manual Date Range Inputs */}
          {timeFilter === 'Kustom' && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Dari Tanggal:</p>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{ width: '100%', height: '2.5rem', fontSize: '0.8rem', padding: '0.4rem' }} 
                />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Sampai Tanggal:</p>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  style={{ width: '100%', height: '2.5rem', fontSize: '0.8rem', padding: '0.4rem' }} 
                />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Summary Stats (Owner Only) */}
      {!loading && filteredGroups.length > 0 && currentUser?.role === 'owner' && (
        <div className="glass-card animate-fade-in" style={{ 
          marginBottom: '1.5rem', 
          padding: '0.75rem 1.25rem', 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '0.75rem',
          background: 'linear-gradient(135deg, rgba(255, 0, 132, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(255, 0, 132, 0.1)'
        }}>
          <div style={{ flex: '1 1 120px' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Total Transaksi Terfilter:</p>
            <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{filteredGroups.length} <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6 }}>Nota</span></h4>
          </div>
          <div style={{ textAlign: 'right', flex: '1 1 120px' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Total Nilai:</p>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary)' }}>
              Rp {totalFilteredAmount.toLocaleString('id-ID')}
            </h4>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))' }}>
          {filteredGroups.map(group => {
                const t = group[0]; // Primary record
                const groupId = t.group_id || t.id;
                const totalGroupPrice = group.reduce((sum, item) => sum + item.final_price, 0);
                const allPaid = group.every(item => item.is_paid);
                const statusStyle = getStatusStyle(t.status) || { bg: 'rgba(255,255,255,0.1)', color: 'white' };
                const isOverdue = !['Siap Ambil', 'Siap Kirim'].includes(t.status) && t.due_date && new Date() > new Date(t.due_date);
                
                const customer = customers.find(c => c.id === t.customer_id) || customers.find(c => c.name === t.customer_name);
                const unpaidTransactions = transactions.filter(tr => 
                  !tr.is_paid && (
                    (t.customer_id && tr.customer_id) 
                      ? tr.customer_id === t.customer_id 
                      : tr.customer_name === t.customer_name
                  )
                );
                const totalDebt = unpaidTransactions.reduce((sum, tr) => sum + tr.final_price, 0);
                
                return (
                  <div key={groupId} className="glass-card animate-fade-in" style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem',
                    border: isOverdue ? '2px solid #ef4444' : '1px solid var(--glass-border)',
                    boxShadow: isOverdue ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                  }}>
                    {/* Responsive Header */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{t.customer_name}</h4>
                          <span style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.5, background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                            {formatDisplayId(customer ? getDisplayId(customer) : (t.customer?.customer_id || (t.customer_id ? `#DN-${t.customer_id.slice(0, 5).toUpperCase()}` : '#DN-NEW')))}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={12} /> {new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <span style={{ 
                          padding: '0.35rem 0.6rem', 
                          borderRadius: '8px', 
                          fontSize: '0.7rem', 
                          fontWeight: 800,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.color}44`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          whiteSpace: 'nowrap'
                        }}>
                          {['Siap Ambil', 'Siap Kirim'].includes(t.status) ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {t.status.toUpperCase()}
                        </span>
                        {t.receipt_no && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.8 }}>
                            #{t.receipt_no}
                          </span>
                        )}
                      </div>
                    </div>

                    {customer && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 600 }}>
                        <div style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: '1px solid rgba(37, 211, 102, 0.2)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Wallet size={10} /> Rp {(customer.wallet_balance || 0).toLocaleString()}
                        </div>
                        {totalDebt > 0 && (
                          <div style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={10} /> Hutang: Rp {totalDebt.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {group.map((item, idx) => (
                        <div key={item.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingTop: idx === 0 ? '0' : '0.4rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.service_name}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Rp {item.final_price.toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {item.weight} {item.unit || 'kg'} x Rp {((item.total_price / (item.weight || 1))).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <div style={{ 
                          background: allPaid ? 'rgba(37, 211, 102, 0.1)' : 'rgba(255, 0, 132, 0.1)',
                          color: allPaid ? '#25d366' : 'var(--primary)',
                          border: `1px solid ${allPaid ? 'rgba(37, 211, 102, 0.2)' : 'rgba(255, 0, 132, 0.2)'}`,
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {allPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {allPaid ? 'LUNAS' : 'BELUM LUNAS'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Total Bayar:</p>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>
                          Rp {totalGroupPrice.toLocaleString('id-ID')}
                        </h3>
                      </div>
                    </div>

                    {/* Action buttons list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                      <button 
                        onClick={() => { setSelectedTransaction(group as any); setIsReceiptOpen(true); }}
                        style={{ height: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', fontSize: '0.75rem' }}
                        title="Nota"
                      >
                        <Printer size={14} /> <span className="mobile-hide">Nota</span>
                      </button>
                      
                      <button 
                        onClick={() => handleWhatsAppShare(group)}
                        style={{ height: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', borderRadius: '8px', color: '#25D366' }}
                        title="WA"
                      >
                        <WhatsAppIcon size={16} color="#25D366" /> <span className="mobile-hide" style={{ marginLeft: '0.4rem' }}>WA</span>
                      </button>

                      <button 
                        onClick={() => { setEditingTransaction(group[0]); setIsEditOpen(true); }}
                        style={{ height: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.2)', color: '#FFC107', borderRadius: '8px' }}
                        title="Edit"
                      >
                        <Edit3 size={14} /> <span className="mobile-hide" style={{ marginLeft: '0.4rem' }}>Edit</span>
                      </button>

                      {(currentUser?.role === 'owner' || true) && (
                        <button 
                          onClick={() => handleDelete(groupId)}
                          style={{ height: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                          title="Hapus"
                        >
                          <Trash2 size={14} /> <span className="mobile-hide" style={{ marginLeft: '0.4rem' }}>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
                })}
            
            {filteredGroups.length === 0 && !loading && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <p>Tidak ada transaksi ditemukan.</p>
              </div>
            )}
          </div>
        )}
        
        {editingTransaction && (
          <EditTransactionModal 
            isOpen={isEditOpen}
            onClose={() => { setIsEditOpen(false); setEditingTransaction(null); }}
            onSave={handleUpdate}
            transaction={editingTransaction}
            groupTotal={editingTransaction.group_id ? transactions.filter(t => t.group_id === editingTransaction.group_id).reduce((sum, t) => sum + t.final_price, 0) : undefined}
          />
        )}
        
        {selectedTransaction && (
          <ReceiptModal 
            isOpen={isReceiptOpen}
            onClose={() => { setIsReceiptOpen(false); setSelectedTransaction(null); }}
            transaction={selectedTransaction}
            settings={settings}
            customers={customers}
          />
        )}
      </div>
    );
  };
