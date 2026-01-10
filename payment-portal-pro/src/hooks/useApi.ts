import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

interface ApiOptions {
  showErrorToast?: boolean;
}

export const useApi = () => {
  const { token, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const apiCall = useCallback(
    async <T>(
      endpoint: string,
      options: RequestInit = {},
      apiOptions: ApiOptions = { showErrorToast: true }
    ): Promise<T> => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });

        if (response.status === 401) {
          logout();
          navigate('/login');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (response.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción.');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}`);
        }

        if (response.status === 204) {
          return {} as T;
        }

        return await response.json();
      } catch (error) {
        if (apiOptions.showErrorToast) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : 'Error de conexión',
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    [token, logout, navigate, toast]
  );

  const get = useCallback(
    <T>(endpoint: string, options?: ApiOptions) =>
      apiCall<T>(endpoint, { method: 'GET' }, options),
    [apiCall]
  );

  const post = useCallback(
    <T>(endpoint: string, body: unknown, options?: ApiOptions) =>
      apiCall<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, options),
    [apiCall]
  );

  const put = useCallback(
    <T>(endpoint: string, body: unknown, options?: ApiOptions) =>
      apiCall<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }, options),
    [apiCall]
  );

  const patch = useCallback(
    <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
      apiCall<T>(
        endpoint,
        { method: 'PATCH', body: body ? JSON.stringify(body) : undefined },
        options
      ),
    [apiCall]
  );

  const del = useCallback(
    <T>(endpoint: string, options?: ApiOptions) =>
      apiCall<T>(endpoint, { method: 'DELETE' }, options),
    [apiCall]
  );

  return { get, post, put, patch, del };
};
