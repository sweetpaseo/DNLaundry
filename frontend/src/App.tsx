import { useState, useEffect } from 'react';
import { Users, Settings, PlusCircle, List, LogOut, Calculator, Receipt, Archive, Loader2, Calendar, Sparkles } from 'lucide-react';
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
    <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        padding: '1rem 1.5rem',
        background: 'rgba(18, 20, 29, 0.65)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
      }}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #FF0084, #c40062)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 6px 18px rgba(255, 0, 132, 0.4)'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h1 style={{ 
              fontWeight: 900, 
              fontSize: '1.5rem', 
              letterSpacing: '-0.03em',
              background: 'linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.7))', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              {settings?.name || 'DN Laundry'}
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.78rem', fontWeight: 500 }}>
              Sistem Kasir & Operasional POS
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          {/* Connection Indicator */}
          <div style={{ 
            padding: '0.45rem 0.9rem', 
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.55rem' 
          }}>
            <div 
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: isOnline ? '#10b981' : '#f43f5e',
                boxShadow: isOnline ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
                transition: 'all 0.3s ease'
              }} 
            />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', color: isOnline ? '#34d399' : '#f87171' }}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* User Profile Pill */}
          <div style={{ 
            padding: '0.4rem 0.9rem', 
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem' 
          }}>
            <div style={{ 
              fontSize: '0.62rem', 
              fontWeight: 800, 
              padding: '0.15rem 0.45rem', 
              borderRadius: '6px', 
              background: user.role === 'owner' ? 'rgba(255, 0, 132, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: user.role === 'owner' ? '#FF0084' : '#34d399',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {user.role}
            </div>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'white' }}>{user.name}</span>
          </div>

          {/* Logout Button */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              padding: '0.55rem', 
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer' 
            }}
            onClick={handleLogout}
            title="Keluar dari sistem"
          >
            <LogOut size={16} color="#f87171" />
          </motion.button>
        </div>
      </header>

      {/* Floating Tab Navigation Bar */}
      <nav className="tab-nav desktop-tab-nav" style={{ margin: '0 auto 2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`tab-btn ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => setActiveMenu(item.id as any)}
          >
            <div className="tab-icon">{item.icon}</div>
            <span className="tab-label">{item.label}</span>
          </motion.button>
        ))}
      </nav>

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

      <main>
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

        <footer style={{ marginTop: '2.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <span>{settings?.name || 'DN Laundry'}</span>
          <span>•</span>
          <span style={{ background: 'rgba(255, 0, 132, 0.15)', color: '#FF0084', border: '1px solid rgba(255, 0, 132, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700, letterSpacing: '0.05em' }}>
            v1.0.0
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
