
import { Printer, X, MapPin, Instagram } from 'lucide-react';
import type { Transaction } from '../../types';
import { WhatsAppIcon } from '../Icons';

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
  const allPaid = items.every(item => item.is_paid);

  const handleWhatsAppShare = () => {
    const customerPhone = firstItem.customer?.phone;
    if (!customerPhone) {
      alert("Nomor telepon pelanggan tidak tersedia.");
      return;
    }

    const receiptDate = new Date(firstItem.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const dueDate = firstItem.due_date ? new Date(firstItem.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak ada';

    let message = `*${settings?.name || 'Antigravity Laundry'}*\n`;
    message += `Jl. ${settings?.address}\n`;
    message += `Telp: ${settings?.phone}\n\n`;
    message += `*NOTA TRANSAKSI*\n`;
    message += `ID: ${receiptId}\n`;
    message += `Tanggal: ${receiptDate}\n`;
    message += `Pelanggan: ${firstItem.customer_name}\n`;
    message += `Estimasi Selesai: ${dueDate}\n\n`;
    message += `*Detail Pesanan:*\n`;
    items.forEach(item => {
      message += `- ${item.service_name} (${item.weight} ${item.unit || 'kg'}) : Rp ${item.final_price.toLocaleString('id-ID')}\n`;
    });
    message += `\n*TOTAL: Rp ${totalPrice.toLocaleString('id-ID')}*\n`;
    message += `Status Pembayaran: ${allPaid ? 'LUNAS' : 'BELUM BAYAR'}\n`;
    if (allPaid && firstItem.payment_method) {
      message += `Metode Pembayaran: ${firstItem.payment_method}\n`;
    }
    message += `\n${settings?.footer_text || 'Terima kasih telah mempercayakan laundry Anda kepada kami!'}`;

    const whatsappUrl = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            {settings?.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                style={{ maxWidth: '80px', maxHeight: '80px', marginBottom: '0.75rem', objectFit: 'contain' }} 
              />
            )}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{settings?.name || 'Antigravity Laundry'}</h2>
            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <WhatsAppIcon size={12} color="#000" /> <span>{settings?.phone}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '0.3rem', maxWidth: '280px' }}>
                <MapPin size={10} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                <span>{settings?.address}</span>
              </div>
              {settings?.instagram && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Instagram size={10} /> <span>{settings?.instagram}</span>
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
                Estimasi Selesai: {new Date(firstItem.due_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
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
                  Qty: {item.weight} {item.unit || 'kg'} x Rp {((item.total_price / item.weight)).toLocaleString()}
                </div>
              </div>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '2px solid #000', paddingTop: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, border: '1px solid #000', padding: '0.1rem 0.4rem' }}>
                  {allPaid ? 'LUNAS' : 'BELUM BAYAR'}
                </span>
                {allPaid && items[0].payment_method && (
                  <div style={{ fontSize: '0.7rem', marginTop: '0.2rem', fontWeight: 600 }}>
                    Mode: {items[0].payment_method}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.1rem' }}>
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

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handlePrint}
            className="btn-primary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem' }}
          >
            <Printer size={20} /> Cetak Nota (Thermal)
          </button>
          
          <button 
            onClick={handleWhatsAppShare}
            className="btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', color: '#25D366' }}
          >
            <WhatsAppIcon size={20} color="#25D366" /> Kirim WhatsApp
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
