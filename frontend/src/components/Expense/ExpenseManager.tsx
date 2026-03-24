import { useState, useEffect } from 'react';
import { Receipt, History, PlusCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // Staff only sees petty cash, Owner sees all (handling filter in List)
      const cashType = userRole === 'owner' ? undefined : 'petty';
      const data = await api.getExpenses(cashType);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recap') {
      fetchExpenses();
    }
  }, [activeTab]);

  const handleSave = async (data: Partial<Expense>) => {
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
        alert('Pengeluaran berhasil diperbarui!');
      } else {
        await api.createExpense(cleanData);
        alert('Pengeluaran berhasil dicatat!');
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      fetchExpenses();
      if (!editingExpense) setActiveTab('recap'); // Switch to recap after new entry
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <History size={24} color="var(--primary)" /> Riwayat Pengeluaran
              </h2>
              <button className="btn-secondary" onClick={fetchExpenses} disabled={loading}>
                {loading ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
            <ExpenseList 
              expenses={expenses} 
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
