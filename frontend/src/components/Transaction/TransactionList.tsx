import { useState, useEffect } from 'react';
import { Printer, Trash2, CheckCircle, Clock, Search, Loader2, Edit3, Wallet } from 'lucide-react';
import type { Transaction, TransactionStatus, Customer } from '../../types';
import { api } from '../../services/api';
import { ReceiptModal } from './ReceiptModal';
import { EditTransactionModal } from './EditTransactionModal';
import { WhatsAppIcon } from '../Icons'; 
import { getWhatsAppUrl } from '../../utils/whatsapp';

export const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | 'Semua'>('Semua');
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
      if (transaction?.group_id) {
        const groupItems = transactions.filter(t => t.group_id === transaction.group_id);
        for (const item of groupItems) {
          await api.updateTransaction(item.id, data);
        }
      } else {
        await api.updateTransaction(id, data);
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

    let message = `*Detail Transaksi Laundry*\n\n`;
    message += `Nama Pelanggan: *${firstTransaction.customer_name}*\n`;
    message += `Status: *${firstTransaction.status}*\n`;
    message += `Tanggal Masuk: ${new Date(firstTransaction.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}\n`;
    if (firstTransaction.due_date) {
      message += `Estimasi Selesai: ${new Date(firstTransaction.due_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}\n`;
    }
    message += `\n*Daftar Layanan:*\n`;
    group.forEach((item, index) => {
      message += `${index + 1}. ${item.service_name} (${item.weight} ${item.unit || 'kg'}) - Rp ${item.final_price.toLocaleString('id-ID')}\n`;
    });
    message += `\nTotal Pembayaran: *Rp ${totalGroupPrice.toLocaleString('id-ID')}*\n`;
    message += `Status Pembayaran: *${allPaid ? 'LUNAS' : 'BELUM BAYAR'}*\n`;
    message += `\nTerima kasih telah menggunakan layanan kami!`;

    const whatsappUrl = getWhatsAppUrl(settings.phone, message);
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    fetchTransactions();
    api.getSettings().then(setSettings).catch(() => {});
    api.getCustomers().then(setCustomers).catch(() => {});
  }, []);

  const filteredData = transactions
    .filter(t => filter === 'Semua' ? true : t.status === filter)
    .filter(t => t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusStyle = (status: TransactionStatus) => {
    switch (status) {
      case 'Baru': return { bg: 'rgba(255, 0, 132, 0.1)', color: '#FF0084' };
      case 'Proses': return { bg: 'rgba(211, 211, 211, 0.1)', color: '#D3D3D3' };
      case 'Siap Ambil': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399' };
      case 'Siap Kirim': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' };
    }
  };

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
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem' }}>
            {['Semua', 'Baru', 'Proses', 'Siap Ambil', 'Siap Kirim'].map(s => (
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
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))' }}>
          {/* Grouping Logic */}
          {(() => {
            const grouped = filteredData.reduce((acc, t) => {
              const gid = t.group_id || t.id;
              if (!acc[gid]) acc[gid] = [];
              acc[gid].push(t);
              return acc;
            }, {} as Record<string, Transaction[]>);

            return Object.values(grouped)
              .sort((a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime())
              .map(group => {
                const t = group[0]; // Primary record
                const groupId = t.group_id || t.id;
                const totalGroupPrice = group.reduce((sum, item) => sum + item.final_price, 0);
                const allPaid = group.every(item => item.is_paid);
                const statusStyle = getStatusStyle(t.status) || { bg: 'rgba(255,255,255,0.1)', color: 'white' };
                const isOverdue = !['Siap Ambil', 'Siap Kirim'].includes(t.status) && t.due_date && new Date() > new Date(t.due_date);
                
                const customer = customers.find(c => c.id === t.customer_id);
                const unpaidTransactions = transactions.filter(tr => tr.customer_id === t.customer_id && !tr.is_paid);
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
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.2rem' }}>{t.customer_name}</h4>
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
                            <Clock size={12} /> Total Hutang: Rp {totalDebt.toLocaleString()}
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
                          {allPaid ? 'LUNAS' : 'BELUM BAYAR'}
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
              });
          })()}
        </div>
      )}
      
      {!loading && filteredData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>Tidak ada transaksi ditemukan.</p>
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
        />
      )}
    </div>
  );
};
