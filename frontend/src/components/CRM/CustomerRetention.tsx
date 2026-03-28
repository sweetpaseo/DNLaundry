import { useState, useMemo } from 'react';
import { MessageSquare, Trash2, Ghost, Clock, Info } from 'lucide-react';
import { getWhatsAppUrl } from '../../utils/whatsapp';
import type { Customer, Transaction } from '../../types';

interface RetentionProps {
  customers: Customer[];
  transactions: Transaction[];
}

interface RetentionAnalysis {
  customer: Customer;
  lastOrderDate: Date;
  avgInterval: number; // in days
  predictedDate: Date;
  daysOverdue: number;
}

export const CustomerRetention = ({ customers, transactions }: RetentionProps) => {
  const [ignoredIds, setIgnoredIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('laundry_ignored_retention');
    return saved ? JSON.parse(saved) : [];
  });

  const handleIgnore = (id: string) => {
    const newIgnored = [...ignoredIds, id];
    setIgnoredIds(newIgnored);
    localStorage.setItem('laundry_ignored_retention', JSON.stringify(newIgnored));
  };

  const analysis = useMemo(() => {
    if (!customers.length || !transactions.length) return [];

    // Group transactions by customer
    const customerOrders: Record<string, number[]> = {};
    transactions.forEach(t => {
      const date = new Date(t.created_at).getTime();
      if (!customerOrders[t.customer_id]) {
        customerOrders[t.customer_id] = [];
      }
      customerOrders[t.customer_id].push(date);
    });

    const results: RetentionAnalysis[] = [];
    const today = new Date().getTime();

    customers.forEach(customer => {
      if (ignoredIds.includes(customer.id)) return;

      const orders = customerOrders[customer.id]?.sort((a, b) => a - b);
      if (!orders || orders.length < 2) return; // Need at least 2 orders to find interval

      // Calculate average interval
      let totalInterval = 0;
      for (let i = 1; i < orders.length; i++) {
        totalInterval += (orders[i] - orders[i - 1]);
      }
      const avgIntervalMs = totalInterval / (orders.length - 1);
      const avgIntervalDays = Math.round(avgIntervalMs / (1000 * 60 * 60 * 24));

      const lastOrderDate = new Date(orders[orders.length - 1]);
      const predictedDate = new Date(lastOrderDate.getTime() + avgIntervalMs);
      
      // We start alerting if it's 2 days past predicted
      const actualOverdueMs = today - predictedDate.getTime();
      
      if (actualOverdueMs > 0) {
        results.push({
          customer,
          lastOrderDate,
          avgInterval: avgIntervalDays,
          predictedDate,
          daysOverdue: Math.floor(actualOverdueMs / (1000 * 60 * 60 * 24))
        });
      }
    });

    return results.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [customers, transactions, ignoredIds]);

  if (analysis.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Ghost size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Belum ada data retensi</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
          Sistem akan menampilkan pelanggan yang "terlambat" order berdasarkan rata-rata kebiasaan mereka mencuci.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
        <Info size={20} color="#34d399" />
        <p style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 500 }}>
          Daftar ini berisi pelanggan yang biasanya sudah melakukan order, namun saat ini belum kembali. Silakan hubungi untuk follow-up.
        </p>
      </div>

      <div className="responsive-grid">
        {analysis.map(({ customer, lastOrderDate, avgInterval, daysOverdue }: RetentionAnalysis) => (
          <div key={customer.id} className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{customer.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: 700, fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  <Clock size={12} /> Terlambat {daysOverdue} hari
                </div>
              </div>
              <button 
                onClick={() => handleIgnore(customer.id)}
                style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                title="Abaikan Pelanggan"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Terakhir Order</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{lastOrderDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Siklus Rutin</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Setiap {avgInterval} Hari</div>
              </div>
            </div>

            <a 
              href={getWhatsAppUrl(customer.phone, `Halo ${customer.name}, biasanya jemuran sudah menumpuk ya? Kami siap bantu lagi nih. Ada promo khusus hari ini!`)} 
              target="_blank" rel="noreferrer"
              className="btn-primary"
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                width: '100%', padding: '0.75rem', borderRadius: '10px', 
                fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none'
              }}
            >
              <MessageSquare size={18} /> Chat Follow Up
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
