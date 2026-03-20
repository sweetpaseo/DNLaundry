import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus } from 'lucide-react';
import type { Service, Employee } from '../../types';
import { AddCustomerModal } from '../CRM/AddCustomerModal';
import { api } from '../../services/api';

export const OrderInput = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, e] = await Promise.all([api.getServices(), api.getEmployees()]);
        const activeServices = s.filter((srv: Service) => srv.is_active);
        const activeEmployees = e.filter((emp: Employee) => emp.is_active);
        setServices(activeServices);
        setEmployees(activeEmployees);
        if (activeServices.length > 0) setSelectedServiceId(activeServices[0].id);
        if (activeEmployees.length > 0) setSelectedEmployeeId(activeEmployees[0].id);
      } catch (error) {
        console.error('Failed to fetch order input data:', error);
      }
    };
    fetchData();
  }, []);
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const srv = services.find(s => s.id === selectedServiceId);
    if (srv) {
      const subtotal = srv.price * amount;
      let discountAmount = 0;
      if (discountType === 'percent') {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
      setTotal(Math.max(0, subtotal - discountAmount));
    }
  }, [selectedServiceId, amount, discountType, discountValue, services]);

  const handleCustomerChange = (val: string) => {
    setCustomerName(val);
    const lowVal = val.toLowerCase();
    setDiscountType('percent'); // Default to percent for auto-discounts
    if (lowVal.includes('vip') || lowVal.includes('special')) setDiscountValue(10);
    else if (lowVal.includes('member')) setDiscountValue(5);
    else setDiscountValue(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const srv = services.find(s => s.id === selectedServiceId);
    const emp = employees.find(e => e.id === selectedEmployeeId);
    
    if (!customerName || !srv || !emp) {
      alert('Mohon lengkapi data order');
      return;
    }

    try {
      const orderData = {
        customer_name: customerName,
        service_id: selectedServiceId,
        service_name: srv.name,
        employee_id: selectedEmployeeId,
        weight: amount,
        total_price: total, // Simplified total
        final_price: total,
        status: 'Baru',
        is_paid: false,
        created_at: new Date().toISOString()
      };
      await api.createTransaction(orderData);
      alert(`Order Berhasil Dibuat!\nPelanggan: ${customerName}\nPetugas: ${emp.name}\nLayanan: ${srv.name}\nTotal: Rp ${total.toLocaleString()}`);
      
      // Reset form
      setCustomerName('');
      setAmount(0);
      setNotes('');
      setDiscountValue(0);
    } catch (error) {
      alert('Gagal membuat order');
    }
  };

  return (
    <div className="order-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Step 1: Customer */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 0, 132, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>1</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Data Pelanggan</h3>
          </div>
          
          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Cari nama atau telepon..." 
                value={customerName}
                onChange={(e) => handleCustomerChange(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', height: '3.5rem', fontSize: '1rem' }} 
              />
              <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(true)}
              style={{ marginTop: '0.75rem', background: 'transparent', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}
            >
              <UserPlus size={18} /> + Pelanggan Baru
            </button>
          </div>
        </div>

        {/* Step 2: Service & Amount & Employee */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 0, 132, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>2</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pilih Layanan & Petugas</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Jenis Layanan</label>
              <select 
                value={selectedServiceId} 
                onChange={(e) => setSelectedServiceId(e.target.value)}
                style={{ width: '100%', height: '3.5rem', fontSize: '1rem' }}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#1a1a1a', color: 'white' }}>{s.name} - Rp {s.price}/{s.unit}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Petugas Pengerjaan</label>
              <select 
                value={selectedEmployeeId} 
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                style={{ width: '100%', height: '3.5rem', fontSize: '1rem' }}
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id} style={{ background: '#1a1a1a', color: 'white' }}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Jumlah ({services.find(s => s.id === selectedServiceId)?.unit})
            </label>
            <input 
              type="number" 
              step="0.1"
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: '100%', height: '3.5rem', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }} 
              placeholder="0.0"
              required
            />
          </div>
        </div>

        {/* Step 3: Discount & Notes */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 0, 132, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>3</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Aksen Tambahan</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Diskon
                <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <button 
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', background: discountType === 'percent' ? 'var(--primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
                  >%</button>
                  <button 
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', background: discountType === 'fixed' ? 'var(--primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
                  >Rp</button>
                </div>
              </label>
              <input 
                type="number"
                value={discountValue || ''} 
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder={discountType === 'percent' ? '0%' : 'Rp 0'}
                style={{ width: '100%', height: '3.5rem', fontSize: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Catatan Khusus</label>
              <textarea 
                placeholder="Contoh: Baju putih pisah, jangan pakai parfum..."
                style={{ width: '100%', padding: '1rem', minHeight: '80px' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Summary Bar (Desktop) / Final Card (Mobile) */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1.5rem', 
          background: 'var(--bg-gradient)', 
          borderRadius: 'var(--radius)', 
          border: '2px solid var(--primary)', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(255, 0, 132, 0.2)'
        }}>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Pembayaran:</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>Rp</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1 }}>
                {total.toLocaleString('id-ID')}
              </h2>
            </div>
            {discountValue > 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.5rem' }}>
                Hemat {discountType === 'percent' ? `${discountValue}%` : `Rp ${discountValue.toLocaleString()}`}
              </p>
            )}
          </div>
          
          <button type="submit" className="btn-primary" style={{ 
            width: '100%', 
            padding: '1.25rem', 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.75rem',
            boxShadow: '0 4px 15px rgba(255, 0, 132, 0.4)'
          }}>
            <Plus size={24} /> BUAT ORDER SEKARANG
          </button>
        </div>
      </form>

      <AddCustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={(customer) => {
          setCustomerName(customer.name);
          setDiscountType('percent');
          if (customer.name.toLowerCase().includes('vip')) setDiscountValue(10);
          else setDiscountValue(0);
        }}
        initialData={null}
      />
    </div>
  );
};
