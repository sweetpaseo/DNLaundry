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
      background: 'radial-gradient(ellipse at 50% 0%, #170d1e 0%, #08090e 75%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '1.5rem 1rem'
    }}>
      {/* Background Grid Lines Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        opacity: 0.3,
        pointerEvents: 'none'
      }} />

      {/* Floating Magenta Light Orb */}
      <motion.div 
        animate={{ 
          scale: [1, 1.25, 1],
          x: [0, 20, 0],
          opacity: [0.35, 0.55, 0.35]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '35%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255, 0, 132, 0.28) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}
      />

      {/* Floating Cyan Light Orb */}
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          x: [0, -25, 0],
          opacity: [0.25, 0.45, 0.25]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '35%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(55px)'
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
          background: 'rgba(18, 20, 29, 0.65)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 0 rgba(0, 0, 0, 0.5)',
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
            padding: '0.3rem 0.85rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
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
            borderRadius: '22px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            padding: '0.8rem',
            position: 'relative'
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="DN Laundry Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
            ) : (
              <div style={{ width: 68, height: 68, borderRadius: '18px', background: 'linear-gradient(135deg, #FF0084, #9d0052)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 25px rgba(255,0,132,0.5)' }}>
                <Sparkles size={34} />
              </div>
            )}
          </div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.025em', marginBottom: '0.3rem' }}>
            {settings?.name || 'DN Laundry'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.55)', fontWeight: 400 }}>
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
              background: 'rgba(244, 63, 94, 0.14)', 
              color: '#f87171', 
              borderRadius: '14px', 
              fontSize: '0.825rem', 
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '1px solid rgba(244, 63, 94, 0.3)',
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

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Username
              </label>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickFill('kasir')}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600 }}
                >
                  + Kasir
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('owner')}
                  style={{ background: 'rgba(255,0,132,0.15)', border: '1px solid rgba(255,0,132,0.3)', color: '#FF0084', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700 }}
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
                  color: focusedInput === 'username' ? '#FF0084' : 'rgba(255, 255, 255, 0.35)',
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
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: focusedInput === 'username' ? '1px solid #FF0084' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: focusedInput === 'username' ? '0 0 15px rgba(255, 0, 132, 0.3)' : 'none',
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
            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                  color: focusedInput === 'password' ? '#FF0084' : 'rgba(255, 255, 255, 0.35)',
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
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: focusedInput === 'password' ? '1px solid #FF0084' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: focusedInput === 'password' ? '0 0 15px rgba(255, 0, 132, 0.3)' : 'none',
                  color: 'white',
                  fontSize: '0.925rem',
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
                  color: 'rgba(255, 255, 255, 0.4)',
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
            whileHover={{ scale: 1.015, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              marginTop: '0.6rem', 
              width: '100%', 
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF0084 0%, #c40062 100%)',
              color: 'white',
              border: 'none',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.65rem',
              fontSize: '1rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              boxShadow: '0 10px 30px -5px rgba(255, 0, 132, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.725rem' }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span>Sistem Terenkripsi & Aman</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              color: 'rgba(255, 255, 255, 0.5)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              padding: '0.15rem 0.55rem', 
              borderRadius: '999px', 
              fontSize: '0.66rem', 
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              v1.0.0
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
