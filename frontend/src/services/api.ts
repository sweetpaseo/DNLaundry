const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

export const api = {
  // Transactions
  async getTransactions() {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [
        { id: '1', customer_name: 'Budi (Mock)', service_name: 'Cuci Kering', status: 'Selesai', total_price: 25000, date: new Date().toISOString() },
        { id: '2', customer_name: 'Ani (Mock)', service_name: 'Setrika', status: 'Proses', total_price: 15000, date: new Date().toISOString() }
      ];
    }
  },
  async createTransaction(data: any) {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Customers
  async getCustomers() {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [
        { id: '1', name: 'Budi (Mock)', phone: '0812345678', type: 'Platinum' },
        { id: '2', name: 'Ani (Mock)', phone: '0898765432', type: 'Regular' }
      ];
    }
  },
  async createCustomer(data: any) {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateCustomer(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteCustomer(id: string) {
    const res = await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Services
  async getServices() {
    try {
      const res = await fetch(`${API_BASE_URL}/services`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [
        { id: '1', name: 'Cuci Kering', price: 6000, unit: 'kg', is_active: true },
        { id: '2', name: 'Setrika', price: 4000, unit: 'kg', is_active: true },
        { id: '3', name: 'Express', price: 10000, unit: 'kg', is_active: true }
      ];
    }
  },
  async createService(data: any) {
    const res = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Membership
  async getMembershipLevels() {
    try {
      const res = await fetch(`${API_BASE_URL}/membership`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [
        { id: '1', name: 'Regular', discount_percent: 0 },
        { id: '2', name: 'Silver', discount_percent: 5 },
        { id: '3', name: 'Gold', discount_percent: 10 },
        { id: '4', name: 'Platinum', discount_percent: 15 }
      ];
    }
  },

  // Employees
  async getEmployees() {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [
        { id: '1', name: 'Staff A (Mock)', phone: '081', base_salary: 1500000, join_date: '2024-01-01' },
        { id: '2', name: 'Staff B (Mock)', phone: '082', base_salary: 1500000, join_date: '2024-02-01' }
      ];
    }
  },
  async createEmployee(data: any) {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateEmployee(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteEmployee(id: string) {
    const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Incentives
  async getIncentives() {
    try {
      const res = await fetch(`${API_BASE_URL}/incentives`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  async createIncentive(data: any) {
    const res = await fetch(`${API_BASE_URL}/incentives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteIncentive(id: string) {
    const res = await fetch(`${API_BASE_URL}/incentives/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Expenses
  async getExpenses() {
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [
        { id: '1', description: 'Sabun Cuci (Mock)', amount: 50000, category: 'Operasional', date: new Date().toISOString() }
      ];
    }
  },
  async createExpense(data: any) {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateExpense(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteExpense(id: string) {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Auth
  async login(credentials: any) {
    // HARDCODED FALLBACK FOR DEV
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      return { id: 'dev-admin', username: 'admin', name: 'Original Owner', role: 'owner' };
    }
    if (credentials.username === 'staff' && credentials.password === 'staff123') {
      return { id: 'dev-staff', username: 'staff', name: 'Staff Laundry', role: 'staff' };
    }

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },
  async changePassword(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e) {
      return { success: true }; // Mock success
    }
  },

  // Users
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [
        { id: 'dev-admin', username: 'admin', name: 'Original Owner', role: 'owner' },
        { id: 'dev-staff', username: 'staff', name: 'Staff Laundry', role: 'staff' }
      ];
    }
  },
  async createUser(data: any) {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateUser(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteUser(id: string) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Settings
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      const saved = localStorage.getItem('laundry_settings');
      if (saved) return JSON.parse(saved);
      return {
        name: 'Antigravity Laundry',
        phone: '081234567890',
        address: 'Jl. Antigravity No. 123, Jakarta',
        footer_text: 'Terima kasih telah mencuci di Antigravity Laundry!',
        instagram: '@antigravity.laundry'
      };
    }
  },
  async updateSettings(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      localStorage.setItem('laundry_settings', JSON.stringify(result));
      return result;
    } catch (e) {
      localStorage.setItem('laundry_settings', JSON.stringify(data));
      return data;
    }
  }
};
