import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import type { MemberType } from '../../types';

interface MemberTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: Partial<MemberType>) => void;
  initialData?: MemberType | null;
}

export const MemberTypeModal = ({ isOpen, onClose, onSave, initialData }: MemberTypeModalProps) => {
  const [formData, setFormData] = useState<Partial<MemberType>>({
    name: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '' });
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
          <h3 style={{ fontWeight: 600 }}>{initialData ? 'Edit Jenis Member' : 'Tambah Jenis Member'}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Nama Jenis Member</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Misal: Platinum, VIP, Regular"
              style={{ width: '100%' }}
            />
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            * Harga untuk jenis member ini dikonfigurasi langsung di menu Layanan & Harga.
          </p>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Simpan Jenis Member
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
