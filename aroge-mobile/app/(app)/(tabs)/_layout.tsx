import { Tabs } from 'expo-router';
import { Colors } from '../../../src/constants';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: Colors.green.primary, height: 64 }, tabBarActiveTintColor: Colors.gold.primary, tabBarInactiveTintColor: Colors.cream.background }}>
      <Tabs.Screen name='index' options={{ title: 'Home' }} />
      <Tabs.Screen name='categories' options={{ title: 'Categories' }} />
      <Tabs.Screen name='search' options={{ title: 'Search' }} />
      <Tabs.Screen name='cart' options={{ title: 'Cart' }} />
      <Tabs.Screen name='profile' options={{ title: 'Profile' }} />
    </Tabs>
  );
}
