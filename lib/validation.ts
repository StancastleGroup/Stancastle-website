/** Shared validation helpers for forms */

export function validateEmail(email: string): string {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
  return '';
}

export function validatePhone(phone: string): string {
  if (!phone.trim()) return 'Phone number is required';
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+44|0|44)?[1-9]\d{8,9}$/;
  if (!phoneRegex.test(cleaned)) return 'Please enter a valid UK phone number';
  return '';
}

export function validateUrl(url: string, required = true): string {
  const trimmed = url.trim();
  if (!trimmed) return required ? 'Company website is required' : '';
  try {
    const toParse = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const urlObj = new URL(toParse);
    if (urlObj.protocol && !['http:', 'https:'].includes(urlObj.protocol)) {
      return 'Website must use http:// or https://, or enter a domain (e.g. example.com)';
    }
    if (!urlObj.hostname || urlObj.hostname.length < 2) {
      return 'Please enter a valid website or domain (e.g. example.com)';
    }
    return '';
  } catch {
    return 'Please enter a valid website or domain (e.g. example.com)';
  }
}
