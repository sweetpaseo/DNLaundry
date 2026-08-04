import { Wallet, Edit, Trash2 } from 'lucide-react';
import type { Expense } from '../../types';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  filter?: 'all' | 'petty' | 'main';
}

export const ExpenseList = ({ expenses, onEdit, onDelete, filter = 'all' }: ExpenseListProps) => {
  const filteredExpenses = expenses.filter(ex => filter === 'all' || ex.cash_type === filter);

  if (filteredExpenses.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Belum ada catatan pengeluaran.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {filteredExpenses.map(ex => (
        <div key={ex.id} className="glass-card expense-card">
          <div className="expense-info">
            <div 
              className="expense-icon"
              style={{ 
                background: ex.cash_type === 'main' ? 'rgba(255, 0, 132, 0.1)' : 'rgba(244, 63, 94, 0.1)', 
                color: ex.cash_type === 'main' ? 'var(--primary)' : '#f43f5e' 
              }}
            >
              <Wallet size={20} />
            </div>
            <div className="expense-details">
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{ex.description}</div>
              <div className="expense-meta">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: 600 }}>
                  {(ex as any).expense_categories?.[0]?.name || ex.category || 'Tanpa Kategori'}
                </span>
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: ex.cash_type === 'main' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: ex.cash_type === 'main' ? '#2563eb' : '#d97706', border: `1px solid ${ex.cash_type === 'main' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, fontWeight: 800, letterSpacing: '0.5px' }}>
                  {ex.cash_type === 'main' ? 'KAS UTAMA' : 'KAS KECIL'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {new Date(ex.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="expense-actions-wrapper">
            <div className="expense-amount" style={{ fontWeight: 800, color: '#e11d48', fontSize: '1.15rem' }}>- Rp {ex.amount.toLocaleString()}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => onEdit(ex)}
                title="Edit Biaya"
                style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.25)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(ex.id)}
                title="Hapus Biaya"
                style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: '#e11d48', border: '1px solid rgba(244, 63, 94, 0.25)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
