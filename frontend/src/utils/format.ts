export const roundUpTo500 = (amount: number): number => {
  return Math.ceil(amount / 500) * 500;
};
