import React, { useState, useEffect } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If editing and password is blank, we might want to exclude it from the update 
    // but the backend handler will handle it or we can filter here.
    const submissionData = { ...formData };
    if (initialData && !submissionData.password) {
      delete (submissionData as any).password;
    }
    onSave(submissionData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card modal-content"
        style={{ maxWidth: '450px', width: '90%', padding: '2rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary)" /> {initialData ? 'Edit User' : 'Tambah User Baru'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Contoh: budi123"
              disabled={initialData && initialData.username === 'admin'}
            />
          </div>

          <div className="form-group">
            <label>{initialData ? 'Ganti Password (Kosongkan jika tidak diubah)' : 'Password'}</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required={!initialData}
                placeholder={initialData ? "••••••••" : "Masukkan password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Role / Hak Akses</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className={`tab-btn ${formData.role === 'owner' ? 'active' : ''}`}
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem' }}
                onClick={() => setFormData({ ...formData, role: 'owner' })}
                disabled={initialData && initialData.username === 'admin'}
              >
                <Shield size={14} /> Owner
              </button>
              <button
                type="button"
                className={`tab-btn ${formData.role === 'staff' ? 'active' : ''}`}
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem' }}
                onClick={() => setFormData({ ...formData, role: 'staff' })}
                disabled={initialData && initialData.username === 'admin'}
              >
                <User size={14} /> Staff
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="tab-btn" style={{ flex: 1 }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>{initialData ? 'Update User' : 'Simpan User'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
