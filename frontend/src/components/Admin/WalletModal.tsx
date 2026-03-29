import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Wallet, Check, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Customer } from '../../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, isCorrection: boolean) => void;
  customer: Customer | null;
}

export const WalletModal = ({ isOpen, onClose, onSave, customer }: WalletModalProps) => {
  const [mode, setMode] = useState<'topup' | 'correction'>('topup');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setMode('topup');
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (isNaN(val)) return;
    
    if (mode === 'topup' && val <= 0) {
      alert('Nominal top-up harus lebih dari 0');
      return;
    }

    onSave(val, mode === 'correction');
  };

  if (!isOpen || !customer) return null;

  const currentBalance = customer.wallet_balance || 0;
  const newBalance = mode === 'topup' ? currentBalance + Number(amount || 0) : Number(amount || 0);

  return createPortal(
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card modal-content"
        style={{ maxWidth: '400px', width: '90%', padding: '2rem', border: '1px solid var(--glass-border)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
            <Wallet size={20} color="var(--primary)" /> Kelola Saldo
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Pelanggan</p>
          <p style={{ fontWeight: 700 }}>{customer.name}</p>
          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo Saat Ini</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>Rp {currentBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.3rem', borderRadius: '10px' }}>
          <button 
            type="button"
            onClick={() => setMode('topup')}
            style={{ 
              flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 700,
              background: mode === 'topup' ? 'var(--primary-gradient)' : 'transparent',
              color: mode === 'topup' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Plus size={14} style={{ marginBottom: '-2px', marginRight: '4px' }} /> Top Up
          </button>
          <button 
            type="button"
            onClick={() => setMode('correction')}
            style={{ 
              flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 700,
              background: mode === 'correction' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              color: mode === 'correction' ? '#ef4444' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ marginBottom: '-2px', marginRight: '4px' }} /> Koreksi
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
              {mode === 'topup' ? 'Nominal Tambahan' : 'Set Saldo Baru'}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Rp</span>
              <input 
                type="number" 
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
              />
            </div>
          </div>

          {mode === 'correction' && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)', display: 'flex', gap: '0.5rem' }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.7rem', color: '#ef4444' }}>
                Mode koreksi akan <b>menimpa</b> saldo lama secara total. Gunakan hanya untuk memperbaiki kesalahan input.
              </p>
            </div>
          )}

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimasi Saldo Baru</p>
            <p style={{ fontWeight: 800, color: 'var(--primary)' }}>Rp {newBalance.toLocaleString()}</p>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="tab-btn" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
              <Check size={18} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};
