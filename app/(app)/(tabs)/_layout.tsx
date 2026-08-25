'use client';

import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { colors } from '../../../src/lib/colors';
import { useAppState } from '../../../src/context/AppContext';

function SellerPill({ label, active }: { label: string; active: boolean }) {
  return (
    <View
      style={{
        backgroundColor: active ? colors.action : 'rgba(184,92,42,0.25)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginTop: 2,
      }}
    >
      <Text style={{ color: colors.onAction, fontSize: 10, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { sellerMode } = useAppState();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: sellerMode ? colors.action : colors.brand,
          height: 64,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: sellerMode ? colors.onAction : colors.value,
        tabBarInactiveTintColor: sellerMode ? 'rgba(255,255,255,0.55)' : colors.onBrand,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{ title: sellerMode ? 'Dashboard' : 'Home' }}
      />
      <Tabs.Screen name='search' options={{ title: 'Search' }} />
      <Tabs.Screen
        name='sell'
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <SellerPill label="SELL" active={focused} />,
        }}
      />
      <Tabs.Screen name='messages' options={{ title: 'Messages' }} />
      <Tabs.Screen
        name='profile'
        options={{
          title: sellerMode ? '🏪 Shop' : 'Profile',
        }}
      />
    </Tabs>
  );
}
