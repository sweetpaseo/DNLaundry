import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Stock, StockLog } from '../../types';
import { Package, Plus, Minus, History, AlertTriangle, ArrowUpRight, ArrowDownLeft, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

interface StockManagerProps {
  user: any;
}

export function StockManager({ user }: StockManagerProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  
  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [movementType, setMovementType] = useState<'in' | 'out'>('out');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockData, logData] = await Promise.all([
        api.getStock(),
        activeTab === 'history' ? api.getStockLogs() : Promise.resolve([])
      ]);
      setStocks(stockData);
      setLogs(logData);
    } catch (e) {
      console.error('Failed to fetch stock data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMovement = async (amount: number, note: string) => {
    if (!selectedStock) return;
    try {
      await api.recordStockMovement({
        stock_id: selectedStock.id,
        type: movementType,
        amount,
        note,
        user_id: user.id
      });
      setIsMovementModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Gagal mencatat mutasi stok');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Hapus barang ini dari list stok? Riwayat mutasi juga akan terhapus.')) return;
    try {
      await api.deleteStock(id);
      fetchData();
    } catch (e) {
      alert('Gagal menghapus barang');
    }
  };

  return (
    <div className="stock-manager">
      <div className="stock-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e1b4b' }}>Manajemen Stok</h2>
          <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Kontrol pemakaian bahan & perlengkapan laundry</p>
        </div>
        <div className="stock-subnav">
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
            style={{ padding: '0.6rem 1rem', fontSize: '0.825rem', fontWeight: 700, borderRadius: '16px' }}
          >
            <Package size={16} /> Daftar Barang
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('history'); fetchData(); }}
            style={{ padding: '0.6rem 1rem', fontSize: '0.825rem', fontWeight: 700, borderRadius: '16px' }}
          >
            <History size={16} /> Riwayat Mutasi
          </button>
          {user.role === 'owner' && (
            <button 
              className="btn-primary btn-new-item" 
              style={{ padding: '0.6rem 1rem', fontSize: '0.825rem', fontWeight: 800, borderRadius: '16px', background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 8px 20px rgba(126, 34, 206, 0.3)' }}
              onClick={() => { setSelectedStock(null); setIsItemModalOpen(true); }}
            >
              <Plus size={16} /> Barang Baru
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>Loading data stok...</div>
      ) : activeTab === 'inventory' ? (
        <div className="stock-grid">
          {stocks.length === 0 ? (
            <div className="glass-card" style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada data barang. Klik "Barang Baru" untuk menambahkan.
            </div>
          ) : (
            stocks.map(stock => {
              const isLow = stock.current_stock <= stock.min_stock;
              return (
                <motion.div 
                  key={stock.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="clay-card" 
                  style={{ 
                    padding: '1.4rem', 
                    position: 'relative',
                    border: isLow ? '2px solid rgba(244, 63, 94, 0.4)' : '2.5px solid rgba(255, 255, 255, 0.95)',
                    background: isLow ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' : '#ffffff'
                  }}
                >
                  {/* Card Header: Title & Action Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '0.25rem' }}>{stock.name}</h3>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, background: '#f3eef9', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                        Satuan: {stock.unit}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {isLow && (
                        <div style={{ 
                          background: '#f43f5e', color: 'white', 
                          padding: '0.2rem 0.5rem', borderRadius: '8px', 
                          fontSize: '0.65rem', fontWeight: 800,
                          display: 'flex', alignItems: 'center', gap: '0.2rem',
                          boxShadow: '0 4px 10px rgba(244, 63, 94, 0.3)'
                        }}>
                          <AlertTriangle size={10} /> LOW
                        </div>
                      )}

                      {user.role === 'owner' && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => { setSelectedStock(stock); setIsItemModalOpen(true); }} title="Edit Barang" style={{ background: '#f3eef9', border: 'none', color: '#7e22ce', width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit size={13} /></button>
                          <button onClick={() => handleDeleteItem(stock.id)} title="Hapus Barang" style={{ background: '#ffe4e6', border: 'none', color: '#f43f5e', width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '1.25rem 0' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: isLow ? '#f43f5e' : '#7e22ce', lineHeight: 1 }}>
                      {stock.current_stock}
                    </span>
                    <span style={{ color: '#6b7280', fontWeight: 700, fontSize: '0.9rem' }}>{stock.unit}</span>
                  </div>

                  {/* Safety Level Bar */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.4rem' }}>
                      <span>Min: {stock.min_stock} {stock.unit}</span>
                      <span>{Math.round((stock.current_stock / (stock.min_stock * 3)) * 100)}% Aman</span>
                    </div>
                    <div style={{ height: 8, background: '#f3eef9', borderRadius: 10, overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (stock.current_stock / (stock.min_stock * 3)) * 100)}%` }}
                        style={{ 
                          height: '100%', 
                          background: isLow ? '#f43f5e' : 'linear-gradient(90deg, #2dd4bf 0%, #10b981 100%)',
                          borderRadius: 10
                        }} 
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="stock-action-grid">
                    <button 
                      className="stock-action-btn"
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        height: '46px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                        color: 'white', fontWeight: 800, fontSize: '0.85rem',
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 8px 18px rgba(244, 63, 94, 0.3)'
                      }}
                      onClick={() => { setSelectedStock(stock); setMovementType('out'); setIsMovementModalOpen(true); }}
                    >
                      <Minus size={15} /> Gunakan
                    </button>

                    <button 
                      className="stock-action-btn"
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        height: '46px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #2dd4bf 0%, #10b981 100%)',
                        color: 'white', fontWeight: 800, fontSize: '0.85rem',
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 8px 18px rgba(16, 185, 129, 0.3)'
                      }}
                      onClick={() => { setSelectedStock(stock); setMovementType('in'); setIsMovementModalOpen(true); }}
                    >
                      <Plus size={15} /> Isi Ulang
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700 }}>Tangal</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700 }}>Barang</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700 }}>Tipe</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700 }}>Jumlah</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700 }}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{log.stock?.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      background: log.type === 'in' ? 'rgba(16, 185, 129, 0.1)' : log.type === 'out' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: log.type === 'in' ? '#10b981' : log.type === 'out' ? '#f43f5e' : 'white'
                    }}>
                      {log.type === 'in' ? 'Isi Ulang' : log.type === 'out' ? 'Pemakaian' : 'Penyesuaian'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    {log.type === 'in' ? '+' : '-'}{log.amount} {log.stock?.unit}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada histori mutasi.</div>}
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="modal-overlay">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-content glass-card" style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{selectedStock ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name'),
                unit: formData.get('unit'),
                min_stock: Number(formData.get('min_stock'))
              };
              try {
                if (selectedStock) await api.updateStock(selectedStock.id, data);
                else await api.createStock(data);
                setIsItemModalOpen(false);
                fetchData();
              } catch (e: any) { alert(e.message || 'Gagal menyimpan barang'); }
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Nama Barang</label>
                <input name="name" defaultValue={selectedStock?.name} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Satuan (Liter, Kg, dll)</label>
                  <input name="unit" defaultValue={selectedStock?.unit} placeholder="Liter" required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Batas Minimum</label>
                  <input name="min_stock" type="number" defaultValue={selectedStock?.min_stock || 5} required style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setIsItemModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem', fontWeight: 800 }}>Simpan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <div className="modal-overlay">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-content glass-card" style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: movementType === 'in' ? '#ECFDF5' : '#FEF2F2', color: movementType === 'in' ? '#059669' : '#DC2626', border: `1px solid ${movementType === 'in' ? '#A7F3D0' : '#FECDD3'}` }}>
                {movementType === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
              </div>
              <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>{movementType === 'in' ? 'Isi Ulang' : 'Pakai'} {selectedStock?.name}</h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleRecordMovement(Number(formData.get('amount')), formData.get('note') as string);
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Jumlah ({selectedStock?.unit})</label>
                <input name="amount" type="number" step="any" required autoFocus style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Catatan</label>
                <textarea name="note" placeholder="Contoh: Pemakaian harian / Belanja di Grosir" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600, minHeight: 80 }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setIsMovementModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem', background: movementType === 'in' ? '#059669' : '#DC2626', fontWeight: 800 }}>
                  {movementType === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
