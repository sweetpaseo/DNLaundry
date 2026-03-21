import { useState, useEffect, FormEvent } from 'react';
import { 
  DollarSign, Package, TrendingUp, Settings, Users, Plus, Trash2, Power, 
  Briefcase, Calculator, History, Phone, Wallet, Receipt, Edit, Store
} from 'lucide-react';
import type { Service, MemberType, Employee, Incentive, Transaction, Expense } from '../../types';
import { ServiceModal } from './ServiceModal';
import { MemberTypeModal } from './MemberTypeModal';
import { EmployeeModal } from './EmployeeModal';
import { IncentiveModal } from './IncentiveModal';
import { UserModal } from './UserModal';
import { ExpenseModal } from '../Expense/ExpenseModal';
import { IdentitySettings } from './IdentitySettings';
import { WalletManagement } from './WalletManagement';
import { api } from '../../services/api';

// Helpers
const calculateCommission = (empId: string, trans: Transaction[], srvs: Service[]) => {
  return trans
    .filter(t => t.employee_id === empId && t.is_paid)
    .reduce((acc, t) => {
      const srv = srvs.find(s => s.id === t.service_id);
      if (!srv || !srv.commission_value) return acc;
      
      if (srv.commission_type === 'percentage') {
        return acc + (t.final_price * srv.commission_value / 100);
      } else {
        return acc + srv.commission_value;
      }
    }, 0);
};

