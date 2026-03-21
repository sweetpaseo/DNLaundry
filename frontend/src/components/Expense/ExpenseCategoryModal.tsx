import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Tag } from 'lucide-react';
import type { ExpenseCategory } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<ExpenseCategory>) => void;
  initialData?: ExpenseCategory | null;
}

export const ExpenseCategoryModal = ({ isOpen, onClose, onSave, initialData }: CategoryModalProps) => {
  const [name, setName] = useState('');
  const [cashType, setCashType] = useState<'petty' | 'main'>('petty');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setCashType(initialData?.cash_type || 'petty');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="glass-card modal-content" style={{ padding: '2rem', border: '1px solid var(--glass-border)', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag size={20} color="var(--primary)" /> {initialData ? 'Edit' : 'Tambah'} Kategori Biaya
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, cash_type: cashType }); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Nama Kategori</label>
            <input 
              type="text" 
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Listrik, Air, Gaji Staff"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Tipe Kas</label>
            <select 
              value={cashType}
              onChange={(e) => setCashType(e.target.value as 'petty' | 'main')}
              style={{ width: '100%' }}
              required
            >
              <option value="petty">Kas Kecil (Staff)</option>
              <option value="main">Kas Utama (Owner)</option>
            </select>
            <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {cashType === 'petty' 
                ? 'Dapat diakses oleh staff di tab transaksi.' 
                : 'Hanya dapat diakses oleh admin/owner di dashboard.'}
            </p>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Simpan Kategori
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
