const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY || '';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-KEY': API_SECRET_KEY
});

export const api = {
  // Transactions
  async getTransactions() {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return []; // Return empty instead of misleading mock data in production
    }
  },
  async createTransaction(data: any) {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },

  // Customers
  async getCustomers() {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  async createCustomer(data: any) {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async updateCustomer(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async deleteCustomer(id: string) {
    const res = await fetch(`${API_BASE_URL}/customers/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal hapus data');
    return res.json();
  },

  // Services
  async getServices() {
    try {
      const res = await fetch(`${API_BASE_URL}/services`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  async createService(data: any) {
    const res = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },

  // Membership
  async getMembershipLevels() {
    try {
      const res = await fetch(`${API_BASE_URL}/membership`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  // Employees
  async getEmployees() {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  async createEmployee(data: any) {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async updateEmployee(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async deleteEmployee(id: string) {
    const res = await fetch(`${API_BASE_URL}/employees/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal hapus data');
    return res.json();
  },

  // Incentives
  async getIncentives() {
    try {
      const res = await fetch(`${API_BASE_URL}/incentives`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  async createIncentive(data: any) {
    const res = await fetch(`${API_BASE_URL}/incentives`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async deleteIncentive(id: string) {
    const res = await fetch(`${API_BASE_URL}/incentives/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal hapus data');
    return res.json();
  },

  // Expenses
  async getExpenses() {
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  async createExpense(data: any) {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async updateExpense(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async deleteExpense(id: string) {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal hapus data');
    return res.json();
  },

  // Auth
  async login(credentials: any) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Username atau password salah');
    return res.json();
  },
  async changePassword(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal ganti password');
    return res.json();
  },

  // Users
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  async createUser(data: any) {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async updateUser(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    return res.json();
  },
  async deleteUser(id: string) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal hapus data');
    return res.json();
  },

  // Settings
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, { headers: getHeaders() });
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
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal simpan data');
    const result = await res.json();
    localStorage.setItem('laundry_settings', JSON.stringify(result));
    return result;
  },

  async checkConnection() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { headers: getHeaders() });
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok';
    } catch (e) {
      return false;
    }
  }
};
