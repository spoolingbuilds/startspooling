/**
 * @fileoverview IP address extraction utilities for various environments.
 * This module provides functions to extract client IP addresses from requests
 * handling various proxy headers and deployment environments like Vercel, Cloudflare, etc.
 */

import { NextRequest } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

/**
 * IP extraction result
 */
export interface IpExtractionResult {
  ip: string | null;
  source: string;
  isPrivate: boolean;
  isV4: boolean;
  isV6: boolean;
}

/**
 * IP validation result
 */
export interface IpValidationResult {
  isValid: boolean;
  version: 'v4' | 'v6' | null;
  isPrivate: boolean;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Common proxy headers to check for IP addresses
 */
const PROXY_HEADERS = [
  'x-forwarded-for',
  'x-real-ip',
  'x-client-ip',
  'x-forwarded',
  'x-cluster-client-ip',
  'forwarded-for',
  'forwarded',
  'cf-connecting-ip', // Cloudflare
  'true-client-ip', // Cloudflare
  'x-vercel-forwarded-for', // Vercel
  'x-vercel-ip-country', // Vercel
] as const;

/**
 * Private IP ranges (IPv4)
 */
const PRIVATE_IP_RANGES = [
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' },
] as const;

/**
 * IPv6 private ranges
 */
const PRIVATE_IPV6_RANGES = [
  'fc00::/7', // Unique local addresses
  'fe80::/10', // Link-local addresses
  '::1/128', // Loopback
] as const;

// ============================================================================
// IP VALIDATION UTILITIES
// ============================================================================

/**
 * Validates an IPv4 address
 *
 * @param ip - The IP address to validate
 * @returns True if the IP is valid IPv4
 *
 * @example
 * isValidIPv4('192.168.1.1'); // Returns true
 * isValidIPv4('256.1.1.1'); // Returns false
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Validates an IPv6 address
 *
 * @param ip - The IP address to validate
 * @returns True if the IP is valid IPv6
 *
 * @example
 * isValidIPv6('2001:db8::1'); // Returns true
 * isValidIPv6('192.168.1.1'); // Returns false
 */
export function isValidIPv6(ip: string): boolean {
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  return ipv6Regex.test(ip) || ipv6Regex.test(ip.replace(/::/, ':0:0:0:0:0:0:'));
}

/**
 * Validates an IP address (IPv4 or IPv6)
 *
 * @param ip - The IP address to validate
 * @returns Validation result with details
 *
 * @example
 * const result = validateIP('192.168.1.1');
 * console.log(result.isValid); // true
 * console.log(result.version); // 'v4'
 */
export function validateIP(ip: string): IpValidationResult {
  if (!ip || typeof ip !== 'string') {
    return {
      isValid: false,
      version: null,
      isPrivate: false,
      error: 'Invalid IP format',
    };
  }

  const trimmedIp = ip.trim();

  if (isValidIPv4(trimmedIp)) {
    return {
      isValid: true,
      version: 'v4',
      isPrivate: isPrivateIPv4(trimmedIp),
    };
  }

  if (isValidIPv6(trimmedIp)) {
    return {
      isValid: true,
      version: 'v6',
      isPrivate: isPrivateIPv6(trimmedIp),
    };
  }

  return {
    isValid: false,
    version: null,
    isPrivate: false,
    error: 'Invalid IP format',
  };
}

/**
 * Checks if an IPv4 address is private
 *
 * @param ip - The IPv4 address to check
 * @returns True if the IP is private
 *
 * @example
 * isPrivateIPv4('192.168.1.1'); // Returns true
 * isPrivateIPv4('8.8.8.8'); // Returns false
 */
export function isPrivateIPv4(ip: string): boolean {
  if (!isValidIPv4(ip)) return false;

  const ipParts = ip.split('.').map(Number);

  return PRIVATE_IP_RANGES.some(range => {
    const startParts = range.start.split('.').map(Number);
    const endParts = range.end.split('.').map(Number);

    return ipParts.every((part, index) => 
      part >= startParts[index] && part <= endParts[index]
    );
  });
}

/**
 * Checks if an IPv6 address is private
 *
 * @param ip - The IPv6 address to check
 * @returns True if the IP is private
 *
 * @example
 * isPrivateIPv6('fc00::1'); // Returns true
 * isPrivateIPv6('2001:db8::1'); // Returns false
 */
export function isPrivateIPv6(ip: string): boolean {
  if (!isValidIPv6(ip)) return false;

  // Simple check for common private IPv6 ranges
  return ip.startsWith('fc') || 
         ip.startsWith('fe8') || 
         ip === '::1' || 
         ip === '::';
}

// ============================================================================
// IP EXTRACTION UTILITIES
// ============================================================================

/**
 * Extracts the first valid IP from a comma-separated list
 *
 * @param ipList - Comma-separated IP addresses
 * @returns First valid IP or null
 *
 * @example
 * extractFirstIP('192.168.1.1, 10.0.0.1, invalid'); // Returns '192.168.1.1'
 */
export function extractFirstIP(ipList: string): string | null {
  if (!ipList) return null;

  const ips = ipList.split(',').map(ip => ip.trim());
  
  for (const ip of ips) {
    const validation = validateIP(ip);
    if (validation.isValid) {
      return ip;
    }
  }

  return null;
}

/**
 * Extracts IP address from request headers
 *
 * @param headers - Request headers object
 * @returns IP extraction result
 *
 * @example
 * const result = extractIPFromHeaders(request.headers);
 * console.log(result.ip); // '192.168.1.1'
 * console.log(result.source); // 'x-forwarded-for'
 */
export function extractIPFromHeaders(headers: Headers): IpExtractionResult {
  // Check each proxy header in order of preference
  for (const headerName of PROXY_HEADERS) {
    const headerValue = headers.get(headerName);
    if (headerValue) {
      const ip = extractFirstIP(headerValue);
      if (ip) {
        const validation = validateIP(ip);
        return {
          ip,
          source: headerName,
          isPrivate: validation.isPrivate,
          isV4: validation.version === 'v4',
          isV6: validation.version === 'v6',
        };
      }
    }
  }

  return {
    ip: null,
    source: 'none',
    isPrivate: false,
    isV4: false,
    isV6: false,
  };
}

/**
 * Extracts IP address from a NextRequest object
 *
 * @param request - NextRequest object
 * @returns IP extraction result
 *
 * @example
 * const result = extractIPFromNextRequest(request);
 * console.log(result.ip); // '192.168.1.1'
 */
export function extractIPFromNextRequest(request: NextRequest): IpExtractionResult {
  return extractIPFromHeaders(request.headers);
}

/**
 * Extracts IP address from a standard Request object
 *
 * @param request - Standard Request object
 * @returns IP extraction result
 *
 * @example
 * const result = extractIPFromRequest(request);
 * console.log(result.ip); // '192.168.1.1'
 */
export function extractIPFromRequest(request: Request): IpExtractionResult {
  return extractIPFromHeaders(request.headers);
}

/**
 * Main IP extraction function that handles various request types
 *
 * @param request - Request object (NextRequest, Request, or Headers)
 * @returns IP address string or null
 *
 * @example
 * const ip = extractIP(request);
 * console.log(ip); // '192.168.1.1'
 */
export function extractIP(request: NextRequest | Request | Headers): string | null {
  let headers: Headers;

  if (request instanceof Headers) {
    headers = request;
  } else if ('headers' in request) {
    headers = request.headers;
  } else {
    return null;
  }

  const result = extractIPFromHeaders(headers);
  return result.ip;
}

// ============================================================================
// ENVIRONMENT-SPECIFIC UTILITIES
// ============================================================================

/**
 * Extracts IP address optimized for Vercel deployment
 *
 * @param request - Request object
 * @returns IP address string or null
 *
 * @example
 * const ip = extractVercelIP(request);
 */
export function extractVercelIP(request: NextRequest | Request): string | null {
  const headers = request.headers;
  
  // Vercel-specific headers (in order of preference)
  const vercelHeaders = [
    'x-vercel-forwarded-for',
    'x-forwarded-for',
    'x-real-ip',
  ];

  for (const headerName of vercelHeaders) {
    const headerValue = headers.get(headerName);
    if (headerValue) {
      const ip = extractFirstIP(headerValue);
      if (ip) {
        return ip;
      }
    }
  }

  return null;
}

/**
 * Extracts IP address optimized for Cloudflare
 *
 * @param request - Request object
 * @returns IP address string or null
 *
 * @example
 * const ip = extractCloudflareIP(request);
 */
export function extractCloudflareIP(request: NextRequest | Request): string | null {
  const headers = request.headers;
  
  // Cloudflare-specific headers (in order of preference)
  const cloudflareHeaders = [
    'cf-connecting-ip',
    'true-client-ip',
    'x-forwarded-for',
    'x-real-ip',
  ];

  for (const headerName of cloudflareHeaders) {
    const headerValue = headers.get(headerName);
    if (headerValue) {
      const ip = extractFirstIP(headerValue);
      if (ip) {
        return ip;
      }
    }
  }

  return null;
}

/**
 * Extracts IP address optimized for AWS Load Balancer
 *
 * @param request - Request object
 * @returns IP address string or null
 *
 * @example
 * const ip = extractAWSIP(request);
 */
export function extractAWSIP(request: NextRequest | Request): string | null {
  const headers = request.headers;
  
  // AWS-specific headers (in order of preference)
  const awsHeaders = [
    'x-forwarded-for',
    'x-forwarded',
    'x-real-ip',
  ];

  for (const headerName of awsHeaders) {
    const headerValue = headers.get(headerName);
    if (headerValue) {
      const ip = extractFirstIP(headerValue);
      if (ip) {
        return ip;
      }
    }
  }

  return null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Masks an IP address for privacy (shows only first 3 octets for IPv4)
 *
 * @param ip - The IP address to mask
 * @returns Masked IP address
 *
 * @example
 * maskIP('192.168.1.100'); // Returns '192.168.1.xxx'
 */
export function maskIP(ip: string): string {
  if (!ip) return ip;

  const validation = validateIP(ip);
  
  if (validation.version === 'v4') {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  
  if (validation.version === 'v6') {
    // For IPv6, mask the last segment
    const parts = ip.split(':');
    if (parts.length > 0) {
      parts[parts.length - 1] = 'xxxx';
      return parts.join(':');
    }
  }

  return ip;
}

/**
 * Gets IP address with fallback to a default value
 *
 * @param request - Request object
 * @param fallback - Fallback IP address
 * @returns IP address or fallback
 *
 * @example
 * const ip = getIPWithFallback(request, '127.0.0.1');
 */
export function getIPWithFallback(
  request: NextRequest | Request | Headers,
  fallback: string = '127.0.0.1'
): string {
  const ip = extractIP(request);
  return ip || fallback;
}

/**
 * Checks if an IP address is from a specific country (requires additional service)
 *
 * @param ip - The IP address to check
 * @returns Promise resolving to country code or null
 *
 * @example
 * const country = await getIPCountry('8.8.8.8');
 * console.log(country); // 'US'
 */
export async function getIPCountry(ip: string): Promise<string | null> {
  try {
    // This would require an external service like ipapi.co, ipinfo.io, etc.
    // For now, return null as this requires API keys and external dependencies
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Gets detailed IP information
 *
 * @param request - Request object
 * @returns Detailed IP extraction result
 *
 * @example
 * const info = getIPInfo(request);
 * console.log(`IP: ${info.ip}, Source: ${info.source}, Private: ${info.isPrivate}`);
 */
export function getIPInfo(request: NextRequest | Request | Headers): IpExtractionResult {
  let headers: Headers;

  if (request instanceof Headers) {
    headers = request;
  } else if ('headers' in request) {
    headers = request.headers;
  } else {
    return {
      ip: null,
      source: 'invalid',
      isPrivate: false,
      isV4: false,
      isV6: false,
    };
  }

  return extractIPFromHeaders(headers);
}
