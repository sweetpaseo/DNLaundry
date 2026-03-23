import { useState, useEffect } from 'react';
import { Users, Settings, PlusCircle, List, LogOut, Calculator, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './services/api';
import { OrderInput } from './components/Transaction/OrderInput';
import { TransactionList } from './components/Transaction/TransactionList';
import { CustomerCRM } from './components/CRM/CustomerCRM';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ExpenseManager } from './components/Expense/ExpenseManager';
import { Login } from './components/Auth/Login';

function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('laundry_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeMenu, setActiveMenu] = useState<'transaksi' | 'biaya' | 'pelanggan' | 'admin'>('transaksi');
  const [activeTab, setActiveTab] = useState<'input' | 'list'>('input');
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

      <nav className="tab-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`tab-btn ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => setActiveMenu(item.id as any)}
          >
            <div className="tab-icon">{item.icon}</div>
            <span className="tab-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <main>
        {activeMenu === 'transaksi' && (
          <div>
            <div className="sub-nav">
              <button 
                className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
                onClick={() => setActiveTab('input')}
              >
                <div className="tab-icon"><PlusCircle size={18} /></div>
                <span className="tab-label">Input Order</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                <div className="tab-icon"><List size={18} /></div>
                <span className="tab-label">Daftar Transaksi</span>
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="glass-card">
                   {activeTab === 'input' ? <OrderInput currentUser={user} /> : <TransactionList />}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {activeMenu === 'biaya' && (
          <ExpenseManager userRole={user.role} />
        )}

        {activeMenu === 'pelanggan' && (
          <div className="glass-card animate-fade-in">
            <CustomerCRM currentUser={user} />
          </div>
        )}

        {activeMenu === 'admin' && (
          <div className="glass-card animate-fade-in">
            <AdminDashboard />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
