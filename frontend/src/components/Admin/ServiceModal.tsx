import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import type { Service } from '../../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Partial<Service>) => void;
  initialData?: Service | null;
}

export const ServiceModal = ({ isOpen, onClose, onSave, initialData }: ServiceModalProps) => {
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    price_normal: 0,
    price_member: 0,
    price_express: 0,
    price_special: 0,
    unit: 'kg',
    is_active: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ 
        name: '', 
        price_normal: 0, 
        price_member: 0, 
        price_express: 0, 
        price_special: 0, 
        unit: 'kg', 
        is_active: true 
      });
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
          <h3 style={{ fontWeight: 600 }}>Konfigurasi Harga: {formData.name || 'Baru'}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Nama Layanan</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Misal: Cuci Sepatu"
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Satuan</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="kg">Per Kilogram (kg)</option>
                <option value="pcs">Per Potong (pcs)</option>
                <option value="m2">Per Meter (m2)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Harga Normal (Rp)</label>
              <input 
                type="number" 
                required
                value={formData.price_normal || 0}
                onChange={(e) => setFormData({ ...formData, price_normal: Number(e.target.value) })}
                style={{ width: '100%', borderColor: 'var(--glass-border)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--primary)' }}>Harga Member (Rp)</label>
              <input 
                type="number" 
                required
                value={formData.price_member || 0}
                onChange={(e) => setFormData({ ...formData, price_member: Number(e.target.value) })}
                style={{ width: '100%', borderColor: 'var(--primary)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--accent)' }}>Harga Express (Rp)</label>
              <input 
                type="number" 
                required
                value={formData.price_express || 0}
                onChange={(e) => setFormData({ ...formData, price_express: Number(e.target.value) })}
                style={{ width: '100%', borderColor: 'var(--accent)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: '#fbbf24' }}>Harga Special (Rp)</label>
              <input 
                type="number" 
                required
                value={formData.price_special || 0}
                onChange={(e) => setFormData({ ...formData, price_special: Number(e.target.value) })}
                style={{ width: '100%', borderColor: '#fbbf24' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Tipe Komisi</label>
              <select 
                value={formData.commission_type || 'fixed'}
                onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as 'percentage' | 'fixed' })}
                style={{ width: '100%' }}
              >
                <option value="fixed">Rupiah (Rp)</option>
                <option value="percentage">Persentase (%)</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Besaran Komisi</label>
              <input 
                type="number" 
                value={formData.commission_value || 0}
                onChange={(e) => setFormData({ ...formData, commission_value: Number(e.target.value) })}
                style={{ width: '100%' }}
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span style={{ fontSize: '0.875rem' }}>Status Aktif</span>
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Simpan Layanan
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
