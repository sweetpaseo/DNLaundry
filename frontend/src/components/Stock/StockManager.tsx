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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Manajemen Stok</h2>
          <p style={{ color: 'var(--text-muted)' }}>Kontrol pemakaian bahan dan perlengkapan laundry</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Package size={16} /> Daftar Barang
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('history'); fetchData(); }}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <History size={16} /> Riwayat Mutasi
          </button>
          {user.role === 'owner' && (
            <button 
              className="btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => { setSelectedStock(null); setIsItemModalOpen(true); }}
            >
              <Plus size={18} /> Barang Baru
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>Loading data stok...</div>
      ) : activeTab === 'inventory' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
                  className="glass-card" 
                  style={{ 
                    padding: '1.5rem', 
                    position: 'relative',
                    border: isLow ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--glass-border)',
                    background: isLow ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.02)'
                  }}
                >
                  {isLow && (
                    <div style={{ 
                      position: 'absolute', top: '1rem', right: '1rem', 
                      background: '#f43f5e', color: 'white', 
                      padding: '0.2rem 0.5rem', borderRadius: '6px', 
                      fontSize: '0.65rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', gap: '0.2rem',
                      boxShadow: '0 0 10px rgba(244, 63, 94, 0.4)'
                    }}>
                      <AlertTriangle size={10} /> LOW STOCK
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{stock.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Satuan: {stock.unit}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: isLow ? '#f43f5e' : 'white' }}>
                      {stock.current_stock}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{stock.unit}</span>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      <span>Batas Minimum: {stock.min_stock} {stock.unit}</span>
                      <span>{Math.round((stock.current_stock / (stock.min_stock * 3)) * 100)}% Aman</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (stock.current_stock / (stock.min_stock * 3)) * 100)}%` }}
                        style={{ 
                          height: '100%', 
                          background: isLow ? '#f43f5e' : 'var(--primary-gradient)',
                          boxShadow: isLow ? '0 0 10px rgba(244, 63, 94, 0.5)' : 'none'
                        }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: '#f43f5e' }}
                      onClick={() => { setSelectedStock(stock); setMovementType('out'); setIsMovementModalOpen(true); }}
                    >
                      <Minus size={14} /> Gunakan
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: '#10b981' }}
                      onClick={() => { setSelectedStock(stock); setMovementType('in'); setIsMovementModalOpen(true); }}
                    >
                      <Plus size={14} /> Isi Ulang
                    </button>
                  </div>

                  {user.role === 'owner' && (
                    <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', opacity: 0.3 }}>
                      <button onClick={() => { setSelectedStock(stock); setIsItemModalOpen(true); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><Edit size={14} /></button>
                      <button onClick={() => handleDeleteItem(stock.id)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  )}
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
              } catch (e) { alert('Gagal menyimpan barang'); }
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Nama Barang</label>
                <input name="name" defaultValue={selectedStock?.name} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Satuan (Liter, Kg, dll)</label>
                  <input name="unit" defaultValue={selectedStock?.unit} placeholder="Liter" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Batas Minimum</label>
                  <input name="min_stock" type="number" defaultValue={selectedStock?.min_stock || 5} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setIsItemModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>Simpan</button>
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
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: movementType === 'in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: movementType === 'in' ? '#10b981' : '#f43f5e' }}>
                {movementType === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
              </div>
              <h3 style={{ margin: 0 }}>{movementType === 'in' ? 'Isi Ulang' : 'Pakai'} {selectedStock?.name}</h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleRecordMovement(Number(formData.get('amount')), formData.get('note') as string);
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Jumlah ({selectedStock?.unit})</label>
                <input name="amount" type="number" step="any" required autoFocus style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '1.25rem', fontWeight: 700 }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Catatan</label>
                <textarea name="note" placeholder="Contoh: Pemakaian harian / Belanja di Grosir" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', minHeight: 80 }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setIsMovementModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem', background: movementType === 'in' ? '#10b981' : '#f43f5e' }}>
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
