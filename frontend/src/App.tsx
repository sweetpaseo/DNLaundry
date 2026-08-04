import { useState, useEffect } from 'react';
import { Users, Settings, PlusCircle, List, LogOut, Calculator, Receipt, Archive, Loader2, Calendar } from 'lucide-react';
import { StockManager } from './components/Stock/StockManager';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './services/api';
import { OrderInput } from './components/Transaction/OrderInput';
import { TransactionList } from './components/Transaction/TransactionList';
import { CustomerCRM } from './components/CRM/CustomerCRM';
import { CustomerRetention } from './components/CRM/CustomerRetention';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { WalletManagement } from './components/Admin/WalletManagement';
import { ExpenseManager } from './components/Expense/ExpenseManager';
import { Login } from './components/Auth/Login';

const CustomerRetentionMenu = () => {
    const [customers, setCustomers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [c, t] = await Promise.all([api.getCustomers(), api.getTransactions()]);
                setCustomers(c || []);
                setTransactions(t || []);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>;

    return <CustomerRetention customers={customers} transactions={transactions} />;
};

function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('laundry_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeMenu, setActiveMenu] = useState<'transaksi' | 'biaya' | 'pelanggan' | 'admin' | 'stok'>('transaksi');
  const [activeTab, setActiveTab] = useState<'input' | 'list'>('input');
  const [activeTabPelanggan, setActiveTabPelanggan] = useState<'list' | 'saldo' | 'retensi'>('list');
  const [settings, setSettings] = useState<any>({
    name: 'DN Laundry',
    address: 'Jl. Dewi Sartika A8/4, Jatiasih, Kota Bekasi. (Gmaps: DN Office)',
    phone: '085122994050',
    instagram: '@dnlaundry.id',
    logo_url: null
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem('laundry_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('laundry_user');
    }
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
        if (data.name) document.title = data.name;
      } catch (e) {
        console.error('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await api.checkConnection();
      setIsOnline(status);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    if (window.confirm('Keluar dari sistem?')) {
      setUser(null);
      setActiveMenu('transaksi');
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} settings={settings} />;
  }

  const menuItems = [
    { id: 'transaksi', label: 'Transaksi', icon: <Calculator size={18} /> },
    { id: 'biaya', label: 'Biaya', icon: <Receipt size={18} /> },
    { id: 'pelanggan', label: 'Pelanggan', icon: <Users size={18} /> },
    { id: 'stok', label: 'Stok', icon: <Archive size={18} /> },
    ...(user.role === 'owner' ? [{ id: 'admin', label: 'Admin', icon: <Settings size={18} /> }] : []),
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div className="clay-app-layout">
        
        {/* Claymorphic 3D Purple Sidebar */}
        <aside className="clay-sidebar" style={{ position: 'sticky', top: '1.5rem' }}>
          {/* User Profile Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ 
              width: 72, 
              height: 72, 
              borderRadius: '50%', 
              background: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '0.75rem',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
              padding: '0.3rem',
              overflow: 'hidden'
            }}>
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #60A5FA, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
              Hi, {user.name}! 👋
            </h3>
            <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: 'var(--primary)', border: '1px solid var(--border)', padding: '0.15rem 0.6rem', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {user.role}
            </span>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`clay-nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id as any)}
              >
                <div>{item.icon}</div>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Bottom Upgrade/Status Card */}
          <div style={{ 
            marginTop: 'auto', 
            background: '#F8FAFC', 
            borderRadius: '22px', 
            padding: '1rem', 
            textAlign: 'center',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>🧺✨</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)' }}>DN Laundry POS</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Sistem Operasional Pro</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Header & Greeting Bar */}
          <div className="clay-card zomo-top-header">
            <div className="zomo-header-title-box">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {settings?.name || 'DN Laundry'} POS ☀️
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Selamat bekerja! Kelola cucian & transaksi hari ini dengan mudah.
              </p>
            </div>

            <div className="zomo-header-actions">
              {/* Online Indicator */}
              <div style={{ 
                padding: '0.45rem 0.9rem', 
                borderRadius: '999px',
                background: '#ffffff',
                border: '2px solid var(--border)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.55rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#10b981' : '#f43f5e', boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isOnline ? '#059669' : '#dc2626' }}>
                  {isOnline ? 'DATABASE ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                style={{ 
                  padding: '0.6rem 1rem', 
                  borderRadius: '16px',
                  background: '#FEE2E2',
                  color: '#EF4444',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(251, 113, 133, 0.2)'
                }}
              >
                <LogOut size={16} />
                <span>Keluar</span>
              </button>
            </div>
          </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-item ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => setActiveMenu(item.id as any)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeMenu === 'transaksi' && (
              <div>
                <div className="sub-nav">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
                    onClick={() => setActiveTab('input')}
                  >
                    <div className="tab-icon"><PlusCircle size={18} /></div>
                    <span className="tab-label">Input Order</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                  >
                    <div className="tab-icon"><List size={18} /></div>
                    <span className="tab-label">Daftar Transaksi</span>
                  </motion.button>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: activeTab === 'input' ? -15 : 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === 'input' ? 15 : -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="glass-card hover-glow">
                       {activeTab === 'input' ? <OrderInput currentUser={user} /> : <TransactionList currentUser={user} />}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {activeMenu === 'biaya' && (
              <ExpenseManager userRole={user.role} />
            )}

            {activeMenu === 'stok' && <StockManager user={user} />}

            {activeMenu === 'pelanggan' && (
              <div>
                <div className="sub-nav">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`tab-btn ${activeTabPelanggan === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTabPelanggan('list')}
                  >
                    <div className="tab-icon"><Users size={18} /></div>
                    <span className="tab-label">Daftar Pelanggan</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`tab-btn ${activeTabPelanggan === 'saldo' ? 'active' : ''}`}
                    onClick={() => setActiveTabPelanggan('saldo')}
                  >
                    <div className="tab-icon"><Receipt size={18} /></div>
                    <span className="tab-label">Saldo</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`tab-btn ${activeTabPelanggan === 'retensi' ? 'active' : ''}`}
                    onClick={() => setActiveTabPelanggan('retensi')}
                  >
                    <div className="tab-icon"><Calendar size={18} /></div>
                    <span className="tab-label">Retensi</span>
                  </motion.button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTabPelanggan}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTabPelanggan === 'list' ? (
                      <div className="glass-card hover-glow">
                        <CustomerCRM currentUser={user} />
                      </div>
                    ) : activeTabPelanggan === 'saldo' ? (
                      <WalletManagement />
                    ) : (
                      <CustomerRetentionMenu />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {activeMenu === 'admin' && (
              <div className="glass-card hover-glow">
                <AdminDashboard />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <footer style={{ marginTop: '2.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <span>{settings?.name || 'DN Laundry'}</span>
          <span>•</span>
          <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 800, letterSpacing: '0.05em' }}>
            v1.0.0 Pro
          </span>
        </footer>
      </main>
    </div>
  </div>
  );
}

export default App;
