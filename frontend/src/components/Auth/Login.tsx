import React, { useState } from 'react';
import { Lock, User, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  settings?: any;
}

export const Login = ({ onLoginSuccess, settings }: LoginProps) => {
  const businessName = settings?.name;
  const logoUrl = settings?.logo_url;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await api.login({ username, password });
      onLoginSuccess(user);
    } catch (err) {
      setError('Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
      padding: '2rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ 
          maxWidth: '400px', 
          width: '100%', 
          padding: '2.5rem', 
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: '20px', 
            background: logoUrl ? 'transparent' : 'var(--primary-gradient)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem',
            color: 'white',
            boxShadow: logoUrl ? 'none' : '0 10px 15px -3px rgba(255, 0, 132, 0.3)',
            overflow: 'hidden'
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Lock size={32} />
            )}
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Selamat Datang</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Di {businessName || 'Antigravity Laundry'}</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              padding: '0.75rem', 
              background: 'rgba(244, 63, 94, 0.1)', 
              color: '#f43f5e', 
              borderRadius: '8px', 
              fontSize: '0.875rem', 
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '1px solid rgba(244, 63, 94, 0.2)'
            }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ 
              marginTop: '1rem', 
              width: '100%', 
              height: '48px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Lupa password? Hubungi Owner
          </p>
        </div>
      </motion.div>
    </div>
  );
};
