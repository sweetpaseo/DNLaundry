import { useState, useEffect } from 'react';
import { Search, Wallet, Plus, ArrowUpRight, User, Phone, Info, Clock, AlertTriangle, Edit2 } from 'lucide-react';
import { api } from '../../services/api';
import type { Customer, Transaction } from '../../types';
import { WalletModal } from './WalletModal';

export const WalletManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [customerData, transactionData] = await Promise.all([
        api.getCustomers(),
        api.getTransactions()
      ]);
      setCustomers(customerData || []);
      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Failed to fetch data for wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveBalance = async (amount: number, isCorrection: boolean) => {
    if (!selectedCustomer) return;

    try {
      const newBalance = isCorrection ? amount : (selectedCustomer.wallet_balance || 0) + amount;
      await api.updateCustomerBalance(selectedCustomer.id, newBalance);
      alert(`Berhasil memperbarui saldo ${selectedCustomer.name} menjadi Rp ${newBalance.toLocaleString()}`);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Gagal memperbarui saldo');
    }
  };

  const getCustomerDebt = (customerId: string, customerName: string) => {
    return transactions
      .filter(tr => (tr.customer_id === customerId || tr.customer_name === customerName) && !tr.is_paid)
      .reduce((sum, tr) => sum + tr.final_price, 0);
  };

  const filteredCustomers = customers
    .map(c => ({
      ...c,
      total_debt: getCustomerDebt(c.id, c.name)
    }))
    .filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    )
    .sort((a, b) => {
      // Sort by debt first, then by balance
      if (b.total_debt !== a.total_debt) return b.total_debt - a.total_debt;
      return (b.wallet_balance || 0) - (a.wallet_balance || 0);
    });

  const totalDeposits = customers.reduce((acc, c) => acc + (c.wallet_balance || 0), 0);
  const totalPiutang = transactions
    .filter(tr => !tr.is_paid)
    .reduce((acc, tr) => acc + tr.final_price, 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--primary-gradient)' }}>
          <div style={{ padding: '1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <Wallet size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Total Saldo Member (Titipan)</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>Rp {totalDeposits.toLocaleString()}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ padding: '1rem', borderRadius: '15px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Piutang Toko (Saldo Gantung)</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>Rp {totalPiutang.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', borderRadius: '15px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
            <User size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Belum Lunas</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{customers.filter(c => getCustomerDebt(c.id, c.name) > 0).length} Orang</h3>
          </div>
        </div>
      </div>

      {/* Control Area */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ArrowUpRight size={20} color="var(--primary)" /> Manajemen Saldo Pelanggan
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
                <th style={{ padding: '1rem' }}>Saldo (Titipan)</th>
                <th style={{ padding: '1rem' }}>Saldo Gantung</th>
                <th style={{ padding: '1rem' }}>Sisa Saldo</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data pelanggan ditemukan.</td>
                </tr>
              ) : filteredCustomers.map(customer => {
                const sisaSaldo = (customer.wallet_balance || 0) - (customer.total_debt || 0);
                
                return (
                <tr key={customer.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover-row">
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{customer.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={10} /> {customer.phone}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, color: (customer.wallet_balance || 0) > 0 ? '#22c55e' : 'var(--text-muted)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Wallet size={14} /> Rp {(customer.wallet_balance || 0).toLocaleString()}
                      <button 
                        onClick={() => handleOpenModal(customer)}
                        style={{ border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5 }}
                        title="Edit Saldo"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, color: (customer.total_debt || 0) > 0 ? '#ef4444' : 'var(--text-muted)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} /> Rp {(customer.total_debt || 0).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, color: sisaSaldo > 0 ? '#22c55e' : sisaSaldo < 0 ? '#ef4444' : 'var(--text-muted)', fontSize: '1rem' }}>
                      Rp {sisaSaldo.toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {sisaSaldo < 0 ? (
                      <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textTransform: 'uppercase', fontWeight: 800 }}>
                        Perlu Tambah Saldo
                      </span>
                    ) : sisaSaldo > 0 ? (
                      <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', textTransform: 'uppercase', fontWeight: 800 }}>
                        Bisa Dipakai Transaksi
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Clear
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleOpenModal(customer)}
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Plus size={14} /> Top Up / Koreksi
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ padding: '1rem', background: 'rgba(255, 193, 7, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.1)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Info size={18} color="#ffc107" />
        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 193, 7, 0.8)' }}>
          <b>Deposit:</b> Kelebihan bayar yang bisa digunakan untuk laundry berikutnya.<br/>
          <b>Saldo Gantung:</b> Tagihan yang belum dibayar oleh pelanggan. Segera konfirmasi pembayaran jika ada tagihan belum lunas.
        </p>
      </div>

      <WalletModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSave={handleSaveBalance}
      />
    </div>
  );
};
