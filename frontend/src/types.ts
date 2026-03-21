export interface Service {
  id: string;
  name: string;
  price_normal: number;
  price_member: number;
  price_express: number;
  price_special: number;
  unit: string;
  price?: number;
  is_active: boolean;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
  processing_days?: number;
}

export type TransactionStatus = 'Baru' | 'Proses' | 'Siap Ambil';

export interface MemberType {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  member_type_id: string;
  member_type?: MemberType;
  tags?: string[];
  wallet_balance?: number;
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

export type PaymentMethod = 'Cash' | 'Transfer Bank' | 'QRIS' | 'Wallet';

export interface Transaction {
  id: string;
  customer_id: string;
  customer_name: string;
  customer?: { phone: string };
  service_id: string;
  service_name: string;
  employee_id?: string;
  weight: number;
  unit?: string;
  total_price: number;
  status: TransactionStatus;
  is_paid: boolean;
  payment_method?: PaymentMethod;
  notes: string;
  discount_percent: number;
  discount_amount: number;
  final_price: number;
  due_date?: string;
  group_id?: string;
  created_at: string;
}
