// ============================================================
// SATQUERY AI — Authentication Service
// Cleanly isolated service for authentication logic.
// Ready to be connected to a real API endpoint (e.g. POST /api/auth/login).
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
  avatarUrl?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

const STORAGE_KEY = 'satquery_user_session';
import { loginUser as apiLoginUser } from '../api/services';

const SIMULATED_DELAY_MS = 600;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginUser(credentials: AuthCredentials): Promise<AuthResponse> {
  const identifier = credentials.email.trim();
  const password = credentials.password;

  // Basic validation
  if (!identifier) {
    return { success: false, error: 'Institutional ID or Email is required.' };
  }

  if (identifier.length < 3) {
    return { success: false, error: 'Institutional ID must be at least 3 characters.' };
  }

  if (!password) {
    return { success: false, error: 'Password cannot be empty.' };
  }

  if (password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  // Attempt backend authentication
  try {
    const apiRes = await apiLoginUser({ email: identifier, password });
    if (apiRes && (apiRes.token || apiRes.user || apiRes.access_token || apiRes.status === 'success')) {
      const user: User = apiRes.user || {
        id: `usr_${Date.now()}`,
        name: identifier.includes('@')
          ? identifier.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
          : identifier,
        email: identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@isro.gov.in`,
        organization: 'ISRO / Earth Observation Division',
        role: 'Remote Sensing Analyst',
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch {
        // Ignore storage errors
      }

      return {
        success: true,
        user,
        token: apiRes.token || apiRes.access_token || `sq_tok_${Date.now()}`,
      };
    }
  } catch (err: any) {
    const msg = err?.message || '';

    // Backend explicitly rejected credentials (401 or 403)
    if (
      msg.includes('401') ||
      msg.includes('403') ||
      msg.toLowerCase().includes('unauthorized') ||
      msg.toLowerCase().includes('invalid credential')
    ) {
      return {
        success: false,
        error: 'Invalid institutional credentials. Please check your ID and password.',
      };
    }

    // Backend endpoint /login is 404 (endpoint not yet deployed by backend teammate)
    if (msg.includes('404')) {
      await delay(SIMULATED_DELAY_MS);
      // Validate against institutional demo credentials
      if (password === 'isro2024' || password === 'admin123' || password === 'demo2024') {
        const user: User = {
          id: `usr_${Date.now()}`,
          name: identifier.includes('@')
            ? identifier.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
            : identifier,
          email: identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@isro.gov.in`,
          organization: 'ISRO / Earth Observation Division',
          role: 'Remote Sensing Analyst',
        };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } catch {
          // Ignore storage errors
        }

        return {
          success: true,
          user,
          token: `sq_tok_${Date.now()}`,
        };
      } else {
        return {
          success: false,
          error: 'Invalid password for this institutional account.',
        };
      }
    }

    // General network error
    return {
      success: false,
      error: 'Unable to reach authorization server. Please verify network connectivity.',
    };
  }

  return {
    success: false,
    error: 'Authentication failed. Please verify credentials.',
  };
}

export function getCurrentSessionUser(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function isAuthenticated(): boolean {
  return getCurrentSessionUser() !== null;
}