export const AdminDashboard = () => {
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [activeTab, setActiveTab] = useState<'rekap' | 'management' | 'payroll' | 'expenses' | 'users' | 'identity' | 'wallet'>('rekap');

  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isMemberTypeModalOpen, setIsMemberTypeModalOpen] = useState(false);
  const [editingMemberType, setEditingMemberType] = useState<MemberType | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isIncentiveModalOpen, setIsIncentiveModalOpen] = useState(false);
  const [selectedEmployeeForIncentive, setSelectedEmployeeForIncentive] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Filter States
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | 'all'>(new Date().getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchData = async () => {
    try {
      const [t, s, l, e, i, ex, u] = await Promise.all([
        api.getTransactions(),
        api.getServices(),
        api.getMemberTypes(),
        api.getEmployees(),
        api.getIncentives(),
        api.getExpenses(),
        api.getUsers()
      ]);
      setTransactions(t || []);
      setServices(s || []);
      setMemberTypes(l || []);
      setEmployees(e || []);
      setIncentives(i || []);
      setExpenses(ex || []);
      setUsers(u || []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleService = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (!service) return;
    try {
      await api.updateService(id, { is_active: !service.is_active });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle service:', error);
    }
  };

  const deleteService = async (id: string) => {
    if (!window.confirm('Hapus layanan ini?')) return;
    try {
      await api.deleteService(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const deleteMemberType = async (id: string) => {
    if (!window.confirm('Hapus jenis member ini?')) return;
    try {
      await api.deleteMemberType(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete member type:', error);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!window.confirm('Hapus staff ini?')) return;
    try {
      await api.deleteEmployee(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Hapus akses login user ini?')) return;
    try {
      await api.deleteUser(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!window.confirm('Hapus pengeluaran ini?')) return;
    try {
      await api.deleteExpense(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const filteredIncentives = incentives.filter(inc => {
    const incDate = new Date(inc.created_at);
    const monthMatch = filterMonth === 'all' || incDate.getMonth() === filterMonth;
    const yearMatch = filterYear === 'all' || incDate.getFullYear() === filterYear;
    return monthMatch && yearMatch;
  });

  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    const monthMatch = filterMonth === 'all' || expDate.getMonth() === filterMonth;
    const yearMatch = filterYear === 'all' || expDate.getFullYear() === filterYear;
    return monthMatch && yearMatch;
  });

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.created_at);
    const monthMatch = filterMonth === 'all' || tDate.getMonth() === filterMonth;
    const yearMatch = filterYear === 'all' || tDate.getFullYear() === filterYear;
    return monthMatch && yearMatch;
  });

  const stats = {
    revenue: filteredTransactions.filter(t => t.is_paid).reduce((acc, t) => acc + t.final_price, 0),
    orders: filteredTransactions.length,
    customers: new Set(filteredTransactions.map(t => t.customer_id)).size,
    expenses: filteredExpenses.reduce((acc, e) => acc + e.amount, 0)
  };

  const profit = stats.revenue - stats.expenses;

  return (
    <div className="animate-fade-in">
      {/* Header & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Panel Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kelola seluruh aspek bisnis laundry Anda di sini.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <select 
            value={filterMonth} 
            onChange={e => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: '120px' }}
          >
            <option value="all">Semua Bulan</option>
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={filterYear} 
            onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="all">Semua Tahun</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', overflowX: 'auto', paddingBottom: '2px' }} className="hide-scrollbar">
        <button
          onClick={() => setActiveTab('rekap')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'rekap' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'rekap' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <TrendingUp size={16} color={activeTab === 'rekap' ? 'var(--primary)' : 'var(--text-muted)'} /> Ringkasan & Laporan
        </button>
        <button
          onClick={() => setActiveTab('management')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'management' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'management' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <Settings size={16} color={activeTab === 'management' ? 'var(--primary)' : 'var(--text-muted)'} /> Data Master
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'expenses' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'expenses' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <DollarSign size={16} color={activeTab === 'expenses' ? 'var(--primary)' : 'var(--text-muted)'} /> Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'payroll' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'payroll' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <Briefcase size={16} color={activeTab === 'payroll' ? 'var(--primary)' : 'var(--text-muted)'} /> Payroll & Insentif
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'users' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <Users size={16} color={activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)'} /> Manajemen User
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'wallet' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'wallet' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <Wallet size={16} color={activeTab === 'wallet' ? 'var(--primary)' : 'var(--text-muted)'} /> Manajemen Wallet
        </button>
        <button
          onClick={() => setActiveTab('identity')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'identity' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'identity' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <Store size={16} color={activeTab === 'identity' ? 'var(--primary)' : 'var(--text-muted)'} /> Identitas Usaha
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'rekap' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--primary-gradient)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Total Pendapatan</span>
                <DollarSign size={20} color="white" />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Rp {stats.revenue.toLocaleString()}</h3>
            </div>
            
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Biaya</span>
                <Calculator size={20} color="#f87171" />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Rp {stats.expenses.toLocaleString()}</h3>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Profit Bersih</span>
                <TrendingUp size={20} color={profit >= 0 ? '#4ade80' : '#f87171'} />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: profit >= 0 ? '#4ade80' : '#f87171' }}>
                Rp {profit.toLocaleString()}
              </h3>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Jumlah Pesanan</span>
                <Package size={20} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.orders}</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="var(--primary)" /> Perbandingan Pencapaian
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Modul grafik performa sedang dioptimasi di server.</p>
            </div>
          </div>
        </div>
      ) : activeTab === 'management' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Services Section */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Layanan & Harga</h4>
              <button 
                onClick={() => { setEditingService(null); setIsServiceModalOpen(true); }}
                className="btn-primary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} /> Tambah Layanan
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '1rem' }}>Layanan</th>
                    <th style={{ padding: '1rem' }}>Harga</th>
                    <th style={{ padding: '1rem' }}>Min/Waktu</th>
                    <th style={{ padding: '1rem' }}>Komisi</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(srv => (
                    <tr key={srv.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{srv.name}</td>
                      <td style={{ padding: '1rem' }}>Rp {srv.price.toLocaleString()} / {srv.unit || 'kg'}</td>
                      <td style={{ padding: '1rem' }}>{srv.min_weight} {srv.unit || 'kg'} / {srv.estimated_days} Hari</td>
                      <td style={{ padding: '1rem', fontSize: '0.75rem' }}>
                        {srv.commission_value > 0 ? (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                            {srv.commission_value}{srv.commission_type === 'percentage' ? '%' : ' Tetap'}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          onClick={() => toggleService(srv.id)}
                          style={{
                            padding: '0.25rem 0.5rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600,
                            background: srv.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                            color: srv.is_active ? '#22c55e' : '#f43f5e', border: '1px solid currentColor'
                          }}
                        >
                          {srv.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => { setEditingService(srv); setIsServiceModalOpen(true); }} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '0.25rem' }}>
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deleteService(srv.id)} style={{ background: 'transparent', color: '#f43f5e', padding: '0.25rem' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {/* Member Types Section */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Tipe Pelanggan (Member)</h4>
                <button 
                  onClick={() => { setEditingMemberType(null); setIsMemberTypeModalOpen(true); }}
                  className="btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.75rem' }}>Nama</th>
                      <th style={{ padding: '0.75rem' }}>Diskon</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberTypes.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{m.name}</td>
                        <td style={{ padding: '0.75rem' }}>{m.discount_percent}%</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => { setEditingMemberType(m); setIsMemberTypeModalOpen(true); }} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                              <Edit size={14} />
                            </button>
                            <button onClick={() => deleteMemberType(m.id)} style={{ background: 'transparent', color: '#f43f5e' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Employee Section */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Staff & Pegawai</h4>
                <button 
                  onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}
                  className="btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.75rem' }}>Nama</th>
                      <th style={{ padding: '0.75rem' }}>Gaji Pokok</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{e.name}</td>
                        <td style={{ padding: '0.75rem' }}>Rp {e.base_salary.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => { setEditingEmployee(e); setIsEmployeeModalOpen(true); }} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                              <Edit size={14} />
                            </button>
                            <button onClick={() => deleteEmployee(e.id)} style={{ background: 'transparent', color: '#f43f5e' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'payroll' ? (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Rekap Gaji & Bonus Staff</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total insentif dihitung berdasarkan komisi per layanan yang diselesaikan.</p>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem' }}>Nama Staff</th>
                  <th style={{ padding: '1rem' }}>Gaji Pokok</th>
                  <th style={{ padding: '1rem' }}>Komisi Layanan</th>
                  <th style={{ padding: '1rem' }}>Bonus/Insentif Lain</th>
                  <th style={{ padding: '1rem' }}>Total Diterima</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => {
                  const commission = calculateCommission(e.id, filteredTransactions, services);
                  const bonuses = filteredIncentives.filter(i => i.employee_id === e.id).reduce((acc, i) => acc + i.amount, 0);
                  const total = e.base_salary + commission + bonuses;
                  
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{e.name}</td>
                      <td style={{ padding: '1rem' }}>Rp {e.base_salary.toLocaleString()}</td>
                      <td style={{ padding: '1rem', color: '#4ade80', fontWeight: 600 }}>+ Rp {commission.toLocaleString()}</td>
                      <td style={{ padding: '1rem', color: '#2dd4bf' }}>+ Rp {bonuses.toLocaleString()}</td>
                      <td style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 800 }}>Rp {total.toLocaleString()}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => { setSelectedEmployeeForIncentive(e.id); setIsIncentiveModalOpen(true); }}
                          className="btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        >
                          <Plus size={14} /> Beri Bonus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'expenses' ? (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Daftar Pengeluaran Operasional</h4>
            <button 
              onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
              className="btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Catat Pengeluaran
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem' }}>Tanggal</th>
                  <th style={{ padding: '1rem' }}>Keterangan</th>
                  <th style={{ padding: '1rem' }}>Kategori</th>
                  <th style={{ padding: '1rem' }}>Jumlah</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>{new Date(exp.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{exp.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#f87171' }}>Rp {exp.amount.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => { setEditingExpense(exp); setIsExpenseModalOpen(true); }} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => deleteExpense(exp.id)} style={{ background: 'transparent', color: '#f43f5e' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'identity' ? (
        <IdentitySettings />
      ) : activeTab === 'wallet' ? (
        <WalletManagement />
      ) : activeTab === 'users' ? (
        /* Users Tab Content */
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Manajemen Akses Dashboard</h4>
            <button 
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Buat User Baru
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem' }}>Username</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Dibuat Pada</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? '#3b82f6' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => deleteUser(u.id)} style={{ background: 'transparent', color: '#f43f5e' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      <ServiceModal 
        isOpen={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)} 
        onSave={fetchData} 
        service={editingService} 
      />
      <MemberTypeModal
        isOpen={isMemberTypeModalOpen}
        onClose={() => setIsMemberTypeModalOpen(false)}
        onSave={fetchData}
        memberType={editingMemberType}
      />
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSave={fetchData}
        employee={editingEmployee}
      />
      <IncentiveModal
        isOpen={isIncentiveModalOpen}
        onClose={() => setIsIncentiveModalOpen(false)}
        onSave={fetchData}
        employeeId={selectedEmployeeForIncentive}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={fetchData}
        expense={editingExpense}
      />
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={fetchData}
        user={editingUser}
      />
    </div>
  );
};
破
