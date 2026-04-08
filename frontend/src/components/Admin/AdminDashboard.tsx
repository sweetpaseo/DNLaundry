import { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Settings, Users, Plus, Trash2, Power, 
  Briefcase, Calculator, History, Phone, Wallet, Receipt, Edit, Store, Tag,
  Filter, Calendar
} from 'lucide-react';
import type { Service, MemberType, Employee, Incentive, Transaction, Expense, ExpenseCategory } from '../../types';
import { ServiceModal } from './ServiceModal';
import { MemberTypeModal } from './MemberTypeModal';
import { EmployeeModal } from './EmployeeModal';
import { IncentiveModal } from './IncentiveModal';
import { UserModal } from './UserModal';
import { ExpenseModal } from '../Expense/ExpenseModal';
import { ExpenseCategoryModal } from '../Expense/ExpenseCategoryModal';
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
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [activeTab, setActiveTab] = useState<'report' | 'management' | 'payroll' | 'expenses' | 'users' | 'identity'>('report');

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
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [expenseSubTab, setExpenseSubTab] = useState<'history' | 'categories'>('history');
  const [expenseCashFilter, setExpenseCashFilter] = useState<'all' | 'petty' | 'main'>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Expense specific filter states
  const [expenseDateFilter, setExpenseDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
  const [expenseDateRange, setExpenseDateRange] = useState({ start: '', end: '' });
  const [expenseSelectedCategory, setExpenseSelectedCategory] = useState<string>('all');

  // Filter States
  const [filterType, setFilterType] = useState<'monthly' | 'weekly' | 'range'>('monthly');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | 'all'>(new Date().getFullYear());
  const [filterDay, setFilterDay] = useState<number | 'all'>('all');
  const [filterWeek, setFilterWeek] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.getTransactions(),
        api.getServices(),
        api.getMemberTypes(),
        api.getEmployees(),
        api.getIncentives(),
        api.getExpenses(),
        api.getExpenseCategories(),
        api.getUsers(),
        api.getCustomers()
      ]);

      const [t, s, l, e, i, ex, cat, u, c] = results;

      if (t.status === 'fulfilled') setTransactions(t.value || []);
      if (s.status === 'fulfilled') setServices(s.value || []);
      if (l.status === 'fulfilled') setMemberTypes(l.value || []);
      if (e.status === 'fulfilled') setEmployees(e.value || []);
      if (i.status === 'fulfilled') setIncentives(i.value || []);
      if (ex.status === 'fulfilled') setExpenses(ex.value || []);
      if (cat.status === 'fulfilled') setExpenseCategories(cat.value || []);
      if (u.status === 'fulfilled') setUsers(u.value || []);
      if (c.status === 'fulfilled') setCustomers(c.value || []);

      // If anything failed, log it but don't stop everything
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          console.warn(`Admin fetch error [index ${idx}]:`, r.reason);
        }
      });

    } catch (error) {
      console.error('Unexpected admin fetch failure:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate Filtered Stats
  const getFilteredStats = () => {
    const isWithinFilter = (dateStr: string | null | undefined) => {
      if (!dateStr) return filterType === 'monthly' && filterMonth === 'all' && filterYear === 'all';
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.getMonth();
      const year = d.getFullYear();

      if (filterType === 'range') {
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }

      if (filterType === 'weekly') {
        const mMatch = filterMonth === 'all' || month === filterMonth;
        const yMatch = filterYear === 'all' || year === filterYear;
        if (!mMatch || !yMatch) return false;
        if (filterWeek === 'all') return true;
        // W1: 1-7, W2: 8-14, W3: 15-21, W4: 22+
        if (filterWeek === 1) return day >= 1 && day <= 7;
        if (filterWeek === 2) return day >= 8 && day <= 14;
        if (filterWeek === 3) return day >= 15 && day <= 21;
        if (filterWeek === 4) return day >= 22;
        return true;
      }

      // Default: monthly/standard
      const mMatch = filterMonth === 'all' || month === filterMonth;
      const yMatch = filterYear === 'all' || year === filterYear;
      const dMatch = filterDay === 'all' || day === filterDay;
      return mMatch && yMatch && dMatch;
    };

    const filteredTransactions = transactions.filter(t => isWithinFilter(t.created_at));
    const filteredCustomers = customers.filter(c => isWithinFilter(c.created_at));

    const omzetTotal = filteredTransactions
      .filter(t => t.is_paid)
      .reduce((acc, t) => acc + t.final_price, 0);

    const uniqueOrders = new Set(filteredTransactions.map(t => t.group_id || t.id));
    const orderTotal = uniqueOrders.size;
    const pelangganTotal = filteredCustomers.length;

    return { omzetTotal, orderTotal, pelangganTotal, filteredTransactions, isWithinFilter };
  };

  const stats = getFilteredStats();

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
    if (window.confirm('Hapus layanan ini?')) {
      try {
        await api.deleteService(id);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus layanan');
      }
    }
  };

  const deleteMemberType = async (id: string) => {
    if (window.confirm('Hapus jenis member ini?')) {
      try {
        await api.deleteMemberType(id);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus jenis member');
      }
    }
  };

  const handleSaveService = async (data: Partial<Service>) => {
    try {
      if (editingService) {
        await api.updateService(editingService.id, data);
      } else {
        await api.createService(data);
      }
      fetchData();
      setIsServiceModalOpen(false);
      alert('Perubahan berhasil disimpan!');
      setEditingService(null);
    } catch (error: any) {
      alert('Gagal menyimpan layanan: ' + (error.message || 'Error tidak diketahui'));
    }
  };

  const handleSaveMemberType = async (data: Partial<MemberType>) => {
    try {
      if (editingMemberType) {
        await api.updateMemberType(editingMemberType.id, data);
      } else {
        await api.createMemberType(data);
      }
      fetchData();
      setIsMemberTypeModalOpen(false);
      setEditingMemberType(null);
      alert('Perubahan berhasil disimpan!');
    } catch (error) {
      alert('Gagal menyimpan jenis member');
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
      alert('Perubahan berhasil disimpan!');
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
        alert('Perubahan berhasil disimpan!');
      } catch (error) {
        alert('Gagal memberikan insentif');
      }
    }
    setIsIncentiveModalOpen(false);
  };

  const handleSaveExpense = async (data: Partial<Expense>) => {
    try {
      // Strip ALL non-database fields and redundant IDs/timestamps
      const cleanData = {
        amount: data.amount,
        category_id: data.category_id,
        description: data.description,
        date: data.date,
        cash_type: data.cash_type
      };
      
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, cleanData);
      } else {
        await api.createExpense(cleanData);
      }
      fetchData();
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      alert('Perubahan berhasil disimpan!');
    } catch (error: any) {
      alert('Gagal menyimpan pengeluaran: ' + (error.message || 'Terjadi kesalahan sistem'));
    }
  };

  const deleteExpense = async (id: string) => {
    if (window.confirm('Hapus catatan pengeluaran ini?')) {
      try {
        await api.deleteExpense(id);
        fetchData();
        alert('Perubahan berhasil disimpan!');
      } catch (error) {
        alert('Gagal menghapus pengeluaran');
      }
    }
  };

  const handleSaveCategory = async (data: Partial<ExpenseCategory>) => {
    try {
      if (editingCategory) {
        await api.updateExpenseCategory(editingCategory.id, data);
      } else {
        await api.createExpenseCategory(data);
      }
      fetchData();
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      alert('Perubahan berhasil disimpan!');
    } catch (error) {
      alert('Gagal menyimpan kategori');
    }
  };

  const deleteCategory = async (id: string) => {
    if (window.confirm('Hapus kategori ini? Semua pengeluaran terkait akan kehilangan kategori.')) {
      try {
        await api.deleteExpenseCategory(id);
        fetchData();
        alert('Perubahan berhasil disimpan!');
      } catch (error) {
        alert('Gagal menghapus kategori');
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
      alert('Perubahan berhasil disimpan!');
    } catch (error) {
      alert('Gagal menyimpan user');
    }
  };

  const deleteUser = async (id: string) => {
    if (window.confirm('Hapus user ini?')) {
      try {
        await api.deleteUser(id);
        fetchData();
        alert('Perubahan berhasil disimpan!');
      } catch (error) {
        alert('Gagal menghapus user');
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Panel Admin Laundry</h3>
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
          onClick={() => setActiveTab('report')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'report' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === 'report' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <TrendingUp size={16} color={activeTab === 'report' ? 'var(--primary)' : 'var(--text-muted)'} /> Report
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
 
      {activeTab === 'report' ? (
        <>
          {/* Report Filter Bar */}
          {/* New Advanced Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--glass-border)', width: 'fit-content', alignSelf: 'flex-end' }}>
              {[
                { id: 'monthly', label: 'Bulanan' },
                { id: 'weekly', label: 'Mingguan' },
                { id: 'range', label: 'Rentang' }
              ].map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setFilterType(m.id as any)}
                  style={{ 
                    padding: '0.5rem 1.2rem', 
                    fontSize: '0.8rem', 
                    background: filterType === m.id ? 'var(--primary-gradient)' : 'transparent',
                    color: filterType === m.id ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
              {filterType === 'monthly' && (
                <>
                  <select 
                    value={filterDay} 
                    onChange={(e) => setFilterDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                  >
                    <option value="all">Semua Tanggal</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Tgl {d}</option>
                    ))}
                  </select>
                  <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                  >
                    <option value="all">Semua Bulan</option>
                    {months.map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>
                </>
              )}

              {filterType === 'weekly' && (
                <>
                  <select 
                    value={filterWeek} 
                    onChange={(e) => setFilterWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                  >
                    <option value="all">Semua Minggu</option>
                    <option value={1}>Minggu 1 (1-7)</option>
                    <option value={2}>Minggu 2 (8-14)</option>
                    <option value={3}>Minggu 3 (15-21)</option>
                    <option value={4}>Minggu 4 (22+)</option>
                  </select>
                  <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                  >
                    <option value="all">Semua Bulan</option>
                    {months.map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>
                </>
              )}

              {filterType === 'range' && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>sd</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>
              )}

              {(filterType === 'monthly' || filterType === 'weekly') && (
                <select 
                  value={filterYear} 
                  onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                >
                  <option value="all">Semua Tahun</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {(() => {
              const filteredEx = expenses.filter(ex => stats.isWithinFilter(ex.date));
              const totalEx = filteredEx.reduce((acc, ex) => acc + ex.amount, 0);
              const totalIncome = stats.omzetTotal;
              const netProfit = totalIncome - totalEx;
              const profitColor = netProfit >= 0 ? '#10b981' : '#f43f5e';

              return [
                { label: 'Total Pendapatan', value: `Rp ${totalIncome.toLocaleString()}`, icon: <TrendingUp size={20} />, color: '#FF0084' },
                { label: 'Total Pengeluaran', value: `Rp ${totalEx.toLocaleString()}`, icon: <DollarSign size={20} />, color: '#D3D3D3' },
                { label: 'Laba / Rugi Bersih', value: `Rp ${netProfit.toLocaleString()}`, icon: <Calculator size={20} />, color: profitColor },
                { label: 'Margin Keuntungan', value: totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : '0%', icon: <TrendingUp size={20} />, color: profitColor },
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
              ));
            })()}
          </div>

          {/* Detailed P&L Statement */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={18} color="var(--primary)" /> Laporan Laba Rugi Detil
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
              {/* Income Column */}
              <div>
                <h5 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>PENDAPATAN</h5>
                {(() => {
                  const filteredT = transactions.filter(t => {
                    const d = new Date(t.created_at);
                    const m = filterMonth === 'all' || d.getMonth() === filterMonth;
                    const y = filterYear === 'all' || d.getFullYear() === filterYear;
                    return m && y && t.is_paid;
                  });

                  // Item mapping for details
                  const itemMap: Record<string, { amount: number, category: string }> = {};
                  filteredT.forEach(t => {
                    const s = services.find(srv => srv.id === t.service_id);
                    const cat = s?.category || 'service';
                    const name = t.service_name;
                    if (!itemMap[name]) itemMap[name] = { amount: 0, category: cat };
                    itemMap[name].amount += t.final_price;
                  });

                  const serviceIncome = filteredT
                    .filter(t => {
                      const s = services.find(srv => srv.id === t.service_id);
                      return !s || s.category !== 'product';
                    })
                    .reduce((acc, t) => acc + t.final_price, 0);

                  const productIncome = filteredT
                    .filter(t => {
                      const s = services.find(srv => srv.id === t.service_id);
                      return s?.category === 'product';
                    })
                    .reduce((acc, t) => acc + t.final_price, 0);
                  
                  const totalInc = serviceIncome + productIncome;

                  const renderItems = (cat: string) => {
                    const items = Object.entries(itemMap)
                      .filter(([, data]) => data.category === cat)
                      .sort(([, a], [, b]) => b.amount - a.amount);

                    if (items.length === 0) return null;

                    return (
                      <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem', borderLeft: '1px solid var(--glass-border)', marginLeft: '0.4rem' }}>
                        {items.map(([name, data]) => (
                          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>{name}</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                              <span>Rp {data.amount.toLocaleString()}</span>
                              <span style={{ width: '45px', textAlign: 'right', opacity: 0.6, fontSize: '0.65rem' }}>
                                ({totalInc > 0 ? ((data.amount / totalInc) * 100).toFixed(1) : '0'}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>Penjualan Jasa (Service)</span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700 }}>Rp {serviceIncome.toLocaleString()}</span>
                            <span style={{ width: '45px' }}></span>
                          </div>
                        </div>
                        {renderItems('service')}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>Penjualan Barang (Product)</span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700 }}>Rp {productIncome.toLocaleString()}</span>
                            <span style={{ width: '45px' }}></span>
                          </div>
                        </div>
                        {renderItems('product')}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--glass-border)', fontWeight: 800 }}>
                        <span>TOTAL PENDAPATAN</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--primary)' }}>Rp {totalInc.toLocaleString()}</span>
                          <span style={{ width: '45px' }}></span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Expense Column */}
              <div>
                <h5 style={{ color: '#f43f5e', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>BIAYA / PENGELUARAN</h5>
                {(() => {
                  const filteredEx = expenses.filter(ex => stats.isWithinFilter(ex.date));

                  const filteredInc = transactions.filter(t => {
                    const d = new Date(t.created_at);
                    const m = filterMonth === 'all' || d.getMonth() === filterMonth;
                    const y = filterYear === 'all' || d.getFullYear() === filterYear;
                    return m && y && t.is_paid;
                  });
                  const totalInc = filteredInc.reduce((acc, t) => acc + t.final_price, 0);

                  // Group by cash_type then category
                  const cashGroup: Record<string, Record<string, number>> = {
                    petty: {},
                    main: {}
                  };

                  filteredEx.forEach(ex => {
                    const type = ex.cash_type || 'main';
                    const catName = ex.expense_category?.name || 'Lainnya';
                    if (!cashGroup[type]) cashGroup[type] = {};
                    cashGroup[type][catName] = (cashGroup[type][catName] || 0) + ex.amount;
                  });

                  const renderCashSource = (type: 'petty' | 'main', label: string) => {
                    const categories = Object.entries(cashGroup[type]);
                    const sourceTotal = categories.reduce((sum, [, amt]) => sum + amt, 0);
                    
                    if (sourceTotal === 0) return null;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{label}</span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700 }}>Rp {sourceTotal.toLocaleString()}</span>
                            <span style={{ width: '45px' }}></span>
                          </div>
                        </div>
                        <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem', borderLeft: '1px solid var(--glass-border)', marginLeft: '0.4rem' }}>
                          {categories.map(([cat, amt]) => (
                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>{cat}</span>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span>Rp {amt.toLocaleString()}</span>
                                <span style={{ width: '45px', textAlign: 'right', opacity: 0.6, fontSize: '0.65rem' }}>
                                  ({totalInc > 0 ? ((amt / totalInc) * 100).toFixed(1) : '0'}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  };

                  const totalEx = filteredEx.reduce((acc, ex) => acc + ex.amount, 0);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {renderCashSource('petty', 'Kas Kecil (Petty Cash)')}
                      {renderCashSource('main', 'Kas Utama (Main Cash)')}
                      
                      {filteredEx.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>Tidak ada data pengeluaran</div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--glass-border)', fontWeight: 800 }}>
                        <span>TOTAL BIAYA</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ color: '#f43f5e' }}>Rp {totalEx.toLocaleString()}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{totalInc > 0 ? ((totalEx / totalInc) * 100).toFixed(1) : '0'}% dari omset</span>
                          </div>
                          <span style={{ width: '45px' }}></span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'management' ? (
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
                  <th style={{ padding: '0.75rem' }}>Waktu</th>
                  <th style={{ padding: '0.75rem' }}>Komisi</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id} style={{ borderBottom: '1px solid var(--glass-border)', opacity: service.is_active ? 1 : 0.5 }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{service.name}</span>
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: service.category === 'product' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)', color: service.category === 'product' ? '#3b82f6' : '#a855f7' }}>
                          {service.category === 'product' ? 'Product' : 'Service'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.7rem' }}>
                        <div style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>N:</span> Rp {service.price_normal?.toLocaleString()}
                        </div>
                        <div style={{ padding: '2px 6px', background: 'rgba(255, 0, 132, 0.05)', borderRadius: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                          <span>M:</span> Rp {service.price_member?.toLocaleString()}
                        </div>
                        <div style={{ padding: '2px 6px', background: 'rgba(0, 212, 255, 0.05)', borderRadius: '4px', color: 'var(--accent)' }}>
                          <span>E:</span> Rp {service.price_express?.toLocaleString()}
                        </div>
                        <div style={{ padding: '2px 6px', background: 'rgba(251, 191, 36, 0.05)', borderRadius: '4px', color: '#fbbf24' }}>
                          <span>S:</span> Rp {service.price_special?.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {service.processing_days || 0} Hari
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Estimasi Selesai</div>
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
                  <Users size={18} color="var(--accent)" /> Jenis Member
                </h4>
                <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => { setEditingMemberType(null); setIsMemberTypeModalOpen(true); }}>
                  <Plus size={14} /> Baru
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {memberTypes.map(type => (
                  <div key={type.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{type.name}</div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        style={{ 
                          padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }} 
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        onClick={() => { setEditingMemberType(type); setIsMemberTypeModalOpen(true); }}
                      >
                        <Settings size={12} />
                      </button>
                      <button 
                        style={{ 
                          padding: '0.4rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                        onClick={() => deleteMemberType(type.id)}
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
              const filteredTransactions = transactions.filter(t => t.employee_id === emp.id && stats.isWithinFilter(t.created_at));

              const filteredIncentives = incentives.filter(i => i.employee_id === emp.id && stats.isWithinFilter(i.date));

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
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <button 
                onClick={() => setExpenseSubTab('history')}
                style={{ background: 'transparent', border: 'none', borderBottom: expenseSubTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent', color: expenseSubTab === 'history' ? 'white' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0', fontWeight: 600 }}
              >
                Histori Pengeluaran
              </button>
              <button 
                onClick={() => setExpenseSubTab('categories')}
                style={{ background: 'transparent', border: 'none', borderBottom: expenseSubTab === 'categories' ? '2px solid var(--primary)' : '2px solid transparent', color: expenseSubTab === 'categories' ? 'white' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0', fontWeight: 600 }}
              >
                Kelola Kategori
              </button>
            </div>
            {expenseSubTab === 'history' ? (
              <div style={{ display: 'flex', gap: '0.8125rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <Filter size={16} color="var(--primary)" />
                  <select 
                    value={expenseSelectedCategory}
                    onChange={(e) => setExpenseSelectedCategory(e.target.value)}
                    style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    <option value="all" style={{ background: '#1e1e2e' }}>Semua Kategori</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ background: '#1e1e2e' }}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <Calendar size={16} color="var(--primary)" />
                  <select 
                    value={expenseDateFilter}
                    onChange={(e) => setExpenseDateFilter(e.target.value as any)}
                    style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    <option value="all" style={{ background: '#1e1e2e' }}>Semua Waktu</option>
                    <option value="daily" style={{ background: '#1e1e2e' }}>Hari Ini</option>
                    <option value="weekly" style={{ background: '#1e1e2e' }}>7 Hari Terakhir</option>
                    <option value="monthly" style={{ background: '#1e1e2e' }}>Bulan Ini</option>
                    <option value="custom" style={{ background: '#1e1e2e' }}>Custom Tanggal</option>
                  </select>
                </div>

                {expenseDateFilter === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="date" 
                      value={expenseDateRange.start} 
                      onChange={(e) => setExpenseDateRange(prev => ({ ...prev, start: e.target.value }))}
                      style={{ padding: '0.4rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>sd</span>
                    <input 
                      type="date" 
                      value={expenseDateRange.end} 
                      onChange={(e) => setExpenseDateRange(prev => ({ ...prev, end: e.target.value }))}
                      style={{ padding: '0.4rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                    />
                  </div>
                )}

                <select 
                  value={expenseCashFilter} 
                  onChange={(e) => setExpenseCashFilter(e.target.value as any)}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                >
                  <option value="all">Semua Kas</option>
                  <option value="petty">Kas Kecil (Staff)</option>
                  <option value="main">Kas Utama (Owner)</option>
                </select>
                <button 
                  onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={18} /> Tambah Pengeluaran
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <Plus size={18} /> Tambah Kategori
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {expenseSubTab === 'history' ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {expenses.filter(ex => (expenseCashFilter === 'all' || ex.cash_type === expenseCashFilter) && stats.isWithinFilter(ex.date)).length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada catatan pengeluaran.</div>
                ) : (
                  expenses
                    .filter(ex => {
                      // 1. Cash Type Filter
                      if (expenseCashFilter !== 'all' && ex.cash_type !== expenseCashFilter) return false;

                      // 2. Category Filter
                      if (expenseSelectedCategory !== 'all' && ex.category_id !== expenseSelectedCategory) return false;

                      // 3. Date Filter (using the same logic as ExpenseManager)
                      const expenseDate = new Date(ex.date);
                      expenseDate.setHours(0, 0, 0, 0);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);

                      if (expenseDateFilter === 'daily') {
                        if (expenseDate.getTime() !== now.getTime()) return false;
                      } else if (expenseDateFilter === 'weekly') {
                        const lastWeek = new Date(now);
                        lastWeek.setDate(now.getDate() - 7);
                        if (expenseDate < lastWeek) return false;
                      } else if (expenseDateFilter === 'monthly') {
                        if (expenseDate.getMonth() !== now.getMonth() || expenseDate.getFullYear() !== now.getFullYear()) return false;
                      } else if (expenseDateFilter === 'custom') {
                        if (expenseDateRange.start) {
                          const start = new Date(expenseDateRange.start);
                          start.setHours(0, 0, 0, 0);
                          if (expenseDate < start) return false;
                        }
                        if (expenseDateRange.end) {
                          const end = new Date(expenseDateRange.end);
                          end.setHours(0, 0, 0, 0);
                          if (expenseDate > end) return false;
                        }
                      } else {
                        // fallback to the default stats.isWithinFilter which handles the monthly/range filters from the top bar
                        // but only if expenseDateFilter is 'all'
                        if (!stats.isWithinFilter(ex.date)) return false;
                      }

                      return true;
                    })
                    .map(ex => (
                      <div key={ex.id} className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', minWidth: 'min(100%, 250px)', flex: 1 }}>
                          <div style={{ padding: '0.75rem', borderRadius: '12px', background: ex.cash_type === 'main' ? 'rgba(255, 0, 132, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: ex.cash_type === 'main' ? 'var(--primary)' : '#f43f5e', flexShrink: 0 }}>
                            <Wallet size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{ex.description}</div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                                {(ex as any).expense_categories?.[0]?.name || ex.category || 'Tanpa Kategori'}
                              </span>
                              <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: ex.cash_type === 'main' ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}>
                                {ex.cash_type === 'main' ? 'KAS UTAMA' : 'KAS KECIL'}
                              </span>
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
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => deleteExpense(ex.id)}
                            style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                   <button 
                     onClick={() => setExpenseCashFilter('all')}
                     style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', background: expenseCashFilter === 'all' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}
                   >Semua</button>
                   <button 
                     onClick={() => setExpenseCashFilter('petty')}
                     style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', background: expenseCashFilter === 'petty' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}
                   >Kas Kecil</button>
                   <button 
                     onClick={() => setExpenseCashFilter('main')}
                     style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', background: expenseCashFilter === 'main' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}
                   >Kas Utama</button>
                </div>
                {expenseCategories.filter(cat => expenseCashFilter === 'all' || cat.cash_type === expenseCashFilter).length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada kategori pengeluaran.</div>
                ) : (
                  expenseCategories
                    .filter(cat => expenseCashFilter === 'all' || cat.cash_type === expenseCashFilter)
                    .map(cat => (
                      <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Tag size={18} color="var(--primary)" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {cat.cash_type === 'main' ? 'Kas Utama (Owner)' : 'Kas Kecil (Staff)'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            style={{ 
                              padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }} 
                            onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                          >
                            <Settings size={14} />
                          </button>
                          <button 
                            style={{ 
                              padding: '0.4rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}
                            onClick={() => deleteCategory(cat.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
      </div>
      ) : activeTab === 'identity' ? (
        <IdentitySettings />
      ) : activeTab === 'users' ? (
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
      ) : null}

      {/* Modals */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        initialData={editingService}
      />

      <MemberTypeModal
        isOpen={isMemberTypeModalOpen}
        onClose={() => setIsMemberTypeModalOpen(false)}
        onSave={handleSaveMemberType}
        initialData={editingMemberType}
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

      <ExpenseCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        initialData={editingCategory}
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
