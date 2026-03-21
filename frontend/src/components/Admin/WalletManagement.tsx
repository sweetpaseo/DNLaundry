import { useState, useEffect } from 'react';
import { Search, Wallet, Plus, ArrowUpRight, User, Phone, Info } from 'lucide-react';
import { api } from '../../services/api';
import type { Customer } from '../../types';

export const WalletManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to fetch customers for wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualTopUp = async (customer: Customer) => {
    const amountStr = window.prompt(`Masukkan nominal tambahan saldo untuk ${customer.name}:`, '0');
    if (amountStr === null) return;
    
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Nominal tidak valid!');
      return;
    }

    try {
      const newBalance = (customer.wallet_balance || 0) + amount;
      await api.updateCustomerBalance(customer.id, newBalance);
      alert(`Berhasil menambah Rp ${amount.toLocaleString()} ke saldo ${customer.name}`);
      fetchData();
    } catch (error) {
      alert('Gagal menambah saldo');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  ).sort((a, b) => (b.wallet_balance || 0) - (a.wallet_balance || 0));

  const totalDeposits = customers.reduce((acc, c) => acc + (c.wallet_balance || 0), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--primary-gradient)' }}>
          <div style={{ padding: '1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <Wallet size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Total Dana Deposit (Liabilitas)</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>Rp {totalDeposits.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', borderRadius: '15px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
            <User size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pelanggan dengan Saldo</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{customers.filter(c => (c.wallet_balance || 0) > 0).length} Orang</h3>
          </div>
        </div>
      </div>

      {/* Control Area */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ArrowUpRight size={20} color="var(--primary)" /> Laporan Saldo Dompet Member
          </h4>
          
          <div style={{ position: 'relative', width: 'min(100%, 300px)' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari pelanggan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {/* List Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <th style={{ padding: '1rem' }}>Pelanggan</th>
                <th style={{ padding: '1rem' }}>Tipe</th>
                <th style={{ padding: '1rem' }}>Saldo Terkini</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data pelanggan ditemukan.</td>
                </tr>
              ) : filteredCustomers.map(customer => (
                <tr key={customer.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover-row">
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{customer.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={10} /> {customer.phone}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {customer.member_type_id ? 'Member' : 'Umum'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, color: (customer.wallet_balance || 0) > 0 ? '#22c55e' : 'var(--text-muted)', fontSize: '1rem' }}>
                      Rp {(customer.wallet_balance || 0).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleManualTopUp(customer)}
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Plus size={14} /> Top Up
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ padding: '1rem', background: 'rgba(255, 193, 7, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.1)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Info size={18} color="#ffc107" />
        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 193, 7, 0.8)' }}>
          Dana deposit di atas adalah akumulasi kelebihan bayar pelanggan yang dititipkan untuk transaksi mendatang. Saldo akan otomatis terpakai jika pelanggan memilih metode "Saldo Dompet" saat transaksi.
        </p>
      </div>
    </div>
  );
};
