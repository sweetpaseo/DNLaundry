import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, MapPin, Save, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemberType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: { id?: string; name: string; phone: string; address: string; member_type_id: string }) => void;
  initialData?: { id?: string; name: string; phone: string; address: string; member_type_id?: string } | null;
  memberTypes: MemberType[];
}

export const AddCustomerModal = ({ isOpen, onClose, onSave, initialData, memberTypes }: Props) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    member_type_id: '',
    default_delivery_type: 'Pickup' as 'Pickup' | 'Delivery'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone,
        address: initialData.address,
        member_type_id: initialData.member_type_id || '',
        default_delivery_type: (initialData as any).default_delivery_type || 'Pickup'
      });
    } else {
      const defaultType = memberTypes.find(m => m.name.toLowerCase().includes('normal')) || memberTypes[0];
      setFormData({ 
        name: '', 
        phone: '', 
        address: '', 
        member_type_id: defaultType?.id || '',
        default_delivery_type: 'Pickup'
      });
    }
  }, [initialData, isOpen, memberTypes]);

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
    const dataToSave = { ...formData };
    if (!dataToSave.member_type_id) {
      delete (dataToSave as any).member_type_id;
    }
    onSave(initialData?.id ? { ...dataToSave, id: initialData.id } : dataToSave);
    onClose();
  };

  const modalRoot = document.getElementById('modal-root');

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="glass-card modal-content" 
            style={{ 
              border: '1px solid var(--glass-border)', 
              padding: '2rem',
              margin: 'auto 1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={20} color="var(--primary)" /> 
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {initialData ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                </h3>
                {initialData?.id && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.4, background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', letterSpacing: '0.05em' }}>
                    #{initialData.id.slice(0, 8).toUpperCase()}
                  </span>
                )}
              </div>
              <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nama Lengkap</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Budi Santoso"
                    style={{ width: '100%', paddingLeft: '2.5rem' }} 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nomor WhatsApp (Aktif)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="tel" 
                    required 
                    placeholder="0812..."
                    style={{ width: '100%', paddingLeft: '2.5rem' }} 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Jenis Member</label>
                <div style={{ position: 'relative' }}>
                  <select
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    value={formData.member_type_id}
                    onChange={(e) => setFormData({...formData, member_type_id: e.target.value})}
                  >
                    {memberTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <Star size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Preferensi Pengiriman</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, default_delivery_type: 'Pickup'})}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius)',
                      background: formData.default_delivery_type === 'Pickup' ? 'rgba(255, 0, 132, 0.1)' : 'transparent',
                      border: `1px solid ${formData.default_delivery_type === 'Pickup' ? 'var(--primary)' : 'var(--glass-border)'}`,
                      color: formData.default_delivery_type === 'Pickup' ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: formData.default_delivery_type === 'Pickup' ? 700 : 400
                    }}
                  >
                    🏠 Ambil Sendiri
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, default_delivery_type: 'Delivery'})}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius)',
                      background: formData.default_delivery_type === 'Delivery' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      border: `1px solid ${formData.default_delivery_type === 'Delivery' ? '#3b82f6' : 'var(--glass-border)'}`,
                      color: formData.default_delivery_type === 'Delivery' ? '#3b82f6' : 'var(--text-muted)',
                      fontWeight: formData.default_delivery_type === 'Delivery' ? 700 : 400
                    }}
                  >
                    🚚 Minta Antar
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Alamat</label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    required 
                    rows={3}
                    placeholder="Alamat lengkap..."
                    style={{ width: '100%', paddingLeft: '2.5rem', paddingTop: '0.75rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 'var(--radius)', resize: 'none' }} 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                  <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius)', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white' }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Save size={18} /> Simpan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return modalRoot ? createPortal(content, modalRoot) : null;
};
