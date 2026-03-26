export const roundUpTo500 = (amount: number): number => {
  const remainder = amount % 500;
  if (remainder <= 300) {
    return amount - remainder; // Round down if 300 or less
  } else {
    return amount + (500 - remainder); // Round up if more than 300
  }
};
