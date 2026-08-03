const AUTH_USER_KEY = 'auth_user';
const AUTH_TOKEN_KEY = 'auth_token';

function getStoredSession() {
  if (typeof window === 'undefined') return null;

  try {
    const storedUser = window.localStorage.getItem(AUTH_USER_KEY);
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedUser || !token) return null;

    return {
      user: JSON.parse(storedUser),
      token,
    };
  } catch {
    return null;
  }
}

export function getCurrentAuthUser() {
  return getStoredSession()?.user ?? null;
}

export function isAuthenticatedUser() {
  const session = getStoredSession();
  return Boolean(session?.user && session?.token);
}

export async function requestPasswordReset(email) {
  if (!email || !String(email).trim()) {
    throw new Error('Email is required');
  }

  return {
    success: true,
    message: 'If an account exists with that email, you will receive a reset link shortly.',
  };
}

export async function resetPassword({ resetToken, newPassword }) {
  if (!resetToken) {
    throw new Error('Invalid reset token');
  }

  if (!newPassword || String(newPassword).length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  return {
    success: true,
    message: 'Password updated successfully.',
  };
}
