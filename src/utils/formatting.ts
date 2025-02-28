// Currency formatting utility
export const formatCurrency = (amount: number, locale: string = 'en-US', currency: string = 'USD') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Date formatting utility
export const formatDate = (date: Date | string, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(new Date(date));
};
