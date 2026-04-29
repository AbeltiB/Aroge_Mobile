import { useCallback, useState } from 'react';
import { api } from '../services/api';

export type AuthStep = 'phone' | 'otp' | 'success';

export const useAuth = () => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateTelegramAuth = useCallback(async () => {
    if (phoneNumber.length < 9) {
      setError('Enter a valid phone number.');
      return;
    }

    setLoading(true);
    setError(null);
    await api.requestTelegramCode(`+251${phoneNumber}`);
    await new Promise((r) => setTimeout(r, 900));
    setStep('otp');
    setLoading(false);
  }, [phoneNumber]);

  const verifyOTP = useCallback(
    async (otp: string) => {
      if (otp.length < 6) return;
      setLoading(true);
      await api.verifyTelegramCode(`+251${phoneNumber}`, otp);
      await new Promise((r) => setTimeout(r, 900));
      setStep('success');
      setLoading(false);
    },
    [phoneNumber],
  );

  const resetAuth = useCallback(() => {
    setStep('phone');
    setError(null);
  }, []);

  return { step, phoneNumber, loading, error, setPhoneNumber, initiateTelegramAuth, verifyOTP, resetAuth };
};
