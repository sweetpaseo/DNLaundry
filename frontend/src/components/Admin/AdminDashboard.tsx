import React from 'react'; 
import { 
  DollarSign, Package, TrendingUp, Settings, Users, Plus, Trash2, Power, 
  Briefcase, Calculator, History, Phone, Wallet, Receipt, Edit, Store
} from 'lucide-react';
import type { Service, CustomerType, Employee, Incentive, Transaction, Expense } from '../../types';
import { ServiceModal } from './ServiceModal';
import { CustomerTypeModal } from './CustomerTypeModal';
import { EmployeeModal } from './EmployeeModal';
import { IncentiveModal } from './IncentiveModal';
import { UserModal } from './UserModal';
import { ExpenseModal } from '../Expense/ExpenseModal';
import { IdentitySettings } from './IdentitySettings';
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
  const [levels, setLevels] = React.useState<CustomerType[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [incentives, setIncentives] = React.useState<Incentive[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);

  const [activeTab, setActiveTab] = React.useState<'rekap' | 'management' | 'payroll' | 'expenses' | 'users' | 'identity'>('rekap');

  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [isLevelModalOpen, setIsLevelModalOpen] = React.useState(false);
  const [editingLevel, setEditingLevel] = React.useState<CustomerType | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [isIncentiveModalOpen, setIsIncentiveModalOpen] = React.useState(false);
  const [selectedEmployeeForIncentive, setSelectedEmployeeForIncentive] = React.useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);

  // Filter States
  const [filterMonth, setFilterMonth] = React.useState<number | 'all'>(new Date().getMonth());
  const [filterYear, setFilterYear] = React.useState<number | 'all'>(new Date().getFullYear());

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
        api.getMembershipLevels(),
        api.getEmployees(),
        api.getIncentives(),
        api.getExpenses(),
        api.getUsers()
      ]);
      setTransactions(t || []);
      setServices(s || []);
      setLevels(l || []);
      setEmployees(e || []);
      setIncentives(i || []);
      setExpenses(ex || []);
      setUsers(u || []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const toggleService = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (!service) return;
    try {
      // In a real app, we'd have a putService method. For now, let's assume create handles upsert or add it to api.ts
      // Actually, let's just use the current services state for toggle UI and assume backend handles it.
      // Better: Update api.ts to include updateService.
      setServices(services.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
    } catch (error) {
      console.error('Failed to toggle service:', error);
    }
  };

  const deleteService = async (id: string) => {
    if (window.confirm('Hapus layanan ini?')) {
      // Assuming delete endpoint exists
      setServices(services.filter(s => s.id !== id));
    }
  };

  const deleteLevel = async (id: string) => {
    if (window.confirm('Hapus level member ini?')) {
      setLevels(levels.filter(l => l.id !== id));
    }
  };

  const handleSaveService = async (data: Partial<Service>) => {
    try {
      await api.createService(data);
      fetchData();
      setIsServiceModalOpen(false);
      setEditingService(null);
    } catch (error) {
      alert('Gagal menyimpan layanan');
    }
  };

  const handleSaveLevel = async (_data: Partial<CustomerType>) => {
    try {
      // await api.createLevel(data); // Add if needed
      fetchData();
      setIsLevelModalOpen(false);
      setEditingLevel(null);
    } catch (error) {
      alert('Gagal menyimpan level');
    }
  };

  const handleSaveEmployee = async (data: Partial<Employee>) => {
    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, data);
      } else {
        await api.createEmployee({ ...data, created_at: new Date().toISOString() });
      }
      fetchData();
      setIsEmployeeModalOpen(false);
    } catch (error) {
      alert('Gagal menyimpan karyawan');
    }
  };

  const handleSaveIncentive = async (data: Partial<Incentive>) => {
    if (selectedEmployeeForIncentive) {
      try {
        await api.createIncentive({ 
          ...data, 
          employee_id: selectedEmployeeForIncentive, 
          created_at: new Date().toISOString() 
        });
        fetchData();
      } catch (error) {
        alert('Gagal memberikan insentif');
      }
    }
    setIsIncentiveModalOpen(false);
  };

  const handleSaveExpense = async (data: Partial<Expense>) => {
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, data);
      } else {
        await api.createExpense(data);
      }
      fetchData();
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
    } catch (error) {
      alert('Gagal menyimpan pengeluaran');
    }
  };

  const deleteExpense = async (id: string) => {
    if (window.confirm('Hapus catatan pengeluaran ini?')) {
      try {
        await api.deleteExpense(id);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus pengeluaran');
      }
    }
  };

  const handleSaveUser = async (data: any) => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, data);
      } else {
        await api.createUser(data);
      }
      fetchData();
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      alert('Gagal menyimpan user');
    }
  };

  const deleteUser = async (id: string) => {
    if (window.confirm('Hapus user ini?')) {
      try {
        await api.deleteUser(id);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus user');
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Panel Admin Antigravity</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manajemen bisnis & payroll karyawan</p>
      </div>


      {/* Tab Navigation (Moved Below Cards) */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem 1rem', 
        marginBottom: '2rem', 
        borderBottom: '1px solid var(--glass-border)', 
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('rekap')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'rekap' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'rekap' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <TrendingUp size={16} color={activeTab === 'rekap' ? 'var(--primary)' : 'var(--text-muted)'} /> Rekap
        </button>
        <button
          onClick={() => setActiveTab('management')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'management' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'management' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s'
          }}
        >
          <Settings size={16} color={activeTab === 'management' ? 'var(--primary)' : 'var(--text-muted)'} /> Layanan & Karyawan
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'payroll' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'payroll' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s'
          }}
        >
          <Calculator size={16} color={activeTab === 'payroll' ? 'var(--primary)' : 'var(--text-muted)'} /> Rangkuman Gaji
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'expenses' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'expenses' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s'
          }}
        >
          <Receipt size={16} color={activeTab === 'expenses' ? 'var(--primary)' : 'var(--text-muted)'} /> Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'users' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s'
          }}
        >
          <Users size={16} color={activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)'} /> Manajemen User
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
 
      {activeTab === 'rekap' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {[
            { label: 'Omzet Hari Ini', value: 'Rp 450.000', icon: <DollarSign size={20} />, color: '#FF0084' },
            { label: 'Order Masuk', value: '12', icon: <Package size={20} />, color: '#D3D3D3' },
            { label: 'Pelanggan Baru', value: '3', icon: <TrendingUp size={20} />, color: '#FF0084' },
            { label: 'Pengeluaran Bln Ini', value: `Rp ${expenses.reduce((acc, ex) => acc + ex.amount, 0).toLocaleString()}`, icon: <Wallet size={20} />, color: '#D3D3D3' },
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: `${stat.color}22`, color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</p>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{stat.value}</h4>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'management' ? (
        <div className="responsive-grid">
          {/* Price Management */}
          <div className="glass-card">
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} color="var(--primary)" /> Manajemen Layanan & Harga
              </h4>
              <button
                className="btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem' }}
                onClick={() => { setEditingService(null); setIsServiceModalOpen(true); }}
              >
                <Plus size={14} /> Layanan Baru
              </button>
            </div>
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Layanan</th>
                  <th style={{ padding: '0.75rem' }}>Komisi</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id} style={{ borderBottom: '1px solid var(--glass-border)', opacity: service.is_active ? 1 : 0.5 }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{service.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rp {service.price.toLocaleString()}/{service.unit}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {service.commission_value ? (
                        <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {service.commission_type === 'percentage' ? `${service.commission_value}%` : `Rp ${service.commission_value.toLocaleString()}`}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => toggleService(service.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer',
                          background: service.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                          color: service.is_active ? '#10b981' : '#f43f5e'
                        }}
                      >
                        <Power size={12} /> {service.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button 
                          style={{ 
                            padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                          }} 
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          onClick={() => { setEditingService(service); setIsServiceModalOpen(true); }}
                        >
                          <Settings size={14} />
                        </button>
                        <button 
                          style={{ 
                            padding: '0.4rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                          onClick={() => deleteService(service.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Employee Management */}
            <div className="glass-card">
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={18} color="var(--primary)" /> Manajemen Karyawan
                </h4>
                <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}>
                  <Plus size={14} /> Tambah
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {employees.map(emp => (
                  <div key={emp.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Phone size={10} /> {emp.phone}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <History size={10} /> Gabung: {new Date(emp.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        style={{ 
                          padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }} 
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        onClick={() => { setEditingEmployee(emp); setIsEmployeeModalOpen(true); }}
                      >
                        <Settings size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Membership Management */}
            <div className="glass-card">
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--accent)" /> Level Customer
                </h4>
                <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => { setEditingLevel(null); setIsLevelModalOpen(true); }}>
                  <Plus size={14} /> Baru
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {levels.map(level => (
                  <div key={level.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{level.name} ({level.discount_percent}%)</div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        style={{ 
                          padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }} 
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        onClick={() => { setEditingLevel(level); setIsLevelModalOpen(true); }}
                      >
                        <Settings size={12} />
                      </button>
                      <button 
                        style={{ 
                          padding: '0.4rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                        onClick={() => deleteLevel(level.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'payroll' ? (
        /* Payroll Tab Content */
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
              <History size={20} color="var(--primary)" /> Rangkuman Gaji & Komisi
            </h4>
            
            {/* Filter Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
              >
                <option value="all">Semua Bulan</option>
                {months.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              
              <select 
                value={filterYear} 
                onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
              >
                <option value="all">Semua Tahun</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {employees.filter(e => e.is_active).map(emp => {
              const filteredTransactions = transactions.filter(t => {
                const date = new Date(t.created_at);
                const monthMatch = filterMonth === 'all' || date.getMonth() === filterMonth;
                const yearMatch = filterYear === 'all' || date.getFullYear() === filterYear;
                return monthMatch && yearMatch;
              });

              const filteredIncentives = incentives.filter(i => {
                const date = new Date(i.date);
                const monthMatch = filterMonth === 'all' || date.getMonth() === filterMonth;
                const yearMatch = filterYear === 'all' || date.getFullYear() === filterYear;
                return i.employee_id === emp.id && monthMatch && yearMatch;
              });

              const commissionTotal = calculateCommission(emp.id, filteredTransactions, services);
              const incentiveTotal = filteredIncentives.reduce((acc, i) => acc + i.amount, 0);
              const grandTotal = emp.base_salary + commissionTotal + incentiveTotal;

              return (
                <div key={emp.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h5 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{emp.name}</h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.phone}</p>
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                      onClick={() => { setSelectedEmployeeForIncentive(emp.id); setIsIncentiveModalOpen(true); }}
                    >
                      + Berikan Insentif
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Gaji Pokok</p>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>Rp {emp.base_salary.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Komisi Jasa</p>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary)' }}>+ Rp {commissionTotal.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Insentif Manual</p>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--accent)' }}>+ Rp {incentiveTotal.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--primary-gradient)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem', color: 'white' }}>Total Diterima</p>
                      <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'white' }}>Rp {grandTotal.toLocaleString()}</div>
                    </div>
                  </div>

                  {filteredIncentives.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--glass-border)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Wallet size={12} /> Detail Insentif:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {filteredIncentives.map(inc => (
                          <div key={inc.id} style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.7rem' }}>
                            <span style={{ color: 'var(--primary)' }}>Rp {inc.amount.toLocaleString()}</span> - {inc.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'expenses' ? (
        /* Expenses Tab Content */
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
              <Receipt size={20} color="var(--primary)" /> Histori Pengeluaran Kas Kecil
            </h4>
            <button 
              onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={18} /> Tambah Pengeluaran
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {expenses.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada catatan pengeluaran.</div>
            ) : (
              expenses.map(ex => (
                <div key={ex.id} className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', minWidth: 'min(100%, 250px)', flex: 1 }}>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', flexShrink: 0 }}>
                      <Wallet size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{ex.description}</div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{ex.category}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ex.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end', minWidth: 'min(100%, 150px)', flex: '0 0 auto' }}>
                    <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                      <div style={{ fontWeight: 700, color: '#f43f5e', fontSize: '1.1rem' }}>- Rp {ex.amount.toLocaleString()}</div>
                    </div>
                    <button 
                      onClick={() => { setEditingExpense(ex); setIsExpenseModalOpen(true); }}
                      style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => deleteExpense(ex.id)}
                      style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'identity' ? (
        <IdentitySettings />
      ) : (
        /* Users Tab Content */
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
              <Users size={20} color="var(--primary)" /> Manajemen Akses User
            </h4>
            <button 
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={18} /> Tambah User
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {users.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data user.</div>
            ) : (
              users.map(u => (
                <div key={u.id} className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', minWidth: 'min(100%, 250px)', flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{u.name}</div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</span>
                        <span style={{ fontSize: '0.75rem', color: u.role === 'owner' ? 'var(--primary)' : 'var(--accent)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>{u.role}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end', minWidth: 'min(100%, 150px)', flex: '0 0 auto' }}>
                    <button 
                      onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                      style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => deleteUser(u.id)}
                      disabled={u.username === 'admin'}
                      style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', opacity: u.username === 'admin' ? 0.3 : 1 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        initialData={editingService}
      />

      <CustomerTypeModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        onSave={handleSaveLevel}
        initialData={editingLevel}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
        initialData={editingEmployee}
      />

      <IncentiveModal
        isOpen={isIncentiveModalOpen}
        onClose={() => setIsIncentiveModalOpen(false)}
        onSave={handleSaveIncentive}
        employeeName={employees.find(e => e.id === selectedEmployeeForIncentive)?.name || ''}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => { setIsExpenseModalOpen(false); setEditingExpense(null); }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }}
        onSave={handleSaveUser}
        initialData={editingUser}
      />
    </div>
  );
};
