import { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, MapPin, MessageSquare, Edit, Trash2, Loader2 } from 'lucide-react';
import type { Customer } from '../../types';
import { AddCustomerModal } from './AddCustomerModal';
import { api } from '../../services/api';

export const CustomerCRM = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pelanggan ini?')) return;
    try {
      await api.deleteCustomer(id);
      fetchCustomers();
    } catch (error) {
      alert('Gagal menghapus pelanggan');
    }
  };

  const handleSave = async (customerData: any) => {
    try {
      if (customerData.id) {
        await api.updateCustomer(customerData.id, customerData);
      } else {
        await api.createCustomer(customerData);
      }
      fetchCustomers();
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      alert('Gagal menyimpan data');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="crm-container">
      <div className="crm-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daftar Pelanggan</h2>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Cari pelanggan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }} 
            />
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button 
            onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <UserPlus size={20} /> Tambah
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>
      ) : (
        <div className="responsive-grid">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="glass-card animate-fade-in" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{customer.name}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', 
                      background: customer.name.includes('VIP') ? 'rgba(255, 0, 132, 0.2)' : 'rgba(211, 211, 211, 0.1)',
                      color: customer.name.includes('VIP') ? '#FF0084' : '#D3D3D3',
                      border: `1px solid ${customer.name.includes('VIP') ? '#FF0084' : '#D3D3D3'}`
                    }}>
                      {customer.name.includes('VIP') ? 'VIP' : 'Member'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }} 
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id)} 
                    style={{ 
                      background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '0.4rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <Phone size={14} /> {customer.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <MapPin size={14} style={{ marginTop: '0.25rem' }} /> {customer.address}
                </div>
              </div>

              <a 
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`} 
                target="_blank" rel="noreferrer"
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                  width: '100%', padding: '0.75rem', borderRadius: '10px', 
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)',
                  color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem'
                }}
              >
                <MessageSquare size={18} color="#25D366" /> Chat WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}

      <AddCustomerModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
        onSave={handleSave}
        initialData={editingCustomer}
      />
    </div>
  );
};
