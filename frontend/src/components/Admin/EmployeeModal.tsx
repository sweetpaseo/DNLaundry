import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import type { Employee } from '../../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Partial<Employee>) => void;
  initialData?: Employee | null;
}

export const EmployeeModal = ({ isOpen, onClose, onSave, initialData }: EmployeeModalProps) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    phone: '',
    base_salary: 0,
    is_active: true,
    join_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ 
        name: '', 
        phone: '', 
        base_salary: 0, 
        is_active: true,
        join_date: new Date().toISOString().split('T')[0]
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
          <h3 style={{ fontWeight: 600 }}>{initialData ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Nama Lengkap</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Misal: Budi Santoso"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Nomor Telepon/WA</label>
            <input 
              type="text" 
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0812..."
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Tgl Masuk Kerja</label>
            <input 
              type="date" 
              required
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Gaji Pokok (Rp)</label>
            <input 
              type="number" 
              required
              value={formData.base_salary}
              onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
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
            <Save size={18} /> Simpan Data Karyawan
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
