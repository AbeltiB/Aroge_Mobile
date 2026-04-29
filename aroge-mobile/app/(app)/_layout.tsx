import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.green.primary, borderTopWidth: 0, height: 64 },
        tabBarActiveTintColor: Colors.gold.primary,
        tabBarInactiveTintColor: Colors.cream.background,
      }}
    >
      <Tabs.Screen name='index' options={{ title: 'Home' }} />
      <Tabs.Screen name='profile' options={{ title: 'Profile' }} />
    </Tabs>
  );
}
