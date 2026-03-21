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
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{ex.description}</div>
              <div className="expense-meta">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                  {(ex as any).expense_category?.name || ex.category || 'Tanpa Kategori'}
                </span>
                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: ex.cash_type === 'main' ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>
                  {ex.cash_type === 'main' ? 'KAS UTAMA' : 'KAS KECIL'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(ex.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="expense-actions-wrapper">
            <div className="expense-amount">- Rp {ex.amount.toLocaleString()}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => onEdit(ex)}
                style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(ex.id)}
                style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
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
