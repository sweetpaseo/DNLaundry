import { X, Printer, Phone, MapPin, Instagram } from 'lucide-react';
import type { Transaction } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | Transaction[];
  settings: any;
}

export const ReceiptModal = ({ isOpen, onClose, transaction, settings }: ReceiptModalProps) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = Array.isArray(transaction) ? transaction : [transaction];
  const firstItem = items[0];
  const totalPrice = items.reduce((sum, item) => sum + item.final_price, 0);
  const receiptId = (firstItem.group_id || firstItem.id).slice(0, 8).toUpperCase();

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
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            {settings?.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                style={{ maxWidth: '80px', maxHeight: '80px', marginBottom: '0.75rem', objectFit: 'contain' }} 
              />
            )}
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
              <span>ID: {receiptId}</span>
              <span>{new Date(firstItem.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.5rem' }}>Pelanggan: {firstItem.customer_name}</div>
            {firstItem.due_date && (
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#444' }}>
                Estimasi Selesai: {new Date(firstItem.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>{item.service_name}</span>
                <span>{item.weight} {item.unit || 'kg'}</span>
              </div>
            ))}
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
              TOTAL: Rp {totalPrice.toLocaleString()}
            </div>
          </div>

          {(settings?.bank_name || settings?.qris_url) && (
            <div style={{ borderTop: '1px dashed #ccc', padding: '1rem 0', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>INFORMASI PEMBAYARAN</div>
              {settings?.bank_name && (
                <div style={{ fontSize: '0.75rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                  {settings.bank_name}<br />
                  No: {settings.bank_account_number}<br />
                  A.n: {settings.bank_account_name}
                </div>
              )}
              {settings?.qris_url && (
                <div style={{ textAlign: 'center' }}>
                  <img src={settings.qris_url} alt="QRIS" style={{ maxWidth: '120px', maxHeight: '120px' }} />
                  <div style={{ fontSize: '0.65rem' }}>Scan QRIS untuk pembayaran</div>
                </div>
              )}
            </div>
          )}

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
