import React from 'react';
import { Store, Phone, MapPin, Save, Instagram, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

export const IdentitySettings = () => {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState({
    name: '',
    phone: '',
    address: '',
    footer_text: '',
    instagram: '',
    logo_url: ''
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const url = await api.uploadLogo(file);
      setSettings(prev => ({ ...prev, logo_url: url }));
      alert('Logo berhasil diunggah! Klik Simpan Perubahan untuk menetapkan.');
    } catch (error: any) {
      alert('Gagal unggah logo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      alert('Pengaturan identitas berhasil disimpan!');
    } catch (error) {
      alert('Gagal menyimpan pengaturan');
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
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1rem', 
          background: 'rgba(255,255,255,0.03)', 
          padding: '2rem', 
          borderRadius: '16px', 
          border: '1px solid var(--glass-border)',
          marginBottom: '0.5rem'
        }}>
          <div style={{ 
            position: 'relative', 
            width: '120px', 
            height: '120px', 
            borderRadius: '24px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '2px dashed var(--glass-border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden',
            boxShadow: settings.logo_url ? '0 10px 25px rgba(0,0,0,0.2)' : 'none'
          }}>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Store size={48} style={{ opacity: 0.2 }} />
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
            <h5 style={{ marginBottom: '0.25rem', fontWeight: 700, fontSize: '1.1rem' }}>Logo Laundry</h5>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Akan tampil di Halaman Login & Nota</p>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.6rem 1.5rem', 
                background: 'var(--primary-gradient)', 
                border: 'none', 
                color: 'white', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: 600
              }}
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              {settings.logo_url ? 'Ganti Logo' : 'Unggah Logo Baru'}
            </button>
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
                <Phone size={14} /> Nomor WhatsApp (Order/Admin)
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
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
