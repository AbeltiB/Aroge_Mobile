'use client';

import { Tabs } from 'expo-router';
import { View, Text, Pressable, GestureResponderEvent } from 'react-native';
import { Home, Search, MessageCircle, User, Store, Tag, Radio } from 'lucide-react-native';
import { Colors, FontFamily } from '../../../src/constants';
import { useAppState } from '../../../src/context/AppContext';

// react-navigation's default tabBarIcon slot is sized for a small square
// icon and clips anything wider — a text pill rendered there got cut off
// to "S" + half an "E". tabBarButton renders the whole tab (full width,
// no icon-slot constraint), so the pill controls its own layout instead.
function SellTabButton({ onPress, accessibilityState }: { onPress?: (e: GestureResponderEvent) => void; accessibilityState?: { selected?: boolean } }) {
  const active = !!accessibilityState?.selected;
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: active ? Colors.terracotta.primary : Colors.terracotta.tint,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 7,
        }}
      >
        <Tag size={13} color={active ? '#ffffff' : Colors.terracotta.primary} strokeWidth={2.4} />
        <Text
          style={{
            fontFamily: FontFamily.interBold,
            color: active ? '#ffffff' : Colors.terracotta.primary,
            fontSize: 12,
            letterSpacing: 0.3,
          }}
        >
          Sell
        </Text>
      </View>
    </Pressable>
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
          tabBarButton: (props) => <SellTabButton {...props} />,
        }}
      />
      {/* Only meaningful while running a live sale — hidden (not unmounted,
          so its own navigation state survives toggling Seller Mode) when
          the seller isn't in seller mode at all. */}
      <Tabs.Screen
        name='live'
        options={{
          title: 'Live',
          href: sellerMode ? undefined : null,
          tabBarIcon: ({ color, focused }) => <Radio color={color} size={22} strokeWidth={focused ? 2.4 : 2} />,
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
