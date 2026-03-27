export const roundUpTo500 = (amount: number): number => {
  const base = Math.floor(amount / 1000) * 1000;
  const remainder = amount % 1000;
  
  if (remainder <= 200) {
    return base;
  } else if (remainder <= 600) {
    return base + 500;
  } else {
    return base + 1000;
  }
};
