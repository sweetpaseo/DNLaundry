import { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Settings, Users, Plus, Trash2, Power, 
  Briefcase, Calculator, History, Phone, Wallet, Receipt, Edit, Store, Tag,
  Filter, Calendar, Search, Download
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
  const [managementView, setManagementView] = useState<'edit' | 'price-list'>('edit');
  const [serviceSearch, setServiceSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

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
        start.setHours(0, 0, 0, 0);
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
  const downloadCSV = (data: any[], headers: Record<string, string>, filename: string) => {
    const headerKeys = Object.keys(headers);
    const headerLabels = Object.values(headers);
    
    const csvContent = [
      headerLabels.join(','),
      ...data.map(row => headerKeys.map(key => {
        let val = row[key];
        if (val === null || val === undefined) val = '';
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    // Gunakan array untuk Blob agar BOM dan konten terpisah dengan benar
    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.style.display = 'none';
    
    // Tambahkan ke DOM sebelum klik (penting untuk beberapa browser)
    document.body.appendChild(link);
    link.click();
    
    // Bersihkan setelah jeda singkat
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  };

  const exportPriceListCSV = () => {
    const headers = {
      name: 'Nama Layanan/Produk',
      category: 'Kategori',
      price_normal: 'Harga Normal',
      price_member: 'Harga Member',
      price_express: 'Harga Express',
      price_special: 'Harga Spesial',
      processing_days: 'Hari Proses',
      is_active: 'Status Aktif'
    };
    
    const data = services.map(s => ({
      ...s,
      is_active: s.is_active ? 'Ya' : 'Tidak'
    }));
    
    downloadCSV(data, headers, `Layanan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}`);
  };

  const exportExpensesCSV = () => {
    const headers = {
      date: 'Tanggal',
      description: 'Deskripsi',
      amount: 'Jumlah',
      cash_type: 'Tipe Kas',
      category_name: 'Kategori'
    };

    const filteredExpenses = expenses
      .filter(ex => {
        if (expenseCashFilter !== 'all' && ex.cash_type !== expenseCashFilter) return false;
        if (expenseSelectedCategory !== 'all' && ex.category_id !== expenseSelectedCategory) return false;
        if (expenseSearch && !ex.description.toLowerCase().includes(expenseSearch.toLowerCase())) return false;
        if (!stats.isWithinFilter(ex.date)) return false;
        return true;
      })
      .map(ex => ({
        ...ex,
        date: new Date(ex.date).toLocaleDateString('id-ID'),
        category_name: ex.expense_category?.name || 'Lainnya',
        cash_type: ex.cash_type === 'main' ? 'Kas Utama' : 'Kas Kecil'
      }));

    downloadCSV(filteredExpenses, headers, `Pengeluaran_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}`);
  };

  return (
    <div className="admin-dashboard">
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Panel Admin Laundry</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manajemen bisnis & payroll karyawan</p>
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
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'report' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'report' ? 800 : 600,
            color: activeTab === 'report' ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <TrendingUp size={16} color={activeTab === 'report' ? 'var(--primary)' : 'var(--text-secondary)'} /> Report
        </button>
        <button
          onClick={() => setActiveTab('management')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'management' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'management' ? 800 : 600,
            color: activeTab === 'management' ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s'
          }}
        >
          <Settings size={16} color={activeTab === 'management' ? 'var(--primary)' : 'var(--text-secondary)'} /> Layanan & Karyawan
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'payroll' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'payroll' ? 800 : 600,
            color: activeTab === 'payroll' ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s'
          }}
        >
          <Calculator size={16} color={activeTab === 'payroll' ? 'var(--primary)' : 'var(--text-secondary)'} /> Rangkuman Gaji
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'expenses' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'expenses' ? 800 : 600,
            color: activeTab === 'expenses' ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s'
          }}
        >
          <Receipt size={16} color={activeTab === 'expenses' ? 'var(--primary)' : 'var(--text-secondary)'} /> Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'users' ? 800 : 600,
            color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s'
          }}
        >
          <Users size={16} color={activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)'} /> Manajemen User
        </button>
        <button
          onClick={() => setActiveTab('identity')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'identity' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'identity' ? 800 : 600,
            color: activeTab === 'identity' ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          <Store size={16} color={activeTab === 'identity' ? 'var(--primary)' : 'var(--text-secondary)'} /> Identitas Usaha
        </button>
      </div>
 
      {activeTab === 'report' ? (
        <>
          {/* Report Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#F8FAFC', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border)', width: 'fit-content', alignSelf: 'flex-end' }}>
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
                    background: filterType === m.id ? 'var(--primary)' : 'transparent',
                    color: filterType === m.id ? '#ffffff' : 'var(--text-secondary)',
                    border: filterType === m.id ? '1px solid var(--primary)' : '1px solid transparent',
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
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    <option value="all" style={{ background: '#FFFFFF', color: '#0F172A' }}>Semua Tanggal</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d} style={{ background: '#FFFFFF', color: '#0F172A' }}>Tgl {d}</option>
                    ))}
                  </select>
                  <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    <option value="all" style={{ background: '#FFFFFF', color: '#0F172A' }}>Semua Bulan</option>
                    {months.map((m, i) => (
                      <option key={m} value={i} style={{ background: '#FFFFFF', color: '#0F172A' }}>{m}</option>
                    ))}
                  </select>
                </>
              )}

              {filterType === 'weekly' && (
                <>
                  <select 
                    value={filterWeek} 
                    onChange={(e) => setFilterWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    <option value="all" style={{ background: '#FFFFFF', color: '#0F172A' }}>Semua Minggu</option>
                    <option value={1} style={{ background: '#FFFFFF', color: '#0F172A' }}>Minggu 1 (1-7)</option>
                    <option value={2} style={{ background: '#FFFFFF', color: '#0F172A' }}>Minggu 2 (8-14)</option>
                    <option value={3} style={{ background: '#FFFFFF', color: '#0F172A' }}>Minggu 3 (15-21)</option>
                    <option value={4} style={{ background: '#FFFFFF', color: '#0F172A' }}>Minggu 4 (22+)</option>
                  </select>
                  <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    <option value="all" style={{ background: '#FFFFFF', color: '#0F172A' }}>Semua Bulan</option>
                    {months.map((m, i) => (
                      <option key={m} value={i} style={{ background: '#FFFFFF', color: '#0F172A' }}>{m}</option>
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
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>sd</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                  />
                </div>
              )}

              {(filterType === 'monthly' || filterType === 'weekly') && (
                <select 
                  value={filterYear} 
                  onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  style={{ padding: '0.5rem 0.8rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <option value="all" style={{ background: '#FFFFFF', color: '#0F172A' }}>Semua Tahun</option>
                  {years.map(y => (
                    <option key={y} value={y} style={{ background: '#FFFFFF', color: '#0F172A' }}>{y}</option>
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
              const profitColor = netProfit >= 0 ? '#059669' : '#dc2626';

              return [
                { label: 'Total Pendapatan', value: `Rp ${totalIncome.toLocaleString()}`, icon: <TrendingUp size={20} />, color: '#2563eb' },
                { label: 'Total Pengeluaran', value: `Rp ${totalEx.toLocaleString()}`, icon: <DollarSign size={20} />, color: '#dc2626' },
                { label: 'Laba / Rugi Bersih', value: `Rp ${netProfit.toLocaleString()}`, icon: <Calculator size={20} />, color: profitColor },
                { label: 'Margin Keuntungan', value: totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : '0%', icon: <TrendingUp size={20} />, color: profitColor },
              ].map(stat => (
                <div key={stat.label} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</p>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</h4>
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
                  const filteredT = transactions.filter(t => stats.isWithinFilter(t.created_at) && t.is_paid);

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
                  const filteredT = transactions.filter(t => stats.isWithinFilter(t.created_at) && t.is_paid);
                  const totalInc = filteredT.reduce((acc, t) => acc + t.final_price, 0);
                  const totalEx = filteredEx.reduce((acc, ex) => acc + ex.amount, 0);

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
                                  ({totalEx > 0 ? ((amt / totalEx) * 100).toFixed(1) : '0'}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  };

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

            {/* Net Profit Summary Row */}
            {(() => {
              const filteredT = transactions.filter(t => stats.isWithinFilter(t.created_at) && t.is_paid);
              const filteredEx = expenses.filter(ex => stats.isWithinFilter(ex.date));
              const totalInc = filteredT.reduce((acc, t) => acc + t.final_price, 0);
              const totalEx = filteredEx.reduce((acc, ex) => acc + ex.amount, 0);
              const netProfit = totalInc - totalEx;
              const margin = totalInc > 0 ? ((netProfit / totalInc) * 100).toFixed(1) : '0';

              return (
                <div style={{ 
                  marginTop: '1.75rem', 
                  paddingTop: '1.25rem', 
                  borderTop: '2px solid var(--border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '1rem',
                  background: netProfit >= 0 ? 'rgba(16, 185, 129, 0.04)' : 'rgba(244, 63, 94, 0.04)',
                  padding: '1rem 1.25rem',
                  borderRadius: '16px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>LABA BERSIH (NET PROFIT): </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: netProfit >= 0 ? '#059669' : '#dc2626' }}>
                      Rp {netProfit.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 800, 
                    color: netProfit >= 0 ? '#059669' : '#dc2626', 
                    background: netProfit >= 0 ? '#ecfdf5' : '#fff1f2', 
                    padding: '0.4rem 0.9rem', 
                    borderRadius: '999px', 
                    border: `1px solid ${netProfit >= 0 ? '#a7f3d0' : '#fecdd3'}` 
                  }}>
                    Margin Keuntungan: {margin}%
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      ) : activeTab === 'management' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Price Management (Full Width Top Section) */}
          <div className="glass-card" style={{ width: '100%', overflow: 'hidden' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <Settings size={20} color="var(--primary)" /> Manajemen Layanan & Harga
                </h4>
                <div style={{ display: 'flex', gap: '0.3rem', background: '#F1F5F9', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--border)', width: 'fit-content' }}>
                  <button 
                    onClick={() => setManagementView('edit')}
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', background: managementView === 'edit' ? 'var(--primary)' : 'transparent', color: managementView === 'edit' ? '#ffffff' : 'var(--text-secondary)', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}
                  >Kelola</button>
                  <button 
                    onClick={() => setManagementView('price-list')}
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', background: managementView === 'price-list' ? 'var(--primary)' : 'transparent', color: managementView === 'price-list' ? '#ffffff' : 'var(--text-secondary)', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}
                  >Daftar Harga</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)' }}>
                  <Search size={16} color="var(--text-secondary)" />
                  <input 
                    type="text" 
                    placeholder="Cari layanan..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, outline: 'none', width: '160px' }}
                  />
                </div>
                {managementView === 'price-list' && (
                  <button
                    onClick={exportPriceListCSV}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: '10px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <Download size={14} /> CSV
                  </button>
                )}
                <button
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.825rem', fontWeight: 800 }}
                  onClick={() => { setEditingService(null); setIsServiceModalOpen(true); }}
                >
                  <Plus size={16} /> Layanan Baru
                </button>
              </div>
            </div>

            {managementView === 'edit' ? (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8125rem', textAlign: 'left', fontWeight: 700 }}>
                      <th style={{ padding: '0.85rem 0.75rem', width: '42%' }}>Layanan & Tier Harga</th>
                      <th style={{ padding: '0.85rem 0.75rem', width: '15%' }}>Waktu Proses</th>
                      <th style={{ padding: '0.85rem 0.75rem', width: '15%' }}>Komisi</th>
                      <th style={{ padding: '0.85rem 0.75rem', width: '14%' }}>Status</th>
                      <th style={{ padding: '0.85rem 0.75rem', width: '14%', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services
                      .filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                      .map(service => (
                      <tr key={service.id} style={{ borderBottom: '1px solid var(--border)', opacity: service.is_active ? 1 : 0.6 }}>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{service.name}</span>
                            <span style={{ 
                              fontSize: '0.68rem', 
                              padding: '3px 8px', 
                              borderRadius: '999px', 
                              fontWeight: 700,
                              background: service.category === 'product' ? '#EFF6FF' : '#ECFEFF', 
                              color: service.category === 'product' ? '#2563EB' : '#0891B2',
                              border: `1px solid ${service.category === 'product' ? '#BFDBFE' : '#A5F3FC'}`
                            }}>
                              {service.category === 'product' ? 'Produk' : 'Jasa'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem', fontSize: '0.75rem' }}>
                            <div style={{ padding: '4px 8px', background: '#F1F5F9', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#334155', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Normal:</span>
                              <span style={{ fontWeight: 700, marginLeft: '0.4rem' }}>Rp {service.price_normal?.toLocaleString()}</span>
                            </div>
                            <div style={{ padding: '4px 8px', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1D4ED8', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 600 }}>Member:</span>
                              <span style={{ fontWeight: 800, marginLeft: '0.4rem' }}>Rp {service.price_member?.toLocaleString()}</span>
                            </div>
                            <div style={{ padding: '4px 8px', background: '#F3E8FF', borderRadius: '6px', border: '1px solid #E9D5FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#7E22CE', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 600 }}>Express:</span>
                              <span style={{ fontWeight: 700, marginLeft: '0.4rem' }}>Rp {service.price_express?.toLocaleString()}</span>
                            </div>
                            <div style={{ padding: '4px 8px', background: '#FEF3C7', borderRadius: '6px', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#B45309', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 600 }}>Spesial:</span>
                              <span style={{ fontWeight: 700, marginLeft: '0.4rem' }}>Rp {service.price_special?.toLocaleString()}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {service.processing_days || 0} Hari
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>Estimasi Selesai</div>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          {service.commission_value ? (
                            <span style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 800, background: '#EFF6FF', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #BFDBFE', whiteSpace: 'nowrap' }}>
                              {service.commission_type === 'percentage' ? `${service.commission_value}%` : `Rp ${service.commission_value.toLocaleString()}`}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <button
                            onClick={() => toggleService(service.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 800, whiteSpace: 'nowrap',
                              background: service.is_active ? '#ECFDF5' : '#FEF2F2',
                              color: service.is_active ? '#059669' : '#DC2626',
                              border: `1px solid ${service.is_active ? '#A7F3D0' : '#FECDD3'}`
                            }}
                          >
                            <Power size={13} /> {service.is_active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button 
                              style={{ 
                                padding: '0.45rem', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                              }} 
                              onClick={() => { setEditingService(service); setIsServiceModalOpen(true); }}
                              title="Edit Layanan"
                            >
                              <Settings size={15} />
                            </button>
                            <button 
                              style={{ 
                                padding: '0.45rem', borderRadius: '8px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                              }}
                              onClick={() => deleteService(service.id)}
                              title="Hapus Layanan"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left', fontWeight: 700 }}>
                      <th style={{ padding: '1rem 0.75rem' }}>Nama Layanan</th>
                      <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Normal</th>
                      <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Member</th>
                      <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Express</th>
                      <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Spesial</th>
                      <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Proses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services
                      .filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                      .map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', opacity: s.is_active ? 1 : 0.6 }}>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{s.category === 'product' ? 'Produk' : 'Jasa'}</div>
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>Rp {s.price_normal?.toLocaleString()}</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#1D4ED8', fontWeight: 800 }}>Rp {s.price_member?.toLocaleString()}</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#7E22CE', fontWeight: 700 }}>Rp {s.price_express?.toLocaleString()}</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#B45309', fontWeight: 700 }}>Rp {s.price_special?.toLocaleString()}</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>{s.processing_days || 0} Hari</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Grid for Employee & Membership Management */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
            {/* Employee Management */}
            <div className="glass-card">
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <Briefcase size={20} color="var(--primary)" /> Manajemen Karyawan
                </h4>
                <button className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', fontWeight: 800 }} onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}>
                  <Plus size={14} /> Tambah
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {employees.map(emp => (
                  <div key={emp.id} style={{ padding: '0.9rem 1.1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.3rem', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Phone size={12} color="#2563EB" /> {emp.phone}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <History size={12} color="#64748B" /> Gabung: {new Date(emp.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        style={{ 
                          padding: '0.45rem', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }} 
                        onClick={() => { setEditingEmployee(emp); setIsEmployeeModalOpen(true); }}
                        title="Edit Karyawan"
                      >
                        <Settings size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Membership Management */}
            <div className="glass-card">
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <Users size={20} color="var(--primary)" /> Jenis Member
                </h4>
                <button className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', fontWeight: 800 }} onClick={() => { setEditingMemberType(null); setIsMemberTypeModalOpen(true); }}>
                  <Plus size={14} /> Baru
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {memberTypes.map(type => (
                  <div key={type.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{type.name}</div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        style={{ 
                          padding: '0.45rem', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }} 
                        onClick={() => { setEditingMemberType(type); setIsMemberTypeModalOpen(true); }}
                        title="Edit Member Type"
                      >
                        <Settings size={15} />
                      </button>
                      <button 
                        style={{ 
                          padding: '0.45rem', borderRadius: '8px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onClick={() => deleteMemberType(type.id)}
                        title="Hapus Member Type"
                      >
                        <Trash2 size={15} />
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
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              <History size={20} color="var(--primary)" /> Rangkuman Gaji & Komisi
            </h4>
            
            {/* Filter Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ padding: '0.45rem 0.9rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 700, outline: 'none' }}
              >
                <option value="all" style={{ background: '#ffffff', color: '#0F172A' }}>Semua Bulan</option>
                {months.map((m, i) => (
                  <option key={m} value={i} style={{ background: '#ffffff', color: '#0F172A' }}>{m}</option>
                ))}
              </select>
              
              <select 
                value={filterYear} 
                onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ padding: '0.45rem 0.9rem', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 700, outline: 'none' }}
              >
                <option value="all" style={{ background: '#ffffff', color: '#0F172A' }}>Semua Tahun</option>
                {years.map(y => (
                  <option key={y} value={y} style={{ background: '#ffffff', color: '#0F172A' }}>{y}</option>
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
                <div key={emp.id} style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{emp.name}</h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{emp.phone}</p>
                      </div>
                    </div>
                    <button
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.2s' }}
                      onClick={() => { setSelectedEmployeeForIncentive(emp.id); setIsIncentiveModalOpen(true); }}
                    >
                      + Berikan Insentif
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Gaji Pokok</p>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Rp {emp.base_salary.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '1rem', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                      <p style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600, marginBottom: '0.25rem' }}>Komisi Jasa</p>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D4ED8' }}>+ Rp {commissionTotal.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '1rem', background: '#F3E8FF', borderRadius: '12px', border: '1px solid #E9D5FF' }}>
                      <p style={{ fontSize: '0.75rem', color: '#6B21A8', fontWeight: 600, marginBottom: '0.25rem' }}>Insentif Manual</p>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#7E22CE' }}>+ Rp {incentiveTotal.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                      <p style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.25rem', color: '#DBEAFE', fontWeight: 600 }}>Total Diterima</p>
                      <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#FFFFFF' }}>Rp {grandTotal.toLocaleString()}</div>
                    </div>
                  </div>

                  {filteredIncentives.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #CBD5E1' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Wallet size={12} /> Detail Insentif:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {filteredIncentives.map(inc => (
                          <div key={inc.id} style={{ padding: '0.3rem 0.6rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                            <span style={{ color: '#2563EB', fontWeight: 800 }}>Rp {inc.amount.toLocaleString()}</span> - {inc.description}
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
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setExpenseSubTab('history')}
                style={{ padding: '0.45rem 1rem', fontSize: '0.825rem', background: expenseSubTab === 'history' ? 'var(--primary)' : 'transparent', color: expenseSubTab === 'history' ? '#ffffff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.2s' }}
              >
                Histori Pengeluaran
              </button>
              <button 
                onClick={() => setExpenseSubTab('categories')}
                style={{ padding: '0.45rem 1rem', fontSize: '0.825rem', background: expenseSubTab === 'categories' ? 'var(--primary)' : 'transparent', color: expenseSubTab === 'categories' ? '#ffffff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.2s' }}
              >
                Kelola Kategori
              </button>
            </div>

            {expenseSubTab === 'history' ? (
              <button 
                onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 800 }}
              >
                <Plus size={18} /> Tambah Pengeluaran
              </button>
            ) : (
              <button 
                onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 800 }}
              >
                <Plus size={18} /> Tambah Kategori
              </button>
            )}
          </div>

          {expenseSubTab === 'history' && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)', flex: '1 1 200px' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input 
                  type="text" 
                  placeholder="Cari deskripsi..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 600, outline: 'none', width: '100%' }}
                />
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)' }}>
                <Filter size={16} color="var(--primary)" />
                <select 
                  value={expenseSelectedCategory}
                  onChange={(e) => setExpenseSelectedCategory(e.target.value)}
                  style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600 }}
                >
                  <option value="all" style={{ background: '#ffffff', color: '#0F172A' }}>Semua Kategori</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id} style={{ background: '#ffffff', color: '#0F172A' }}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)' }}>
                <Calendar size={16} color="var(--primary)" />
                <select 
                  value={expenseDateFilter}
                  onChange={(e) => setExpenseDateFilter(e.target.value as any)}
                  style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600 }}
                >
                  <option value="all" style={{ background: '#ffffff', color: '#0F172A' }}>Semua Waktu</option>
                  <option value="daily" style={{ background: '#ffffff', color: '#0F172A' }}>Hari Ini</option>
                  <option value="weekly" style={{ background: '#ffffff', color: '#0F172A' }}>7 Hari Terakhir</option>
                  <option value="monthly" style={{ background: '#ffffff', color: '#0F172A' }}>Bulan Ini</option>
                  <option value="custom" style={{ background: '#ffffff', color: '#0F172A' }}>Custom Tanggal</option>
                </select>
              </div>

              {expenseDateFilter === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="date" 
                    value={expenseDateRange.start} 
                    onChange={(e) => setExpenseDateRange(prev => ({ ...prev, start: e.target.value }))}
                    style={{ padding: '0.45rem', fontSize: '0.825rem', background: '#FFFFFF', border: '1.5px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', fontWeight: 600 }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>sd</span>
                  <input 
                    type="date" 
                    value={expenseDateRange.end} 
                    onChange={(e) => setExpenseDateRange(prev => ({ ...prev, end: e.target.value }))}
                    style={{ padding: '0.45rem', fontSize: '0.825rem', background: '#FFFFFF', border: '1.5px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', fontWeight: 600 }}
                  />
                </div>
              )}

              {/* Cash Filter */}
              <select 
                value={expenseCashFilter} 
                onChange={(e) => setExpenseCashFilter(e.target.value as any)}
                style={{ padding: '0.45rem 0.9rem', borderRadius: '10px', background: '#FFFFFF', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 600, outline: 'none' }}
              >
                <option value="all" style={{ background: '#ffffff', color: '#0F172A' }}>Semua Kas</option>
                <option value="petty" style={{ background: '#ffffff', color: '#0F172A' }}>Kas Kecil (Staff)</option>
                <option value="main" style={{ background: '#ffffff', color: '#0F172A' }}>Kas Utama (Owner)</option>
              </select>

              {/* Export CSV Button */}
              <button
                onClick={exportExpensesCSV}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: '10px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, marginLeft: 'auto' }}
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {expenseSubTab === 'history' ? (
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {expenses.filter(ex => (expenseCashFilter === 'all' || ex.cash_type === expenseCashFilter) && stats.isWithinFilter(ex.date)).length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Belum ada catatan pengeluaran.</div>
                ) : (
                  expenses
                    .filter(ex => {
                      if (expenseCashFilter !== 'all' && ex.cash_type !== expenseCashFilter) return false;
                      if (expenseSelectedCategory !== 'all' && ex.category_id !== expenseSelectedCategory) return false;

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
                        if (!stats.isWithinFilter(ex.date)) return false;
                      }

                      return true;
                    })
                    .map(ex => {
                      const categoryName = (ex as any).expense_categories?.[0]?.name || ex.category || 'Pengeluaran';
                      const displayTitle = (ex.description && isNaN(Number(ex.description))) 
                        ? ex.description 
                        : `${categoryName} (No. #${ex.id || ''})`;

                      return (
                        <div 
                          key={ex.id} 
                          style={{ 
                            padding: '1.1rem 1.25rem', 
                            background: '#FFFFFF', 
                            borderRadius: '16px', 
                            border: '1px solid #E2E8F0', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            flexWrap: 'wrap', 
                            gap: '1rem' 
                          }}
                        >
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: 'min(100%, 280px)', flex: 1 }}>
                            <div style={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: '14px', 
                              background: ex.cash_type === 'main' ? '#EFF6FF' : '#FFF1F2', 
                              color: ex.cash_type === 'main' ? '#2563EB' : '#E11D48', 
                              border: `1.5px solid ${ex.cash_type === 'main' ? '#BFDBFE' : '#FECDD3'}`, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              flexShrink: 0 
                            }}>
                              <Wallet size={22} />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>{displayTitle}</div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: '#334155', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.15rem 0.65rem', borderRadius: '999px', fontWeight: 700 }}>
                                  {categoryName}
                                </span>
                                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.65rem', borderRadius: '999px', background: ex.cash_type === 'main' ? '#EFF6FF' : '#FFF1F2', color: ex.cash_type === 'main' ? '#1D4ED8' : '#E11D48', border: `1px solid ${ex.cash_type === 'main' ? '#BFDBFE' : '#FECDD3'}`, fontWeight: 800 }}>
                                  {ex.cash_type === 'main' ? 'KAS UTAMA' : 'KAS KECIL'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.2rem' }}>
                                  <Calendar size={13} color="#94A3B8" /> {new Date(ex.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end', flex: '0 0 auto' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 900, color: '#E11D48', fontSize: '1.15rem' }}>- Rp {ex.amount.toLocaleString()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button 
                                onClick={() => { setEditingExpense(ex); setIsExpenseModalOpen(true); }}
                                style={{ padding: '0.5rem', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Edit Pengeluaran"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => deleteExpense(ex.id)}
                                style={{ padding: '0.5rem', borderRadius: '10px', background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Hapus Pengeluaran"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                   <button 
                     onClick={() => setExpenseCashFilter('all')}
                     style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.78rem', background: expenseCashFilter === 'all' ? 'var(--primary)' : '#F1F5F9', color: expenseCashFilter === 'all' ? '#ffffff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                   >Semua</button>
                   <button 
                     onClick={() => setExpenseCashFilter('petty')}
                     style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.78rem', background: expenseCashFilter === 'petty' ? 'var(--primary)' : '#F1F5F9', color: expenseCashFilter === 'petty' ? '#ffffff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                   >Kas Kecil</button>
                   <button 
                     onClick={() => setExpenseCashFilter('main')}
                     style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.78rem', background: expenseCashFilter === 'main' ? 'var(--primary)' : '#F1F5F9', color: expenseCashFilter === 'main' ? '#ffffff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                   >Kas Utama</button>
                </div>
                {expenseCategories.filter(cat => expenseCashFilter === 'all' || cat.cash_type === expenseCashFilter).length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Belum ada kategori pengeluaran.</div>
                ) : (
                  expenseCategories
                    .filter(cat => expenseCashFilter === 'all' || cat.cash_type === expenseCashFilter)
                    .map(cat => (
                      <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ padding: '0.65rem', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                            <Tag size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>{cat.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                              {cat.cash_type === 'main' ? 'Kas Utama (Owner)' : 'Kas Kecil (Staff)'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            style={{ 
                              padding: '0.5rem', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }} 
                            onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                            title="Edit Kategori"
                          >
                            <Settings size={16} />
                          </button>
                          <button 
                            style={{ 
                              padding: '0.5rem', borderRadius: '10px', background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}
                            onClick={() => deleteCategory(cat.id)}
                            title="Hapus Kategori"
                          >
                            <Trash2 size={16} />
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
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              <Users size={20} color="var(--primary)" /> Manajemen Akses User
            </h4>
            <button 
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800 }}
            >
              <Plus size={18} /> Tambah User
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {users.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Belum ada data user.</div>
            ) : (
              users.map(u => (
                <div key={u.id} style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', minWidth: 'min(100%, 250px)', flex: 1 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>@{u.username}</span>
                        <span style={{ fontSize: '0.7rem', color: u.role === 'owner' ? '#1D4ED8' : '#0891B2', background: u.role === 'owner' ? '#EFF6FF' : '#ECFEFF', border: `1px solid ${u.role === 'owner' ? '#BFDBFE' : '#A5F3FC'}`, padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', fontWeight: 800 }}>{u.role}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end', minWidth: 'min(100%, 150px)', flex: '0 0 auto' }}>
                    <button 
                      onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                      style={{ padding: '0.45rem', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Edit User"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => deleteUser(u.id)}
                      disabled={u.username === 'admin'}
                      style={{ padding: '0.45rem', borderRadius: '8px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECDD3', cursor: 'pointer', opacity: u.username === 'admin' ? 0.3 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Hapus User"
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
