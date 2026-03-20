import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import type { CustomerType } from '../../types';

interface CustomerTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: Partial<CustomerType>) => void;
  initialData?: CustomerType | null;
}

export const CustomerTypeModal = ({ isOpen, onClose, onSave, initialData }: CustomerTypeModalProps) => {
  const [formData, setFormData] = useState<Partial<CustomerType>>({
    name: '',
    discount_percent: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', discount_percent: 0 });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="glass-card modal-content" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600 }}>{initialData ? 'Edit Level Member' : 'Tambah Level Member'}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Nama Level</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Misal: Platinum, VIP"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Diskon (%)</label>
            <input 
              type="number" 
              required
              min="0"
              max="100"
              value={formData.discount_percent}
              onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Simpan Level
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
