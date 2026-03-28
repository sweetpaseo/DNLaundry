import { Printer, X, MapPin, Instagram, Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import type { Transaction } from '../../types';
import { WhatsAppIcon } from '../Icons';
import { getWhatsAppUrl } from '../../utils/whatsapp';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | Transaction[];
  settings: any;
  customers?: any[];
}
export const ReceiptModal = ({ isOpen, onClose, transaction, settings, customers = [] }: ReceiptModalProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    
    try {
      setIsDownloading(true);
      const dataUrl = await toJpeg(receiptRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `Nota-${receiptId}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Gagal mendownload nota. Silakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  const items = Array.isArray(transaction) ? transaction : [transaction];
  const firstItem = items[0];
  const totalPrice = items.reduce((sum, item) => sum + item.final_price, 0);
  const receiptId = firstItem.receipt_no || (firstItem.group_id || firstItem.id).slice(0, 8).toUpperCase();
  const allPaid = items.every(item => item.is_paid);

  const handleWhatsAppShare = () => {
    let customerPhone = firstItem.customer?.phone;
    
    // Fallback: look in customers list if join is missing
    if (!customerPhone && customers.length > 0) {
      const customer = customers.find(c => c.id === firstItem.customer_id || c.name === firstItem.customer_name);
      if (customer) customerPhone = customer.phone;
    }

    if (!customerPhone) {
      const manualPhone = window.prompt("Nomor WhatsApp pelanggan tidak ditemukan. Silakan masukkan nomor WhatsApp (contoh: 08123456789):");
      if (!manualPhone) return;
      customerPhone = manualPhone;
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
    message += `Status Pembayaran: ${allPaid ? 'LUNAS' : 'BELUM LUNAS'}\n`;
    if (!allPaid && (settings?.bank_name || settings?.qris_whatsapp_url || settings?.qris_url)) {
      message += `\n*Informasi Pembayaran (Transfer):*\n`;
      if (settings.bank_name) {
        message += `${settings.bank_name}\n`;
        message += `No. Rek: ${settings.bank_account_number}\n`;
        message += `A.n: ${settings.bank_account_name}\n`;
      }
      if (settings.qris_whatsapp_url || settings.qris_url) {
        message += `\nLink QRIS: ${settings.qris_whatsapp_url || settings.qris_url}\n`;
      }
    }
    
    message += `\n${settings?.footer_text || 'Terima kasih telah mempercayakan laundry Anda kepada kami!'}\n\n`;
    message += `*${settings?.name}*\n`;
    message += `WA: ${settings?.phone}\n`;
    message += `Alamat: ${settings?.address}`;

    const whatsappUrl = getWhatsAppUrl(customerPhone, message);
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose} 
      />
      
      <div className="glass-card" style={{ 
        position: 'relative', 
        width: '95%', 
        maxWidth: '400px', 
        maxHeight: '90vh',
        padding: '0', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
          <h4 style={{ fontWeight: 700 }}>Nota Transaksi</h4>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          <div id="receipt-content" ref={receiptRef} style={{ 
            padding: '1.5rem', 
            background: 'white', 
            color: 'black', 
            fontFamily: 'monospace',
            transformOrigin: 'top center',
            // Compacting slightly as requested (approx 85-90% scale feel via smaller padding/font)
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              {settings?.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  style={{ maxWidth: '60px', maxHeight: '60px', marginBottom: '0.5rem', objectFit: 'contain' }} 
                />
              )}
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.15rem' }}>{settings?.name || 'Antigravity Laundry'}</h2>
              <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <WhatsAppIcon size={10} color="#000" /> <span>{settings?.phone}</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '0.3rem', maxWidth: '240px' }}>
                  <MapPin size={8} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                  <span>{settings?.address}</span>
                </div>
                {settings?.instagram && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Instagram size={8} /> <span>{settings?.instagram}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '0.75rem 0', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>ID: {receiptId}</span>
                <span>{new Date(firstItem.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '0.4rem' }}>Pelanggan: {firstItem.customer_name}</div>
              {firstItem.due_date && (
                <div style={{ fontSize: '0.7rem', marginTop: '0.15rem', color: '#444' }}>
                  Estimasi Selesai: {new Date(firstItem.due_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              {items.map(item => (
                <div key={item.id} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>{item.service_name}</span>
                    <span>Rp {item.final_price.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.1rem' }}>
                    Qty: {item.weight} {item.unit || 'kg'} x Rp {((item.total_price / item.weight)).toLocaleString()}
                  </div>
                </div>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '2px solid #000', paddingTop: '0.4rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, border: '1px solid #000', padding: '0.1rem 0.3rem' }}>
                    {allPaid ? 'LUNAS' : 'BELUM LUNAS'}
                  </span>
                  {allPaid && items[0].payment_method && (
                    <div style={{ fontSize: '0.6rem', marginTop: '0.2rem', fontWeight: 600 }}>
                      Mode: {items[0].payment_method === 'Saldo' ? 'Potong Saldo' : items[0].payment_method}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem' }}>
                  TOTAL: Rp {totalPrice.toLocaleString()}
                </div>
              </div>
            </div>

            {(settings?.bank_name || settings?.qris_url) && (
              <div style={{ borderTop: '1px dashed #ccc', padding: '0.75rem 0', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', textAlign: 'center' }}>INFORMASI PEMBAYARAN</div>
                {settings?.bank_name && (
                  <div style={{ fontSize: '0.7rem', textAlign: 'center', marginBottom: '0.4rem' }}>
                    {settings.bank_name}<br />
                    No: {settings.bank_account_number}<br />
                    A.n: {settings.bank_account_name}
                  </div>
                )}
                {settings?.qris_url && (
                  <div style={{ textAlign: 'center' }}>
                    <img src={settings.qris_url} alt="QRIS" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                    <div style={{ fontSize: '0.6rem' }}>Scan QRIS untuk pembayaran</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#666', borderTop: '1px dashed #ccc', paddingTop: '0.75rem' }}>
              {settings?.footer_text || 'Terima kasih telah mempercayakan laundry Anda kepada kami!'}
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <button 
            onClick={handlePrint}
            className="btn-primary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', fontSize: '0.85rem' }}
          >
            <Printer size={18} /> Cetak Nota
          </button>
          
          <button 
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', fontSize: '0.85rem' }}
          >
            {isDownloading ? <span className="animate-spin">⌛</span> : <Download size={18} />} 
            {isDownloading ? 'Memproses...' : 'Download Nota'}
          </button>
          
          <button 
            onClick={handleWhatsAppShare}
            className="btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', fontSize: '0.85rem', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', color: '#25D366' }}
          >
            <WhatsAppIcon size={18} color="#25D366" /> WhatsApp
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
