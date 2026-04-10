import { useCallback, useState } from 'react';

export type AuthStep = 'idle' | 'phone' | 'otp' | 'success' | 'error';
export type AuthMethod = 'telegram' | 'phone';

interface AuthState {
  step: AuthStep;
  method: AuthMethod | null;
  phoneNumber: string;
  error: string | null;
  loading: boolean;
}

interface UseAuthReturn extends AuthState {
  initiatePhoneAuth: (phone: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  initiateTelegramAuth: () => Promise<void>;
  resetAuth: () => void;
  setPhoneNumber: (phone: string) => void;
}

const INITIAL_STATE: AuthState = {
  step: 'idle',
  method: null,
  phoneNumber: '',
  error: null,
  loading: false,
};

/**
 * useAuth — manages auth flow state.
 *
 * TODO: Replace mock implementations with real API calls:
 *   - initiatePhoneAuth → POST /auth/phone/request-otp (Afro SMS)
 *   - verifyOTP         → POST /auth/phone/verify-otp
 *   - initiateTelegramAuth → open Telegram bot deep-link + poll for token
 */
export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  const setPhoneNumber = useCallback((phone: string) => {
    setState((s) => ({ ...s, phoneNumber: phone, error: null }));
  }, []);

  const initiatePhoneAuth = useCallback(async (phone: string) => {
    if (phone.length < 9) {
      setState((s) => ({ ...s, error: 'Enter a valid 9-digit phone number' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null, method: 'phone' }));

    try {
      // TODO: await api.post('/auth/phone/request-otp', { phone: `+251${phone}` })
      await new Promise((r) => setTimeout(r, 1200)); // mock network delay

      setState((s) => ({
        ...s,
        loading: false,
        step: 'otp',
        phoneNumber: phone,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Failed to send OTP. Please try again.',
      }));
    }
  }, []);

  const verifyOTP = useCallback(async (otp: string) => {
    if (otp.length < 6) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // TODO: await api.post('/auth/phone/verify-otp', { phone, otp, token })
      await new Promise((r) => setTimeout(r, 1000));

      // TODO: Store JWT / session in SecureStore
      setState((s) => ({ ...s, loading: false, step: 'success' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        step: 'error',
        error: 'Incorrect code. Please try again.',
      }));
    }
  }, []);

  const initiateTelegramAuth = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, method: 'telegram' }));

    try {
      // TODO:
      // 1. GET /auth/telegram/init → get bot username + nonce
      // 2. Linking.openURL(`tg://resolve?domain=ArogeBotName&start=${nonce}`)
      // 3. Poll /auth/telegram/status?nonce= until resolved
      await new Promise((r) => setTimeout(r, 1500));

      setState((s) => ({ ...s, loading: false, step: 'success' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Telegram sign-in failed. Please try again.',
      }));
    }
  }, []);

  const resetAuth = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    initiatePhoneAuth,
    verifyOTP,
    initiateTelegramAuth,
    resetAuth,
    setPhoneNumber,
  };
};