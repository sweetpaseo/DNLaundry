export const formatWhatsAppNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // If starts with 0, replace with 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // If starts with 8 (common shortcut), add 62
  if (cleaned.startsWith('8') && cleaned.length >= 9) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
};

export const getWhatsAppUrl = (phone: string, message?: string): string => {
  const formattedPhone = formatWhatsAppNumber(phone);
  const baseUrl = `https://wa.me/${formattedPhone}`;
  
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  
  return baseUrl;
};
