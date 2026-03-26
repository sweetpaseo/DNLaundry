import { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Calendar } from 'lucide-react';
import type { Service, Employee, Customer, MemberType } from '../../types';
import { AddCustomerModal } from '../CRM/AddCustomerModal';
import { api } from '../../services/api';
import { getDisplayId, formatDisplayId } from '../../utils/customer';
import { roundUpTo500 } from '../../utils/format';

interface OrderItem {
  id: string; // Temporary local ID for list management
  service_id: string;
  service_name: string;
  tier: string;
  amount: number;
  price: number;
  subtotal: number;
  due_date: string;
}

interface OrderInputProps {
  currentUser?: any;
}

export const OrderInput = ({ currentUser }: OrderInputProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedTier, setSelectedTier] = useState<'normal' | 'member' | 'express' | 'reseller'>('normal');
  const [amount, setAmount] = useState<number | string>(0);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number | string>(0);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [orderDate, setOrderDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [roundingEnabled, setRoundingEnabled] = useState(true);

  const fetchData = async () => {
    try {
      const [s, e, c, m] = await Promise.all([
        api.getServices(), 
        api.getEmployees(),
        api.getCustomers(),
        api.getMemberTypes()
      ]);
      const activeServices = s
        .filter((srv: Service) => srv.is_active)
        .sort((a: Service, b: Service) => (a.price_normal || 0) - (b.price_normal || 0));
      const activeEmployees = e.filter((emp: Employee) => emp.is_active);
      setServices(activeServices);
      setEmployees(activeEmployees);
      setCustomers(c || []);
      setMemberTypes(m || []);
      if (activeServices.length > 0) setSelectedServiceId(activeServices[0].id);
      if (activeEmployees.length > 0) setSelectedEmployeeId(activeEmployees[0].id);
      
      const settings = await api.getSettings();
      if (settings) setRoundingEnabled(settings.rounding_enabled !== false);
    } catch (error) {
      console.error('Failed to fetch order input data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const srv = services.find(s => s.id === selectedServiceId);
    if (srv) {
      // SLA Calculation
      const days = srv.processing_days || 0;
      const date = new Date();
      date.setDate(date.getDate() + days);
      setDueDate(date.toISOString());
    }
  }, [selectedServiceId, selectedTier, amount, services]);

  const handleCustomerChange = (val: string) => {
    setCustomerName(val);
    if (val.length > 0) {
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(val.toLowerCase()) || 
        c.phone.includes(val)
      ).slice(0, 5);
      setFilteredCustomers(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }

    const lowVal = val.toLowerCase();
    const foundCustomer = customers.find(c => c.name.toLowerCase() === lowVal || c.phone === val);
    if (foundCustomer) {
      setSelectedCustomerId(foundCustomer.id);
      if (foundCustomer.type_id) {
      const mType = memberTypes.find(m => m.id === foundCustomer.type_id);
      const typeName = mType?.name.toLowerCase() || '';
      if (typeName.includes('reseller')) {
        setSelectedTier('reseller');
      } else if (typeName.includes('member')) {
        setSelectedTier('member');
      } else {
        setSelectedTier('normal');
      }
      }
    } else {
      setSelectedCustomerId(null);
      if (lowVal.includes('reseller')) {
        setSelectedTier('reseller');
      } else if (lowVal.includes('member')) {
        setSelectedTier('member');
      } else {
        setSelectedTier('normal');
      }
    }
  };

  const selectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setSelectedCustomerId(customer.id);
    setShowSuggestions(false);
    
    if (customer.type_id) {
      const mType = memberTypes.find(m => m.id === customer.type_id);
      const typeName = mType?.name.toLowerCase() || '';
      if (typeName.includes('reseller')) {
        setSelectedTier('reseller');
      } else if (typeName.includes('member')) {
        setSelectedTier('member');
      } else {
        setSelectedTier('normal');
      }
    }
  };

  const addItem = () => {
    const srv = services.find(s => s.id === selectedServiceId);
    if (!srv || Number(amount) <= 0) {
      alert('Mohon pilih layanan dan masukkan jumlah');
      return;
    }

    let price = srv.price_normal || 0;
    if (selectedTier === 'member') price = srv.price_member || 0;
    else if (selectedTier === 'express') price = srv.price_express || 0;
    else if (selectedTier === 'reseller') price = srv.price_special || 0;

    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      service_id: selectedServiceId,
      service_name: srv.name,
      tier: selectedTier,
      amount: Number(amount),
      price,
      subtotal: price * Number(amount),
      due_date: dueDate
    };

    setOrderItems([...orderItems, newItem]);
    setAmount(0);
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const grandTotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
  const maxDueDate = orderItems.length > 0 
    ? new Date(Math.max(...orderItems.map(i => new Date(i.due_date).getTime()))).toISOString()
    : dueDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === selectedEmployeeId);
    
    if (!customerName || orderItems.length === 0 || !emp) {
      alert('Mohon lengkapi data order (Customer, Layanan, Petugas)');
      return;
    }

    try {
      const groupId = `ORD-${Date.now()}`;
      
      const promises = orderItems.map(item => {
        let itemDiscountAmount = 0;
        let itemDiscountPercent = 0;

        if (discountType === 'percentage') {
          itemDiscountPercent = Number(discountValue);
          itemDiscountAmount = (item.subtotal * Number(discountValue)) / 100;
        } else if (discountType === 'fixed') {
          // Pro-rate fixed discount based on subtotal proportion
          const proportion = item.subtotal / grandTotal;
          itemDiscountAmount = Number(discountValue) * proportion;
          itemDiscountPercent = (itemDiscountAmount / item.subtotal) * 100;
        }

        const orderData = {
          customer_name: customerName,
          customer_id: selectedCustomerId,
          service_id: item.service_id,
          service_name: item.service_name,
          employee_id: selectedEmployeeId,
          weight: item.amount,
          total_price: item.subtotal,
          discount_amount: itemDiscountAmount,
          discount_percent: itemDiscountPercent,
          final_price: roundingEnabled ? roundUpTo500(item.subtotal - itemDiscountAmount) : (item.subtotal - itemDiscountAmount),
          status: 'Baru',
          is_paid: false,
          due_date: item.due_date,
          group_id: groupId,
          notes: notes,
          created_at: new Date(orderDate).toISOString()
        };
        return api.createTransaction(orderData);
      });

      await Promise.all(promises);
      alert('Semua pesanan berhasil disimpan!');
      
      // Reset form
      setCustomerName('');
      setSelectedCustomerId(null);
      setOrderItems([]);
      setNotes('');
      setDiscountValue(0);
    } catch (error: any) {
      alert('Gagal membuat order: ' + (error.message || 'Error tidak diketahui'));
    }
  };

  return (
    <div className="order-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Step 1: Customer */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 0, 132, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>1</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Data Pelanggan</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tgl Masuk Order</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem', height: '3.5rem', fontSize: '1rem' }} 
                />
                <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cari Nama / WhatsApp</label>
              <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Cari nama atau telepon..." 
                value={customerName}
                onChange={(e) => handleCustomerChange(e.target.value)}
                onFocus={() => customerName.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{ width: '100%', paddingLeft: '2.5rem', height: '3.5rem', fontSize: '1rem' }} 
              />
              <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredCustomers.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                background: '#1a1a1a',
                border: '1px solid var(--glass-border)',
                borderRadius: '0 0 12px 12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                marginTop: '-4px',
                overflow: 'hidden'
              }}>
                {filteredCustomers.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => selectCustomer(c)}
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.4, background: 'rgba(255,255,255,0.1)', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>
                        {formatDisplayId(getDisplayId(c))}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone} {c.member_type ? `- ${c.member_type.name}` : ''}</div>
                  </div>
                ))}
            </div>
          )}
          </div>
        </div>

        <button 
          type="button" 
          onClick={() => setIsModalOpen(true)}
          style={{ marginTop: '0.75rem', background: 'transparent', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}
        >
          <UserPlus size={18} /> + Pelanggan Baru
        </button>
      </div>

        {/* Step 2: Service & Amount & Employee */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 0, 132, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>2</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pilih Layanan & Petugas</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Jenis Layanan</label>
              <select 
                value={selectedServiceId} 
                onChange={(e) => setSelectedServiceId(e.target.value)}
                style={{ width: '100%', height: '3.5rem', fontSize: '1rem' }}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#1a1a1a', color: 'white' }}>{s.name} - Rp {s.price_normal?.toLocaleString()}/{s.unit}</option>
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
            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tier Harga Layanan</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 75px), 1fr))', gap: '0.5rem' }}>
              {(['normal', 'member', 'express', 'reseller'] as const).map(tier => {
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      background: selectedTier === tier ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                      color: selectedTier === tier ? 'white' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                      boxShadow: selectedTier === tier ? '0 4px 12px rgba(255, 0, 132, 0.2)' : 'none',
                    }}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Jumlah ({services.find(s => s.id === selectedServiceId)?.unit})
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input 
                type="number" 
                step="0.1"
                value={amount} 
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={() => { if (amount === 0 || amount === '0') setAmount(''); }}
                onBlur={() => { if (amount === '') setAmount(0); }}
                style={{ flex: '1 1 120px', height: '3.5rem', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }} 
                placeholder="0.0"
              />
              <button 
                type="button"
                onClick={addItem}
                className="btn-primary"
                style={{ 
                  flex: '2 1 180px', 
                  height: '3.5rem',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  background: 'var(--primary)',
                  boxShadow: '0 4px 12px rgba(255, 0, 132, 0.3)'
                }}
              >
                <Plus size={20} /> Tambahkan Item
              </button>
            </div>
            
            {/* Price Simulation Display */}
            {Number(amount) > 0 && selectedServiceId && (
              <div 
                className="animate-fade-in"
                style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.75rem 1rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px', 
                  border: '1px dashed var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  SIMULASI: {amount} {services.find(s => s.id === selectedServiceId)?.unit} x 
                  Rp {(() => {
                    const srv = services.find(s => s.id === selectedServiceId);
                    if (!srv) return 0;
                    if (selectedTier === 'member') return srv.price_member || 0;
                    if (selectedTier === 'express') return srv.price_express || 0;
                    if (selectedTier === 'reseller') return srv.price_special || 0;
                    return srv.price_normal || 0;
                  })().toLocaleString()}
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                  Rp {(() => {
                    const srv = services.find(s => s.id === selectedServiceId);
                    if (!srv) return 0;
                    let price = srv.price_normal || 0;
                    if (selectedTier === 'member') price = srv.price_member || 0;
                    else if (selectedTier === 'express') price = srv.price_express || 0;
                    else if (selectedTier === 'reseller') price = srv.price_special || 0;
                    return (price * Number(amount)).toLocaleString();
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* List of Added Items */}
          {orderItems.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--glass-border)' }}>
              <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Daftar Layanan Pesanan:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orderItems.map(item => (
                  <div key={item.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.service_name} <span style={{ color: 'var(--primary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>({item.tier})</span></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.amount} {services.find(s => s.id === item.service_id)?.unit} x Rp {item.price.toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'white' }}>Rp {item.subtotal.toLocaleString()}</div>
                      <button 
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', cursor: 'pointer' }}
                      >
                        <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Notes & Discount */}
        <div className="glass-card" style={{ padding: 'min(1.5rem, 4vw)', borderLeft: '4px solid var(--primary)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 0, 132, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>3</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Catatan & Diskon</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Diskon Khusus (Per Kasus)</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select 
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                  style={{ width: 'min(80px, 30%)', height: '3rem' }}
                >
                  <option value="fixed">Rp</option>
                  <option value="percentage">%</option>
                </select>
                <input 
                  type="number" 
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                  onFocus={() => { if (discountValue === 0 || discountValue === '0') setDiscountValue(''); }}
                  onBlur={() => { if (discountValue === '') setDiscountValue(0); }}
                  placeholder="0"
                  style={{ flex: 1, height: '3rem', fontSize: '1.1rem', fontWeight: 600, minWidth: '0' }}
                />
              </div>
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

        {/* Summary Bar */}
        <div style={{ 
          marginTop: '1rem', 
          padding: 'min(1.5rem, 4vw)', 
          background: 'var(--bg-gradient)', 
          borderRadius: 'var(--radius)', 
          border: '2px solid var(--primary)', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(255, 0, 132, 0.2)',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total ({orderItems.length} Layanan):</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Rp {grandTotal.toLocaleString('id-ID')}</p>
            </div>
            
            {Number(discountValue) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>Diskon ({discountType === 'percentage' ? `${discountValue}%` : 'Rp'}):</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent)' }}>
                  - Rp {(discountType === 'percentage' ? (grandTotal * Number(discountValue) / 100) : Number(discountValue)).toLocaleString('id-ID')}
                </p>
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Pembayaran Akhir:</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>Rp</span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 10vw, 2.5rem)', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1, wordBreak: 'break-all' }}>
                {(roundingEnabled 
                  ? roundUpTo500(Math.max(0, grandTotal - (discountType === 'percentage' ? (grandTotal * Number(discountValue) / 100) : Number(discountValue))))
                  : Math.max(0, grandTotal - (discountType === 'percentage' ? (grandTotal * Number(discountValue) / 100) : Number(discountValue)))
                ).toLocaleString('id-ID')}
              </h2>
            </div>
            {roundingEnabled && (
              <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: 700, textTransform: 'uppercase' }}>
                ✨ Termasuk Pembulatan Ke Atas (500)
              </p>
            )}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Estimasi Selesai: <span style={{ color: 'white', fontWeight: 600 }}>{orderItems.length > 0 ? new Date(maxDueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
            </p>
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
            boxShadow: '0 4px 15px rgba(255, 0, 132, 0.4)',
            opacity: orderItems.length > 0 ? 1 : 0.5,
            cursor: orderItems.length > 0 ? 'pointer' : 'not-allowed'
          }} disabled={orderItems.length === 0}>
            <Plus size={24} /> BUAT ORDER SEKARANG
          </button>
        </div>
      </form>

      <AddCustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={async (customer) => {
          try {
            const newCustomer = await api.createCustomer(customer);
            fetchData(); // Refresh customers list
            setCustomerName(newCustomer.name);
            setSelectedCustomerId(newCustomer.id);
            if (newCustomer.type_id) setSelectedTier('member');
            alert('Pelanggan berhasil ditambahkan!');
          } catch (error) {
            alert('Gagal menambah pelanggan');
          }
        }}
        initialData={null}
        memberTypes={memberTypes}
        allCustomers={customers}
        currentUser={currentUser}
      />
    </div>
  );
};
