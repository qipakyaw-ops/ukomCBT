import React, { createContext, useState, useContext, useEffect } from 'react';
import authClient from '@/api/authClient.js';

const AUTH_USER_KEY = 'auth_user';
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';

const mockUsers = [
  {
    id: 'admin-1',
    name: 'Administrator',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 'student-1',
    name: 'Student Demo',
    email: 'student@example.com',
    password: 'student123',
    role: 'student'
  }
];

const USE_BACKEND_AUTH = true;

const AuthContext = createContext();

const getStoredSession = () => {
  try {
    const storedUser = window.localStorage.getItem(AUTH_USER_KEY);
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedUser || !token) return null;
    return {
      user: JSON.parse(storedUser),
      token
    };
  } catch (error) {
    console.error('Failed reading auth session from localStorage', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Maintained for app structure compatibility

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    await checkUserAuth();
    setIsLoadingPublicSettings(false);
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    const storedSession = getStoredSession();
    if (storedSession) {
      if (USE_BACKEND_AUTH) {
        try {
          const response = await authClient.getMe(storedSession.token);
          const user = response.data.user;
          setUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to verify token with backend:', error);
          setUser(null);
          setIsAuthenticated(false);
          try {
            window.localStorage.removeItem(AUTH_USER_KEY);
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
            window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
          } catch (e) {
            console.error('Failed clearing auth storage', e);
          }
        }
      } else {
        setUser(storedSession.user);
        setIsAuthenticated(true);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const register = async (name, email, password, role = 'student') => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      if (USE_BACKEND_AUTH) {
        const response = await authClient.register(name, email, password, role);
        const authenticatedUser = response.data.user;
        const token = response.data.token;

        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authenticatedUser));
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
        window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, token);

        setUser(authenticatedUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);

        return authenticatedUser;
      } else {
        const authenticatedUser = {
          id: `mock-${Date.now()}`,
          name,
          email,
          role
        };

        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authenticatedUser));
        window.localStorage.setItem(AUTH_TOKEN_KEY, 'mock-access-token');
        window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, 'mock-refresh-token');

        setUser(authenticatedUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);

        return authenticatedUser;
      }
    } catch (error) {
      setIsLoadingAuth(false);
      setAuthError({ type: 'registration_failed', message: error.message || 'Registrasi gagal.' });
      throw error;
    }
  };

  const login = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      if (USE_BACKEND_AUTH) {
        const response = await authClient.login(email, password);
        const authenticatedUser = response.data.user;
        const token = response.data.token;

        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authenticatedUser));
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
        window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, token);

        setUser(authenticatedUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);

        return authenticatedUser;
      } else {
        const normalizedEmail = email?.trim().toLowerCase();
        const matchedUser = mockUsers.find(
          (mockUser) => mockUser.email === normalizedEmail && mockUser.password === password
        );

        if (!matchedUser) {
          setIsLoadingAuth(false);
          setAuthError({ type: 'invalid_credentials', message: 'Email atau password tidak valid.' });
          throw new Error('Invalid credentials');
        }

        const authenticatedUser = {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role
        };

        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authenticatedUser));
        window.localStorage.setItem(AUTH_TOKEN_KEY, 'mock-access-token');
        window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, 'mock-refresh-token');

        setUser(authenticatedUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);

        return authenticatedUser;
      }
    } catch (error) {
      setIsLoadingAuth(false);
      setAuthError({ type: 'invalid_credentials', message: error.message || 'Email atau password tidak valid.' });
      throw error;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    try {
      window.localStorage.removeItem(AUTH_USER_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed clearing auth storage during logout', error);
    }

    if (shouldRedirect) {
      window.location.replace('/login');
    }
  };

  const navigateToLogin = () => {
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
        login,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
