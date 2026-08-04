import { useState } from 'react';
import { Lock, User, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  settings?: any;
}

export const Login = ({ onLoginSuccess, settings }: LoginProps) => {
  const logoUrl = settings?.logo_url;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await api.login({ 
        username: username.trim(), 
        password: password.trim() 
      });
      onLoginSuccess(user);
    } catch (err) {
      setError('Username atau password yang Anda masukkan tidak sesuai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100dvh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(ellipse at 50% 15%, rgba(255, 0, 132, 0.12) 0%, rgba(13, 17, 26, 0.98) 70%), #080b11',
      position: 'relative',
      overflow: 'hidden',
      padding: '1.5rem'
    }}>
      {/* Ambient Decorative Light Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.45, 0.3]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(255,0,132,0.2) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          maxWidth: '420px', 
          width: '100%', 
          padding: '2.5rem 2rem', 
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Header & Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{ 
            width: 130, 
            height: 130, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.25rem',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            padding: '0.75rem'
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="DN Laundry Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'linear-gradient(135deg, #FF0084, #d6006e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 20px rgba(255,0,132,0.4)' }}>
                <Lock size={32} />
              </div>
            )}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {settings?.name || 'DN Laundry'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 400 }}>
            Sistem Kasir & Operasional Kasir
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              padding: '0.85rem 1rem', 
              background: 'rgba(244, 63, 94, 0.12)', 
              color: '#f87171', 
              borderRadius: '14px', 
              fontSize: '0.825rem', 
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 500
            }}
          >
            <ShieldCheck size={16} color="#f87171" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: focusedInput === 'username' ? '#FF0084' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'color 0.2s ease'
                }} 
              />
              <input 
                type="text" 
                required
                value={username}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                style={{ 
                  width: '100%', 
                  paddingLeft: '2.75rem',
                  paddingRight: '1rem',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: focusedInput === 'username' ? '1px solid #FF0084' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: focusedInput === 'username' ? '0 0 0 3px rgba(255, 0, 132, 0.2)' : 'none',
                  color: 'white',
                  fontSize: '0.925rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: focusedInput === 'password' ? '#FF0084' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'color 0.2s ease'
                }} 
              />
              <input 
                type="password" 
                required
                value={password}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ 
                  width: '100%', 
                  paddingLeft: '2.75rem',
                  paddingRight: '1rem',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: focusedInput === 'password' ? '1px solid #FF0084' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: focusedInput === 'password' ? '0 0 0 3px rgba(255, 0, 132, 0.2)' : 'none',
                  color: 'white',
                  fontSize: '0.925rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                autoComplete="current-password"
              />
            </div>
          </div>

          <motion.button 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.01, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              marginTop: '0.5rem', 
              width: '100%', 
              height: '50px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #FF0084 0%, #d6006e 100%)',
              color: 'white',
              border: 'none',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.6rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              boxShadow: '0 8px 25px -4px rgba(255, 0, 132, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            <span>{loading ? 'Memproses...' : 'Masuk Sekarang'}</span>
          </motion.button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: 'rgba(255, 255, 255, 0.6)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            padding: '0.2rem 0.65rem', 
            borderRadius: '999px', 
            fontSize: '0.68rem', 
            fontWeight: 600,
            letterSpacing: '0.04em'
          }}>
            v1.0.0
          </span>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.4)', transition: 'color 0.2s ease', cursor: 'default' }}>
            Lupa password? Hubungi Owner
          </p>
        </div>
      </motion.div>
    </div>
  );
};
