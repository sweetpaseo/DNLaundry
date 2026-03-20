import { X, Printer, Phone, MapPin, Instagram } from 'lucide-react';
import type { Transaction } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  settings: any;
}

export const ReceiptModal = ({ isOpen, onClose, transaction, settings }: ReceiptModalProps) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose} 
      />
      
      <div className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h4 style={{ fontWeight: 700 }}>Nota Transaksi</h4>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div id="receipt-content" style={{ padding: '2rem', background: 'white', color: 'black', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{settings?.name || 'Antigravity Laundry'}</h2>
            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                <Phone size={10} /> {settings?.phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                <MapPin size={10} /> {settings?.address}
              </div>
              {settings?.instagram && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <Instagram size={10} /> {settings?.instagram}
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '1rem 0', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>ID: {transaction.id.slice(0, 8).toUpperCase()}</span>
              <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.5rem' }}>Pelanggan: {transaction.customer_name}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>{transaction.service_name}</span>
              <span>{transaction.weight} {transaction.unit || 'kg'}</span>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', marginTop: '1rem' }}>
              TOTAL: Rp {transaction.total_price.toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666', borderTop: '1px dashed #ccc', paddingTop: '1rem' }}>
            {settings?.footer_text || 'Terima kasih telah mempercayakan laundry Anda kepada kami!'}
          </div>
        </div>

        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={handlePrint} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> Cetak Nota
          </button>
        </div>
      </div>

      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #receipt-content, #receipt-content * { visibility: visible; }
            #receipt-content { position: absolute; left: 0; top: 0; width: 100%; }
          }
        `}
      </style>
    </div>
  );
};
