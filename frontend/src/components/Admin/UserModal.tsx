import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export const UserModal = ({ isOpen, onClose, onSave, initialData }: UserModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        username: initialData.username || '',
        password: '', // Password is not returned by API for security, blank means no change
        role: initialData.role || 'staff'
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'staff'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = { 
      ...formData,
      name: formData.name.trim(),
      username: formData.username.trim()
    };
    if (initialData && !formData.password.trim()) {
      delete (submissionData as any).password;
    } else if (formData.password.trim()) {
      submissionData.password = formData.password.trim();
    }
    onSave(submissionData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card modal-content"
        style={{ maxWidth: '450px', width: '90%', padding: '2rem', border: '1px solid var(--glass-border)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
            <User size={20} color="var(--primary)" /> {initialData ? 'Edit User' : 'Tambah User Baru'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Nama Lengkap</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Budi Santoso"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Username</label>
            <input 
              type="text" 
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Contoh: budi123"
              style={{ width: '100%' }}
              disabled={initialData && initialData.username === 'admin'}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
              {initialData ? 'Ganti Password (Kosongkan jika tidak diubah)' : 'Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required={!initialData}
                placeholder={initialData ? "••••••••" : "Masukkan password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Role / Hak Akses</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className={`tab-btn ${formData.role === 'owner' ? 'active' : ''}`}
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', justifyContent: 'center' }}
                onClick={() => setFormData({ ...formData, role: 'owner' })}
                disabled={initialData && initialData.username === 'admin'}
              >
                <Shield size={14} /> Owner
              </button>
              <button
                type="button"
                className={`tab-btn ${formData.role === 'staff' ? 'active' : ''}`}
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', justifyContent: 'center' }}
                onClick={() => setFormData({ ...formData, role: 'staff' })}
                disabled={initialData && initialData.username === 'admin'}
              >
                <User size={14} /> Staff
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="tab-btn" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>{initialData ? 'Update User' : 'Simpan User'}</button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};
