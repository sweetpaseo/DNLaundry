import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import type { Expense, ExpenseCategory } from '../../types';
import { api } from '../../services/api';

interface ExpenseFormProps {
  onSave: (expense: Partial<Expense>) => void;
  initialData?: Expense | null;
  forcedCashType?: 'petty' | 'main';
}

export const ExpenseForm = ({ onSave, initialData, forcedCashType }: ExpenseFormProps) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    amount: 0,
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cash_type: 'petty'
  });

  const loadCategories = async () => {
    setIsRefreshing(true);
    try {
      const fetched = await api.getExpenseCategories();
      
      // Filter based on forcedCashType if provided
      const filtered = forcedCashType 
        ? fetched.filter((c: ExpenseCategory) => c.cash_type === forcedCashType)
        : fetched;
        
      setCategories(filtered);
      
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData(prev => ({
          ...prev,
          category_id: prev.category_id || filtered[0]?.id || '',
          cash_type: forcedCashType || prev.cash_type || 'petty'
        }));
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [initialData, forcedCashType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData });
    
    // Reset form if it's a new entry (not editing)
    if (!initialData) {
      setFormData({
        ...formData,
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Jumlah Pengeluaran (Rp)</label>
        <input 
          type="number" 
          required
          min="0"
          value={formData.amount || ''}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          style={{ width: '100%', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}
        />
      </div>

      <div className="form-group">
        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Kategori</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            style={{ width: '100%' }}
            required
          >
            <option value="" disabled>Pilih Kategori</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button 
            type="button" 
            onClick={loadCategories} 
            className="btn-secondary"
            style={{ padding: '0.5rem', width: '3rem', flexShrink: 0 }}
            title="Refresh Kategori"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {!forcedCashType && (
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Sumber Kas</label>
          <select 
            value={formData.cash_type}
            onChange={(e) => setFormData({ ...formData, cash_type: e.target.value as 'petty' | 'main' })}
            style={{ width: '100%' }}
            required
          >
            <option value="petty">Kas Kecil (Staff)</option>
            <option value="main">Kas Utama (Owner)</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Keterangan</label>
        <textarea 
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Misal: Beli sabun cair 5L"
          style={{ width: '100%', minHeight: '80px', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
        />
      </div>

      <div className="form-group">
        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Tanggal</label>
        <input 
          type="date" 
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          style={{ width: '100%' }}
        />
      </div>

      <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <Save size={18} /> {initialData ? 'Update' : 'Simpan'} Pengeluaran
      </button>
    </form>
  );
};
