import { useState, useEffect } from 'react';
import { Printer, Trash2, Edit3, CheckCircle, Clock, Search, Loader2 } from 'lucide-react';
import type { Transaction, TransactionStatus } from '../../types';
import { api } from '../../services/api';
import { ReceiptModal } from './ReceiptModal';
import { EditTransactionModal } from './EditTransactionModal';

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    try {
      await api.deleteTransaction(id);
      fetchTransactions();
    } catch (error) {
      alert('Gagal menghapus transaksi');
    }
  };

  useEffect(() => {
    fetchTransactions();
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const filteredData = transactions
    .filter(t => filter === 'Semua' ? true : t.status === filter)
    .filter(t => t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusStyle = (status: TransactionStatus) => {
    switch (status) {
      case 'Baru': return { bg: 'rgba(255, 0, 132, 0.1)', color: '#FF0084' };
      case 'Proses': return { bg: 'rgba(211, 211, 211, 0.1)', color: '#D3D3D3' };
      case 'Siap Ambil': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399' };
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
            {['Semua', 'Baru', 'Proses', 'Siap Ambil'].map(s => (
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
                const totalGroupPrice = group.reduce((sum, item) => sum + item.final_price, 0);
                const allPaid = group.every(item => item.is_paid);
                const statusStyle = getStatusStyle(t.status); // Use first item's status
                const isOverdue = t.status !== 'Siap Ambil' && t.due_date && new Date() > new Date(t.due_date);
                
                return (
                  <div key={t.group_id || t.id} className="glass-card animate-fade-in" style={{ 
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
                        {t.status === 'Siap Ambil' ? <CheckCircle size={14} /> : <Clock size={14} />}
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {group.map((item, idx) => (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx === group.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: idx === group.length - 1 ? '0' : '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                            <span style={{ fontWeight: 600 }}>{item.service_name}</span>
                            <span style={{ fontWeight: 700 }}>Rp {item.final_price.toLocaleString('id-ID')}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.weight} {item.unit || 'kg'} x Rp {(item.final_price / item.weight).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Total Bayar:</p>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>
                          Rp {totalGroupPrice.toLocaleString('id-ID')}
                        </h3>
                      </div>
                      <button style={{ 
                        background: allPaid ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 0, 132, 0.1)',
                        color: allPaid ? '#D3D3D3' : '#FF0084',
                        border: `1px solid ${allPaid ? 'rgba(255,255,255,0.1)' : '#FF0084'}`,
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'default'
                      }}>
                        {allPaid ? 'LUNAS' : 'BELUM BAYAR'}
                      </button>
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
                        title="Hapus" 
                        onClick={async () => {
                          if (window.confirm(`Hapus ${group.length} item dalam transaksi ini?`)) {
                            try {
                              for (const item of group) await api.deleteTransaction(item.id);
                              fetchTransactions();
                            } catch (e) {
                              alert('Gagal menghapus transaksi');
                            }
                          }
                        }}
                        style={{ 
                          width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', transition: 'all 0.2s'
                        }}
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
