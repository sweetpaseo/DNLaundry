import { useState } from 'react';
import { Lock, User, LogIn, Loader2, ShieldCheck, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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

  const handleQuickFill = (role: string) => {
    setUsername(role);
    setPassword('');
  };

  return (
    <div style={{ 
      minHeight: '100dvh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at 10% 20%, #fff0f3 0%, #f0fdf4 35%, #f0f9ff 70%, #faf5ff 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '1.5rem 1rem'
    }}>
      {/* Background Dot Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.2) 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
        opacity: 0.6,
        pointerEvents: 'none'
      }} />

      {/* Floating Strawberry Pink Orb */}
      <motion.div 
        animate={{ scale: [1, 1.25, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '5%',
          left: '20%',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(circle, rgba(255, 101, 132, 0.35) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(55px)'
        }}
      />

      {/* Floating Cyan Sky Orb */}
      <motion.div 
        animate={{ scale: [1.2, 1, 1.2], x: [0, -35, 0], y: [0, 25, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}
      />

      {/* Floating Lavender Purple Orb */}
      <motion.div 
        animate={{ scale: [1, 1.15, 1], y: [0, 30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '40%',
          right: '10%',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.28) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 35, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          maxWidth: '430px', 
          width: '100%', 
          padding: '2.75rem 2.25rem', 
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '28px',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 50px -10px rgba(215, 188, 160, 0.4), 0 4px 15px rgba(0,0,0,0.03)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Live System Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.9rem',
            background: '#ffffff',
            border: '1px solid #e5dccf',
            borderRadius: '999px',
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#2b2d42',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span>POS SYSTEM READY</span>
          </div>
        </div>

        {/* Brand Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: 135, 
            height: 135, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.25rem',
            borderRadius: '24px',
            background: '#ffffff',
            border: '1px solid #e5dccf',
            boxShadow: '0 10px 25px rgba(215, 188, 160, 0.3)',
            padding: '0.8rem',
            position: 'relative'
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="DN Laundry Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 68, height: 68, borderRadius: '20px', background: 'linear-gradient(135deg, #ff6584, #ff4767)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 20px rgba(255,101,132,0.4)' }}>
                <Sparkles size={34} />
              </div>
            )}
          </div>
          
          <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#2b2d42', letterSpacing: '-0.025em', marginBottom: '0.3rem' }}>
            {settings?.name || 'DN Laundry'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 500 }}>
            Sistem Kasir & Operasional Laundry Profesional
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              padding: '0.85rem 1rem', 
              background: 'rgba(255, 82, 82, 0.1)', 
              color: '#ff5252', 
              borderRadius: '14px', 
              fontSize: '0.825rem', 
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '1px solid rgba(255, 82, 82, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 600
            }}
          >
            <ShieldCheck size={16} color="#ff5252" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Username
              </label>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickFill('kasir')}
                  style={{ background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#7c3aed', padding: '0.18rem 0.5rem', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800 }}
                >
                  + Kasir
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('owner')}
                  style={{ background: 'rgba(244, 114, 182, 0.15)', border: '1px solid rgba(244, 114, 182, 0.3)', color: '#db2777', padding: '0.18rem 0.5rem', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800 }}
                >
                  + Owner
                </button>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <User 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: focusedInput === 'username' ? '#8b5cf6' : '#94a3b8',
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
                placeholder="Masukkan username kasir / owner"
                style={{ 
                  width: '100%', 
                  paddingLeft: '2.75rem',
                  paddingRight: '1rem',
                  height: '50px',
                  borderRadius: '18px',
                  background: '#ffffff',
                  border: focusedInput === 'username' ? '2px solid #8b5cf6' : '2px solid #e9e3f5',
                  boxShadow: focusedInput === 'username' ? '0 0 0 4px rgba(139, 92, 246, 0.18)' : 'inset 0 2px 4px rgba(0,0,0,0.03)',
                  color: '#2d1b4e',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.75rem', fontWeight: 800, color: '#5b4a78', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                  color: focusedInput === 'password' ? '#8b5cf6' : '#94a3b8',
                  transition: 'color 0.2s ease'
                }} 
              />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ 
                  width: '100%', 
                  paddingLeft: '2.75rem',
                  paddingRight: '2.75rem',
                  height: '50px',
                  borderRadius: '18px',
                  background: '#ffffff',
                  border: focusedInput === 'password' ? '2px solid #8b5cf6' : '2px solid #e9e3f5',
                  boxShadow: focusedInput === 'password' ? '0 0 0 4px rgba(139, 92, 246, 0.18)' : 'inset 0 2px 4px rgba(0,0,0,0.03)',
                  color: '#2d1b4e',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                autoComplete="current-password"
              />
              
              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              marginTop: '0.6rem', 
              width: '100%', 
              height: '54px',
              borderRadius: '20px',
              background: 'linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.65rem',
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              boxShadow: '0 14px 30px rgba(139, 92, 246, 0.38), inset 0 2px 4px rgba(255, 255, 255, 0.7)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
            <span>{loading ? 'Memproses Masuk...' : 'Masuk Ke Sistem'}</span>
          </motion.button>
        </form>

        {/* Security Info & Footer */}
        <div style={{ marginTop: '2.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>Sistem Terenkripsi & Aman</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              background: '#ffffff', 
              color: '#64748b', 
              border: '1px solid #e5dccf', 
              padding: '0.2rem 0.65rem', 
              borderRadius: '999px', 
              fontSize: '0.68rem', 
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              v1.0.0
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
