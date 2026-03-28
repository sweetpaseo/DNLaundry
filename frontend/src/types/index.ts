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
  category?: 'service' | 'product';
}

export type TransactionStatus = 'Baru' | 'Proses' | 'Siap Ambil' | 'Siap Kirim' | 'Selesai';

export interface MemberType {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  type_id: string;
  member_type?: MemberType;
  tags?: string[];
  customer_id?: string;
  wallet_balance?: number;
  default_delivery_type?: 'Pickup' | 'Delivery';
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

export interface ExpenseCategory {
  id: string;
  name: string;
  cash_type: 'petty' | 'main';
  created_at?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  category_id?: string;
  expense_category?: ExpenseCategory;
  cash_type: 'petty' | 'main';
  date: string;
  created_at: string;
}

export type PaymentMethod = 'Cash' | 'Transfer Bank' | 'QRIS' | 'Saldo';

export interface Transaction {
  id: string;
  receipt_no?: string;
  customer_id: string;
  customer_no?: string;
  customer_name: string;
  customer?: { phone: string; customer_id?: string };
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
  amount_received?: number;
  discount_percent: number;
  discount_amount: number;
  final_price: number;
  due_date?: string;
  group_id?: string;
  created_at: string;
  paid_at?: string;
}

export interface Stock {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface StockLog {
  id: string;
  stock_id: string;
  type: 'in' | 'out' | 'adjustment';
  amount: number;
  note?: string;
  created_at: string;
  user_id?: string;
  stock?: { name: string; unit: string };
}
