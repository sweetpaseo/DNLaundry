import { useState, useEffect, useRef } from 'react';
import { Store, MapPin, Save, Instagram, MessageSquare, Wallet, Users, DollarSign, Plus, Calculator } from 'lucide-react';
import { api } from '../../services/api';
import { WhatsAppIcon } from '../Icons';

export const IdentitySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    phone: '',
    address: '',
    footer_text: '',
    instagram: '',
    logo_url: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    qris_url: '',
    qris_whatsapp_url: '',
    rounding_enabled: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    
    if ('dataTransfer' in e) {
      // It's a drag event
      e.preventDefault();
      setIsDragging(false);
      file = e.dataTransfer.files?.[0] || null;
    } else {
      // It's a change event
      file = e.target.files?.[0] || null;
    }

    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, dll)');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file terlalu besar (Maksimal 2MB)');
      return;
    }

    setSaving(true);
    try {
      const url = await api.uploadLogo(file);
      setSettings({ ...settings, logo_url: url });
    } catch (error: any) {
      alert('Gagal unggah logo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings({
        ...data,
        rounding_enabled: data.rounding_enabled ?? true
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      alert('Pengaturan identitas berhasil disimpan!');
    } catch (error: any) {
      alert('Gagal menyimpan pengaturan: ' + (error.message || 'Error tidak diketahui'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat pengaturan...</div>;
  }

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
          <Store size={20} color="var(--primary)" /> Identitas & Informasi Usaha
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Informasi ini akan muncul di Header Aplikasi, Halaman Login, dan Nota Transaksi.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Logo Upload Section - Centered and Above */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleLogoUpload}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1rem', 
            background: isDragging ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.03)', 
            padding: '2.5rem', 
            borderRadius: '24px', 
            border: isDragging ? '2px dashed var(--primary)' : '1px solid var(--glass-border)',
            transition: 'all 0.3s ease',
            marginBottom: '0.5rem',
            cursor: 'pointer',
            position: 'relative'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ 
            position: 'relative', 
            width: '140px', 
            height: '140px', 
            borderRadius: '28px', 
            background: 'rgba(255,255,255,0.05)', 
            border: isDragging ? 'none' : '2px dashed var(--glass-border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden',
            boxShadow: settings.logo_url ? '0 15px 35px rgba(0,0,0,0.3)' : 'none',
            transform: isDragging ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s ease'
          }}>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
            ) : (
              <div style={{ textAlign: 'center', opacity: isDragging ? 0.8 : 0.4 }}>
                <Store size={56} style={{ marginBottom: '0.5rem' }} />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleLogoUpload} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h5 style={{ marginBottom: '0.4rem', fontWeight: 700, fontSize: '1.2rem', color: isDragging ? 'var(--primary)' : 'inherit' }}>
              {isDragging ? 'Lepaskan Gambar Di Sini' : 'Logo Laundry'}
            </h5>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {isDragging ? 'Siap diunggah!' : 'Tarik & Letakkan gambar di sini atau klik untuk pilih'}
            </p>
            {!isDragging && (
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ 
                  fontSize: '0.85rem', 
                  padding: '0.7rem 2rem', 
                  background: 'var(--primary-gradient)', 
                  border: 'none', 
                  color: 'white', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
                disabled={saving}
              >
                {saving ? 'Sedang Mengunggah...' : (settings.logo_url ? 'Ganti Logo' : 'Unggah Logo Baru')}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(Min(100%, 300px), 1fr))', gap: '1.5rem' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <Store size={14} /> Nama Usaha Laundry
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={e => setSettings({ ...settings, name: e.target.value })}
                placeholder="Contoh: Antigravity Laundry"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <WhatsAppIcon size={16} color="#25D366" /> Nomor WhatsApp (Order/Admin)
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                placeholder="Contoh: 081234567890"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <Instagram size={14} /> Instagram handle
              </label>
              <input
                type="text"
                value={settings.instagram}
                onChange={e => setSettings({ ...settings, instagram: e.target.value })}
                placeholder="Contoh: @antigravity.laundry"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Informasi Rekening Bank</div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <Wallet size={14} /> Nama Bank / Wallet
                </label>
                <input
                  type="text"
                  value={settings.bank_name}
                  onChange={e => setSettings({ ...settings, bank_name: e.target.value })}
                  placeholder="BCA, Mandiri, GoPay..."
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <Users size={14} /> Nama Pemilik
                </label>
                <input
                  type="text"
                  value={settings.bank_account_name}
                  onChange={e => setSettings({ ...settings, bank_account_name: e.target.value })}
                  placeholder="Nama pemilik rekening"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <DollarSign size={14} /> Nomor Rekening
                </label>
                <input
                  type="text"
                  value={settings.bank_account_number}
                  onChange={e => setSettings({ ...settings, bank_account_number: e.target.value })}
                  placeholder="Nomor rekening / HP"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <Store size={14} /> QRIS Pembayaran
              </label>
              <div 
                style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '2px dashed var(--glass-border)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  cursor: 'pointer',
                  minHeight: '200px',
                  justifyContent: 'center'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSaving(true);
                    try {
                      const url = await api.uploadQRIS(file);
                      setSettings({ ...settings, qris_url: url });
                    } catch (err: any) {
                      alert('Gagal unggah QRIS: ' + err.message);
                    } finally {
                      setSaving(false);
                    }
                  };
                  input.click();
                }}
              >
                {settings.qris_url ? (
                  <div style={{ position: 'relative' }}>
                    <img src={settings.qris_url} alt="QRIS" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px' }} />
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'center' }}>Klik untuk ganti QRIS</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <Plus size={32} style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.85rem' }}>Klik untuk upload gambar QRIS</div>
                  </div>
                )}
              </div>
              
              {/* Added Manual QRIS URL field exactly below upload area */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Plus size={14} color="var(--primary)" /> Link Manual Gambar QRIS (URL)
                </label>
                <input
                  type="text"
                  value={settings.qris_whatsapp_url || ''}
                  onChange={e => setSettings({ ...settings, qris_whatsapp_url: e.target.value })}
                  placeholder="https://domain-anda.com/qris.jpg"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.85rem' }}
                />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                  *Link ini khusus digunakan untuk dikirimkan melalui WhatsApp tagihan ke pelanggan karena API WhatsApp terkadang tidak bisa mengirim gambar langsung.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <MapPin size={14} /> Alamat Lengkap
              </label>
              <textarea
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                placeholder="Masukkan alamat lengkap usaha..."
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <MessageSquare size={14} /> Pesan Footer Nota
              </label>
              <textarea
                value={settings.footer_text}
                onChange={e => setSettings({ ...settings, footer_text: e.target.value })}
                placeholder="Pesan di bawah nota (e.g. Syarat & Ketentuan)..."
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', resize: 'vertical' }}
              />
            </div>

            {/* Rounding Feature Toggle */}
            <div className="form-group" style={{ 
              marginTop: '0.5rem', 
              padding: '1.25rem', 
              background: 'rgba(var(--primary-rgb), 0.05)', 
              borderRadius: '16px', 
              border: '1px solid rgba(var(--primary-rgb), 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <Calculator size={18} color="var(--primary)" /> Pembulatan Otomatis (500)
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Membulatkan total tagihan (misal: 5.200 jadi 5.000, 5.310 jadi 5.500).
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', flexShrink: 0 }}>
                <input 
                  type="checkbox" 
                  checked={settings.rounding_enabled} 
                  onChange={e => setSettings({ ...settings, rounding_enabled: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: settings.rounding_enabled ? 'var(--primary)' : '#475569', 
                  transition: '.4s', borderRadius: '24px' 
                }}>
                  <span style={{ 
                    position: 'absolute', content: '""', height: '18px', width: '18px', 
                    left: settings.rounding_enabled ? '26px' : '4px', bottom: '3px', 
                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%' 
                  }}></span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
          >
            <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
};
