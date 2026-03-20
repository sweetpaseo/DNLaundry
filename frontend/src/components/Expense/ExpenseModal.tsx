import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Receipt } from 'lucide-react';
import type { Expense } from '../../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<Expense>) => void;
  initialData?: Expense | null;
}

const CATEGORIES = ['Listrik & Air', 'Sabun & Kimia', 'Plastik & Packing', 'Transportasi', 'Lain-lain'];

export const ExpenseModal = ({ isOpen, onClose, onSave, initialData }: ExpenseModalProps) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    amount: 0,
    category: CATEGORIES[0],
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({
          amount: 0,
          category: CATEGORIES[0],
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="glass-card modal-content" style={{ padding: '2rem', border: '1px solid var(--glass-border)', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt size={20} color="var(--primary)" /> {initialData ? 'Edit' : 'Catat'} Pengeluaran (Kas Kecil)
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Jumlah Pengeluaran (Rp)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              style={{ width: '100%', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Kategori</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{ width: '100%' }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Keterangan</label>
            <textarea 
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Misal: Beli sabun cair 5L"
              style={{ width: '100%', minHeight: '80px', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Tanggal</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} /> {initialData ? 'Update' : 'Simpan'} Pengeluaran
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
