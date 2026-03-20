export interface Service {
  id: string;
  name: string;
  price: number;
  unit: string;
  is_active: boolean;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
}

export type TransactionStatus = 'Baru' | 'Proses' | 'Siap Ambil';

export interface CustomerType {
  id: string;
  name: string;
  discount_percent: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  type_id: string;
  type?: CustomerType;
  tags?: string[];
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  base_salary: number;
  is_active: boolean;
  join_date: string;
  created_at: string;
}

export interface Incentive {
  id: string;
  employee_id: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  customer_name: string;
  service_id: string;
  service_name: string;
  employee_id?: string; // Linked employee
  weight: number;
  unit?: string;
  total_price: number;
  status: TransactionStatus;
  is_paid: boolean;
  notes: string;
  discount_percent: number;
  discount_amount: number;
  final_price: number;
  created_at: string;
}
