'use client';

import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Home, Search, MessageCircle, User, Store } from 'lucide-react-native';
import { Colors, FontFamily } from '../../../src/constants';
import { useAppState } from '../../../src/context/AppContext';

function SellerPill({ label, active }: { label: string; active: boolean }) {
  return (
    <View
      style={{
        backgroundColor: active ? Colors.terracotta.primary : Colors.terracotta.tint,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginTop: 2,
      }}
    >
      <Text style={{ fontFamily: FontFamily.interBold, color: active ? '#ffffff' : Colors.terracotta.primary, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { sellerMode } = useAppState();
  const activeTint = sellerMode ? Colors.terracotta.primary : Colors.green.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.cream.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.line,
          height: 64,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: Colors.inkSoft,
        tabBarLabelStyle: { fontFamily: FontFamily.interSemibold, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: sellerMode ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color, focused }) => <Home color={color} size={22} strokeWidth={focused ? 2.4 : 2} />,
        }}
      />
      <Tabs.Screen
        name='search'
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => <Search color={color} size={22} strokeWidth={focused ? 2.4 : 2} />,
        }}
      />
      <Tabs.Screen
        name='sell'
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <SellerPill label="SELL" active={focused} />,
        }}
      />
      <Tabs.Screen
        name='messages'
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => <MessageCircle color={color} size={22} strokeWidth={focused ? 2.4 : 2} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: sellerMode ? 'Shop' : 'Profile',
          tabBarIcon: ({ color, focused }) =>
            sellerMode
              ? <Store color={color} size={22} strokeWidth={focused ? 2.4 : 2} />
              : <User color={color} size={22} strokeWidth={focused ? 2.4 : 2} />,
        }}
      />
    </Tabs>
  );
}
