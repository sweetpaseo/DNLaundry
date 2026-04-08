import { useState, useEffect, useMemo } from 'react';
import { Receipt, History, PlusCircle, Filter, Calendar } from 'lucide-react';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import { ExpenseModal } from './ExpenseModal';
import { api } from '../../services/api';
import type { Expense } from '../../types';

interface ExpenseManagerProps {
  userRole?: string;
}

export const ExpenseManager = ({ userRole = 'staff' }: ExpenseManagerProps) => {
  const [activeTab, setActiveTab] = useState<'input' | 'recap'>('input');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const cashType = userRole === 'owner' ? undefined : 'petty';
      const data = await api.getExpenses(cashType);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getExpenseCategories(userRole === 'owner' ? undefined : 'petty');
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [userRole]);

  useEffect(() => {
    if (activeTab === 'recap') {
      fetchExpenses();
    }
  }, [activeTab]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(ex => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && ex.category_id !== selectedCategory) return false;

      // 2. Date Filter
      const expenseDate = new Date(ex.date);
      expenseDate.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (dateFilter === 'daily') {
        if (expenseDate.getTime() !== now.getTime()) return false;
      } else if (dateFilter === 'weekly') {
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        if (expenseDate < lastWeek) return false;
      } else if (dateFilter === 'monthly') {
        if (expenseDate.getMonth() !== now.getMonth() || expenseDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'custom') {
        if (dateRange.start) {
          const start = new Date(dateRange.start);
          start.setHours(0, 0, 0, 0);
          if (expenseDate < start) return false;
        }
        if (dateRange.end) {
          const end = new Date(dateRange.end);
          end.setHours(0, 0, 0, 0);
          if (expenseDate > end) return false;
        }
      }

      return true;
    });
  }, [expenses, selectedCategory, dateFilter, dateRange]);

  const handleSave = async (data: Partial<Expense>) => {
    try {
      const cleanData = {
        amount: data.amount,
        category_id: data.category_id,
        description: data.description,
        date: data.date,
        cash_type: data.cash_type
      };
      
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, cleanData);
        alert('Pengeluaran berhasil diperbarui!');
      } else {
        await api.createExpense(cleanData);
        alert('Pengeluaran berhasil dicatat!');
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      fetchExpenses();
      if (!editingExpense) setActiveTab('recap');
    } catch (error: any) {
      alert('Gagal menyimpan: ' + (error.message || 'Terjadi kesalahan sistem'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus catatan pengeluaran ini?')) return;
    try {
      await api.deleteExpense(id);
      fetchExpenses();
    } catch (error) {
      alert('Gagal menghapus pengeluaran');
    }
  };

  return (
    <div className="expense-manager" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('input')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px',
            background: activeTab === 'input' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
            color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.3s'
          }}
        >
          <PlusCircle size={20} /> Catat Biaya
        </button>
        <button 
          onClick={() => setActiveTab('recap')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px',
            background: activeTab === 'recap' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
            color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.3s'
          }}
        >
          <History size={20} /> Rekap Biaya
        </button>
      </div>

      <div className="glass-card" style={{ padding: '2rem', minHeight: '400px' }}>
        {activeTab === 'input' ? (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Receipt size={24} color="var(--primary)" /> Input Pengeluaran Baru
            </h2>
            <ExpenseForm 
              onSave={handleSave} 
              forcedCashType={userRole === 'owner' ? undefined : 'petty'} 
            />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <History size={24} color="var(--primary)" /> Riwayat Pengeluaran
              </h2>
              
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Filter size={16} color="var(--primary)" />
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="all" style={{ background: '#1e1e2e' }}>Semua Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ background: '#1e1e2e' }}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Calendar size={16} color="var(--primary)" />
                  <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="all" style={{ background: '#1e1e2e' }}>Semua Waktu</option>
                    <option value="daily" style={{ background: '#1e1e2e' }}>Hari Ini</option>
                    <option value="weekly" style={{ background: '#1e1e2e' }}>7 Hari Terakhir</option>
                    <option value="monthly" style={{ background: '#1e1e2e' }}>Bulan Ini</option>
                    <option value="custom" style={{ background: '#1e1e2e' }}>Custom Tanggal</option>
                  </select>
                </div>

                {dateFilter === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="date" 
                      value={dateRange.start} 
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="input-field"
                      style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>sampai</span>
                    <input 
                      type="date" 
                      value={dateRange.end} 
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="input-field"
                      style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                    />
                  </div>
                )}

                <button className="btn-secondary" onClick={fetchExpenses} disabled={loading} style={{ padding: '0.4rem 1rem' }}>
                  {loading ? 'Memuat...' : 'Refresh'}
                </button>
              </div>
            </div>

            <ExpenseList 
              expenses={filteredExpenses} 
              onEdit={(ex) => { setEditingExpense(ex); setIsModalOpen(true); }}
              onDelete={handleDelete}
              filter={userRole === 'owner' ? 'all' : 'petty'}
            />
          </div>
        )}
      </div>

      {isModalOpen && (
        <ExpenseModal 
          isOpen={isModalOpen}
          initialData={editingExpense}
          onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
          onSave={handleSave}
          forcedCashType={userRole === 'owner' ? undefined : 'petty'}
        />
      )}
    </div>
  );
};
