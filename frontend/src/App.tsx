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
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand">
          <h1 style={{ fontWeight: 800, background: 'linear-gradient(to right, #FF0084, #ff5eb3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {settings?.name || 'Antigravity Laundry'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Sistem Kasir Laundry Profesional</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Connection Indicator */}
          <div className="glass-card" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div 
              style={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                background: isOnline ? '#10b981' : '#f43f5e',
                boxShadow: isOnline ? '0 0 10px rgba(16, 185, 129, 0.5)' : '0 0 10px rgba(244, 63, 94, 0.5)',
                transition: 'all 0.3s ease'
              }} 
            />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isOnline ? '#10b981' : '#f43f5e' }}>
              {isOnline ? 'DATABASE ONLINE' : 'DATABASE OFFLINE'}
            </span>
          </div>

          <div className="glass-card" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: user.role === 'owner' ? '#FF0084' : '#10b981' }}></div>
            <span style={{ fontSize: '0.75rem' }}>{user.name}</span>
          </div>
          <button 
            className="glass-card" 
            style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={handleLogout}
          >
            <LogOut size={16} color="#f43f5e" />
          </button>
        </div>
      </header>

      <nav className="tab-nav desktop-tab-nav">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
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
