import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useAppState } from '../context/AppContext';

export default function AuthScreen() {
  const { step, phoneNumber, setPhoneNumber, loading, initiateTelegramAuth, verifyOTP } = useAuth();
  const [otp, setOtp] = useState('');
  const { setAuthenticated } = useAppState();

  useEffect(() => {
    if (step === 'success') {
      setAuthenticated(true);
      router.replace('/(app)');
    }
  }, [setAuthenticated, step]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Telegram Verification Login</Text>
      <Text style={styles.text}>No bot login. Telegram sends verification code directly.</Text>
      {step === 'phone' ? (
        <>
          <TextInput placeholder='9-digit phone' value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} keyboardType='phone-pad' />
          <Pressable onPress={initiateTelegramAuth} style={styles.button} disabled={loading}><Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Telegram Code'}</Text></Pressable>
        </>
      ) : (
        <>
          <TextInput placeholder='6-digit code' value={otp} onChangeText={setOtp} style={styles.input} keyboardType='number-pad' />
          <Pressable onPress={() => verifyOTP(otp)} style={styles.button} disabled={loading}><Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text></Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text.primary },
  text: { marginTop: 8, marginBottom: 20, color: Colors.text.secondary },
  input: { borderWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.cream.surface, padding: 14, borderRadius: 12, marginBottom: 14 },
  button: { backgroundColor: Colors.telegram, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700' },
});
