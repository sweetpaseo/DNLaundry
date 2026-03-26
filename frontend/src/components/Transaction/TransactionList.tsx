import { useState, useEffect } from 'react';
import { Printer, Trash2, CheckCircle, Clock, Search, Loader2, Edit3, Wallet } from 'lucide-react';
import type { Transaction, TransactionStatus, Customer } from '../../types';
import { api } from '../../services/api';
import { ReceiptModal } from './ReceiptModal';
import { EditTransactionModal } from './EditTransactionModal';
import { WhatsAppIcon } from '../Icons'; 
import { getWhatsAppUrl } from '../../utils/whatsapp';
import { getDisplayId, formatDisplayId } from '../../utils/customer';

export const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | 'Semua'>('Semua');
  const [paymentFilter, setPaymentFilter] = useState<'Semua' | 'Lunas' | 'Belum Lunas'>('Semua');
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

    // Search Filter (customer name)
    const matchesSearch = !searchTerm || t.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPayment && matchesSearch;
  }).sort((a, b) => {
    const isSelesaiA = a[0].status === 'Selesai';
    const isSelesaiB = b[0].status === 'Selesai';

    // Prioritize non-Selesai (active transactions)
    if (isSelesaiA !== isSelesaiB) {
      return isSelesaiA ? 1 : -1;
    }

    // Secondary sort: newest first
    const timeA = new Date(a[0].created_at).getTime();
    const timeB = new Date(b[0].created_at).getTime();
    return timeB - timeA;
  });

  return (
    <div className="transaction-list">
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <input 
              type="text" 
              placeholder="Cari transaksi (nama pelanggan)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem', height: '3rem' }} 
            />
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem' }}>
              {['Semua', 'Baru', 'Proses', 'Siap Ambil', 'Siap Kirim', 'Selesai'].map(s => (
                <button 
                  key={s} 
                  className={`tab-btn ${filter === s ? 'active' : ''}`}
                  style={{ 
                    padding: '0.6rem 1.2rem', 
                    fontSize: '0.875rem', 
                    border: '1px solid var(--glass-border)',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setFilter(s as any)}
                >
                  {s}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {['Semua', 'Lunas', 'Belum Lunas'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setPaymentFilter(p as any)}
                  style={{ 
                    padding: '0.4rem 1rem', 
                    fontSize: '0.75rem', 
                    background: paymentFilter === p ? 'var(--primary-gradient)' : 'transparent',
                    color: paymentFilter === p ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.25rem',
                    border: isOverdue ? '2px solid #ef4444' : '1px solid var(--glass-border)',
                    boxShadow: isOverdue ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t.customer_name}</h4>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.4, background: 'rgba(255,255,255,0.1)', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>
                          {formatDisplayId(customer ? getDisplayId(customer) : (t.customer?.customer_id || (t.customer_id ? `#DN-${t.customer_id.slice(0, 5).toUpperCase()}` : '#DN-NEW')))}
                        </span>
                        {t.receipt_no && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(255, 0, 132, 0.1)', padding: '0.05rem 0.3rem', borderRadius: '4px', border: '1px solid rgba(255, 0, 132, 0.2)' }}>
                            #{t.receipt_no}
                          </span>
                        )}
                      </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={14} /> {new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      <span style={{ 
                        padding: '0.4rem 0.75rem', 
                        borderRadius: '8px', 
                        fontSize: '0.75rem', 
                        fontWeight: 800,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.color}44`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        {['Siap Ambil', 'Siap Kirim'].includes(t.status) ? <CheckCircle size={14} /> : <Clock size={14} />}
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    {customer && (
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        <div style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: '1px solid rgba(37, 211, 102, 0.2)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Wallet size={12} /> Saldo: Rp {(customer.wallet_balance || 0).toLocaleString()}
                        </div>
                        {totalDebt > 0 && (
                          <div style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> Saldo Gantung: Rp {totalDebt.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {group.map((item, idx) => (
                        <div key={item.id} style={{ display: idx === 0 ? 'block' : 'block', borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingTop: idx === 0 ? '0' : '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 700, color: 'white' }}>{item.service_name}</span>
                            <span style={{ fontWeight: 700, color: 'white' }}>Rp {item.final_price.toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {item.weight} {item.unit || 'kg'} x Rp {((item.total_price / item.weight)).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{ 
                          background: allPaid ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 0, 132, 0.1)',
                          color: allPaid ? 'var(--text-muted)' : 'var(--primary)',
                          border: `1px solid ${allPaid ? 'var(--glass-border)' : 'rgba(255, 0, 132, 0.2)'}`,
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {allPaid ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {allPaid ? 'LUNAS' : 'BELUM LUNAS'}
                        </button>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Total Bayar:</p>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>
                          Rp {totalGroupPrice.toLocaleString('id-ID')}
                        </h3>
                      </div>
                    </div>

                      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                        <button 
                          title="Cetak Nota" 
                          onClick={() => { setSelectedTransaction(group as any); setIsReceiptOpen(true); }}
                          style={{ flex: 1, height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          <Printer size={16} /> Nota
                        </button>
                        
                        <button 
                          onClick={() => handleWhatsAppShare(group)}
                          className="btn-secondary"
                          style={{ width: '2.5rem', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', borderRadius: '8px' }}
                          title="Kirim ke WhatsApp"
                        >
                          <WhatsAppIcon size={18} color="#25D366" />
                        </button>

                        <button 
                          onClick={() => { setEditingTransaction(group[0]); setIsEditOpen(true); }}
                          className="btn-secondary"
                          style={{ width: '2.5rem', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.2)', color: '#FFC107', borderRadius: '8px' }}
                          title="Edit Transaksi"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button 
                          onClick={() => handleDelete(groupId)}
                          style={{ 
                            width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={16} />
                        </button>
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
