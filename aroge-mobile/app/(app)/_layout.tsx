import { Stack } from 'expo-router';

export default function AppStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(tabs)' />
      <Stack.Screen name='product/[id]' />
      <Stack.Screen name='checkout' />
      <Stack.Screen name='create-listing' />
    </Stack>
  );
}
