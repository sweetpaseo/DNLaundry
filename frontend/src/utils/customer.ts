import type { Customer } from '../types';

export const getDisplayId = (customer: Customer): string => {
  if (customer.customer_id) return customer.customer_id;
  
  const idTag = customer.tags?.find(t => t.startsWith('ID_DN'));
  if (idTag) {
    return idTag.replace('ID_DN', 'DN');
  }
  // Fallback for existing customers without tags
  return `DN-${customer.id.slice(0, 5).toUpperCase()}`;
};

export const generateNextId = (customers: Customer[]): string => {
  let maxNumber = 0;
  
  customers.forEach(c => {
    // Check dedicated column first
    if (c.customer_id && c.customer_id.startsWith('DN')) {
      const num = parseInt(c.customer_id.replace('DN', ''), 10);
      if (!isNaN(num) && num > maxNumber) maxNumber = num;
      return;
    }

    // Fallback to tags
    const idTag = c.tags?.find(t => t.startsWith('ID_DN'));
    if (idTag) {
      const num = parseInt(idTag.replace('ID_DN', ''), 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  const nextNumber = maxNumber + 1;
  return `DN${nextNumber.toString().padStart(5, '0')}`;
};

export const formatDisplayId = (id: string): string => {
  return id.replace('ID_DN', '#DN');
};
