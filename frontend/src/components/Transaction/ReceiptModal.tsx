import { X, Printer, MapPin, Instagram } from 'lucide-react';

const WhatsAppIcon = ({ size = 20, color = "currentColor" }: { size?: number, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
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
                <WhatsAppIcon size={12} color="#000" /> {settings?.phone}
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
              <div key={item.id} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span>{item.service_name}</span>
                  <span>Rp {item.final_price.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.1rem' }}>
                  {item.weight} {item.unit || 'kg'} x Rp {(item.final_price / item.weight).toLocaleString()}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '2px solid #000', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, border: '1px solid #000', padding: '2px 8px' }}>
                {items.every(item => item.is_paid) ? 'LUNAS' : 'BELUM BAYAR'}
              </span>
              <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>
                TOTAL: Rp {totalPrice.toLocaleString()}
              </div>
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
            @page {
              margin: 0;
              size: auto;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: white !important;
              height: auto;
            }
            body * {
              visibility: hidden;
            }
            #receipt-content, #receipt-content * {
              visibility: visible !important;
            }
            #receipt-content {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important; /* Standard Thermal Ribbon Width */
              margin: 0 !important;
              padding: 4mm !important;
              background: white !important;
              box-shadow: none !important;
            }
            /* Hide modal artifacts */
            .glass-card, .modal-overlay, .btn-primary, button {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }
          }
        `}
      </style>
    </div>
  );
};
