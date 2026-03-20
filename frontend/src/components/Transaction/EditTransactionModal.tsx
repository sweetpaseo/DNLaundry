import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Transaction, TransactionStatus } from '../../types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Transaction>) => Promise<void>;
  transaction: Transaction;
}

export const EditTransactionModal = ({ isOpen, onClose, onSave, transaction }: EditTransactionModalProps) => {
  const [status, setStatus] = useState<TransactionStatus>(transaction.status);
  const [isPaid, setIsPaid] = useState(transaction.is_paid);
  const [notes, setNotes] = useState(transaction.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setStatus(transaction.status);
      setIsPaid(transaction.is_paid);
      setNotes(transaction.notes || '');
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(transaction.id, {
        status,
        is_paid: isPaid,
        notes
      });
      onClose();
    } catch (error) {
      alert('Gagal mengupdate transaksi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card animate-scale-in" style={{ width: 'min(95%, 450px)', padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Edit Transaksi</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status Pesanan</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
              style={{ width: '100%', height: '3rem' }}
            >
              <option value="Baru" style={{ background: '#1a1a1a' }}>Baru</option>
              <option value="Proses" style={{ background: '#1a1a1a' }}>Proses</option>
              <option value="Siap Ambil" style={{ background: '#1a1a1a' }}>Siap Ambil</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <input 
                type="checkbox" 
                checked={isPaid} 
                onChange={(e) => setIsPaid(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
              <span style={{ fontWeight: 600 }}>Status Pembayaran (LUNAS)</span>
            </label>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Catatan</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', minHeight: '100px', padding: '1rem' }}
              placeholder="Tambahkan catatan di sini..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
