import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import type { Incentive } from '../../types';

interface IncentiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incentive: Partial<Incentive>) => void;
  employeeName: string;
}

export const IncentiveModal = ({ isOpen, onClose, onSave, employeeName }: IncentiveModalProps) => {
  const [formData, setFormData] = useState<Partial<Incentive>>({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

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
          <h3 style={{ fontWeight: 600 }}>Berikan Insentif: {employeeName}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Jumlah Insentif (Rp)</label>
            <input 
              type="number" 
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="0"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Keterangan</label>
            <textarea 
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Misal: Bonus lembur, Tips pelanggan..."
              style={{ width: '100%', padding: '0.8rem', minHeight: '80px' }}
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
            <Save size={18} /> Simpan Insentif
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
