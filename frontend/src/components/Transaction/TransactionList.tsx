import { useState, useEffect } from 'react';
import { Printer, Trash2, Edit3, CheckCircle, Clock, Search, Loader2 } from 'lucide-react';
import type { Transaction, TransactionStatus } from '../../types';
import { api } from '../../services/api';
import { ReceiptModal } from './ReceiptModal';

export const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | 'Semua'>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
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
          {filteredData.map(t => {
            const statusStyle = getStatusStyle(t.status);
            return (
              <div key={t.id} className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Layanan:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.service_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Jumlah:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.weight} kg/pcs</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Total Bayar:</p>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>
                      Rp {t.total_price.toLocaleString('id-ID')}
                    </h3>
                  </div>
                  <button style={{ 
                    background: t.is_paid ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 0, 132, 0.1)',
                    color: t.is_paid ? '#D3D3D3' : '#FF0084',
                    border: `1px solid ${t.is_paid ? 'rgba(255,255,255,0.1)' : '#FF0084'}`,
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'default'
                  }}>
                    {t.is_paid ? 'LUNAS' : 'BELUM BAYAR'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                  <button 
                    title="Cetak Nota" 
                    onClick={() => { setSelectedTransaction(t); setIsReceiptOpen(true); }}
                    style={{ flex: 1, height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <Printer size={16} /> Nota
                  </button>
                  <button 
                    title="Edit" 
                    style={{ 
                      width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    title="Hapus" 
                    style={{ 
                      width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!loading && filteredData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>Tidak ada transaksi ditemukan.</p>
        </div>
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
