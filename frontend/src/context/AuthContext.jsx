import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configurar axios para incluir el token en todas las peticiones
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('citamed_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('citamed_token');
      const savedUser = localStorage.getItem('citamed_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('citamed_user');
          localStorage.removeItem('citamed_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);

      if (response.data.success) {
        // Verificar si requiere 2FA
        if (response.data.requires2FA) {
          return {
            success: true,
            requires2FA: true,
            userId: response.data.userId,
            message: response.data.message
          };
        }

        const { token, user: userData, profile } = response.data.data;

        // Guardar token y usuario
        localStorage.setItem('citamed_token', token);
        const userWithProfile = { ...userData, profile };
        localStorage.setItem('citamed_user', JSON.stringify(userWithProfile));
        setUser(userWithProfile);

        toast.success('Sesión iniciada correctamente');
        return { success: true, user: userWithProfile };
      } else {
        toast.error(response.data.message || 'Error al iniciar sesión');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Login con verificación 2FA (segundo paso)
  const loginWith2FA = async (userId, token) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login/2fa`, { userId, token });

      if (response.data.success) {
        const { token: authToken, user: userData, profile } = response.data.data;

        // Guardar token y usuario
        localStorage.setItem('citamed_token', authToken);
        const userWithProfile = { ...userData, profile };
        localStorage.setItem('citamed_user', JSON.stringify(userWithProfile));
        setUser(userWithProfile);

        toast.success('Sesión iniciada correctamente');
        return { success: true, user: userWithProfile };
      } else {
        return { success: false, message: response.data.message || 'Código inválido' };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Código de verificación inválido';
      return { success: false, message };
    }
  };

  const logout = async () => {
    // Intentar cerrar sesión en el servidor
    try {
      const token = localStorage.getItem('citamed_token');
      if (token) {
        await axios.post(`${API_URL}/auth/logout`);
      }
    } catch (error) {
      // Continuar con logout local aunque falle el servidor
      console.error('Error al cerrar sesión en servidor:', error);
    }

    // Limpiar estado local
    setUser(null);
    localStorage.removeItem('citamed_user');
    localStorage.removeItem('citamed_token');
    toast.success('Sesión cerrada');
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);

      if (response.data.success) {
        const { token, user: newUser, profile } = response.data.data;

        // Guardar token y usuario
        localStorage.setItem('citamed_token', token);
        const userWithProfile = { ...newUser, profile };
        localStorage.setItem('citamed_user', JSON.stringify(userWithProfile));
        setUser(userWithProfile);

        toast.success('Registro exitoso');
        return { success: true, user: userWithProfile };
      } else {
        toast.error(response.data.message || 'Error en el registro');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar usuario';
      toast.error(message);
      return { success: false, message };
    }
  };

  const getUserRole = () => {
    return user?.role || null;
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'patient':
        return '/dashboard';
      case 'doctor':
        return '/medico/dashboard';
      case 'provider':
        return '/proveedor/dashboard';
      case 'admin':
        return '/admin/audit';
      default:
        return '/';
    }
  };

  // Refrescar datos del usuario desde el servidor
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('citamed_token');
      if (!token) return null;

      const response = await axios.get(`${API_URL}/auth/profile`);

      if (response.data.success) {
        const { user: userData, profile } = response.data.data;
        const userWithProfile = { ...userData, profile };
        localStorage.setItem('citamed_user', JSON.stringify(userWithProfile));
        setUser(userWithProfile);
        return userWithProfile;
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Si el token es inválido, hacer logout
      if (error.response?.status === 401) {
        logout();
      }
    }
    return null;
  };

  // Actualizar usuario localmente (sin llamar al servidor)
  const updateUser = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('citamed_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWith2FA, logout, register, getUserRole, getDashboardPath, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
