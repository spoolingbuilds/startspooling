/**
 * @fileoverview General utility functions for common operations.
 * This module provides utility functions for class merging, number formatting,
 * clipboard operations, URL generation, and other common tasks.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ============================================================================
// TYPES
// ============================================================================

/**
 * URL generation options
 */
export interface UrlOptions {
  protocol?: 'http' | 'https';
  port?: number;
  path?: string;
  hash?: string;
}

/**
 * Copy to clipboard result
 */
export interface CopyResult {
  success: boolean;
  error?: string;
}

/**
 * Number formatting options
 */
export interface NumberFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// ============================================================================
// CLASS UTILITIES
// ============================================================================

/**
 * Merges Tailwind CSS classes using clsx and tailwind-merge.
 * Handles conditional classes and removes conflicting Tailwind classes.
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': isActive });
 * // Returns: "px-4 py-2 bg-blue-500 text-white" (if isActive is true)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Formats a number with thousands separators
 *
 * @param num - The number to format
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234); // Returns "1,234"
 * formatNumber(1234.56); // Returns "1,234.56"
 * formatNumber(1234.56, { maximumFractionDigits: 1 }); // Returns "1,234.6"
 */
export function formatNumber(
  num: number,
  options: NumberFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 3,
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
}

/**
 * Formats a number as currency
 *
 * @param num - The number to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56); // Returns "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE'); // Returns "1.234,56 €"
 */
export function formatCurrency(
  num: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(num);
}

/**
 * Formats a number as a percentage
 *
 * @param num - The number to format (0-1 range)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(0.1234); // Returns "12%"
 * formatPercentage(0.1234, 'de-DE'); // Returns "12 %"
 */
export function formatPercentage(
  num: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a number with appropriate unit (K, M, B)
 *
 * @param num - The number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number with unit
 *
 * @example
 * formatCompactNumber(1234); // Returns "1.2K"
 * formatCompactNumber(1234567); // Returns "1.2M"
 */
export function formatCompactNumber(
  num: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

// ============================================================================
// CLIPBOARD OPERATIONS
// ============================================================================

/**
 * Copies text to the clipboard
 *
 * @param text - The text to copy
 * @returns Promise resolving to copy result
 *
 * @example
 * const result = await copyToClipboard("Hello World");
 * if (result.success) {
 *   console.log("Copied to clipboard");
 * }
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  try {
    if (!navigator?.clipboard) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return { success: true };
      } else {
        return { success: false, error: 'Copy command failed' };
      }
    }

    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reads text from the clipboard
 *
 * @returns Promise resolving to clipboard text
 *
 * @example
 * const text = await readFromClipboard();
 * console.log(text);
 */
export async function readFromClipboard(): Promise<string> {
  try {
    if (!navigator?.clipboard) {
      throw new Error('Clipboard API not available');
    }

    return await navigator.clipboard.readText();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to read from clipboard'
    );
  }
}

// ============================================================================
// URL GENERATION
// ============================================================================

/**
 * Generates a URL with query parameters
 *
 * @param baseUrl - The base URL
 * @param params - Query parameters object
 * @returns Generated URL string
 *
 * @example
 * generateShareUrl('https://example.com', { ref: 'twitter', id: '123' });
 * // Returns: "https://example.com?ref=twitter&id=123"
 */
export function generateShareUrl(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Generates a complete URL with options
 *
 * @param hostname - The hostname
 * @param options - URL options
 * @returns Generated URL string
 *
 * @example
 * generateUrl('example.com', {
 *   protocol: 'https',
 *   port: 3000,
 *   path: '/api/users',
 *   hash: 'section1'
 * });
 * // Returns: "https://example.com:3000/api/users#section1"
 */
export function generateUrl(hostname: string, options: UrlOptions = {}): string {
  const {
    protocol = 'https',
    port,
    path = '',
    hash,
  } = options;

  let url = `${protocol}://${hostname}`;
  
  if (port) {
    url += `:${port}`;
  }
  
  if (path) {
    url += path.startsWith('/') ? path : `/${path}`;
  }
  
  if (hash) {
    url += hash.startsWith('#') ? hash : `#${hash}`;
  }
  
  return url;
}

/**
 * Parses query parameters from a URL
 *
 * @param url - The URL to parse
 * @returns Object with query parameters
 *
 * @example
 * const params = parseQueryParams('https://example.com?ref=twitter&id=123');
 * // Returns: { ref: 'twitter', id: '123' }
 */
export function parseQueryParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch (error) {
    return {};
  }
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Capitalizes the first letter of a string
 *
 * @param str - The string to capitalize
 * @returns Capitalized string
 *
 * @example
 * capitalize('hello world'); // Returns "Hello world"
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to title case
 *
 * @param str - The string to convert
 * @returns Title case string
 *
 * @example
 * toTitleCase('hello world'); // Returns "Hello World"
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Truncates a string to a specified length
 *
 * @param str - The string to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string
 *
 * @example
 * truncate('Hello world', 8); // Returns "Hello..."
 * truncate('Hello world', 8, '…'); // Returns "Hello wo…"
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (!str || str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Generates a random string of specified length
 *
 * @param length - Length of the string
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Random string
 *
 * @example
 * generateRandomString(8); // Returns something like "aB3kL9mP"
 */
export function generateRandomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Deep clones an object
 *
 * @param obj - The object to clone
 * @returns Cloned object
 *
 * @example
 * const cloned = deepClone({ a: { b: 1 } });
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Checks if an object is empty
 *
 * @param obj - The object to check
 * @returns True if the object is empty
 *
 * @example
 * isEmpty({}); // Returns true
 * isEmpty({ a: 1 }); // Returns false
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Removes duplicate values from an array
 *
 * @param arr - The array to deduplicate
 * @returns Array with duplicates removed
 *
 * @example
 * unique([1, 2, 2, 3]); // Returns [1, 2, 3]
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Groups array items by a key function
 *
 * @param arr - The array to group
 * @param keyFn - Function to extract the key
 * @returns Object with grouped items
 *
 * @example
 * groupBy([{ type: 'a', value: 1 }, { type: 'b', value: 2 }], item => item.type);
 * // Returns: { a: [{ type: 'a', value: 1 }], b: [{ type: 'b', value: 2 }] }
 */
export function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Checks if a value is a valid email
 *
 * @param value - The value to check
 * @returns True if the value is a valid email
 *
 * @example
 * isValidEmail('user@example.com'); // Returns true
 * isValidEmail('invalid'); // Returns false
 */
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Checks if a value is a valid URL
 *
 * @param value - The value to check
 * @returns True if the value is a valid URL
 *
 * @example
 * isValidUrl('https://example.com'); // Returns true
 * isValidUrl('invalid'); // Returns false
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a value is a valid phone number (basic check)
 *
 * @param value - The value to check
 * @returns True if the value looks like a phone number
 *
 * @example
 * isValidPhone('+1234567890'); // Returns true
 * isValidPhone('invalid'); // Returns false
 */
export function isValidPhone(value: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
}
