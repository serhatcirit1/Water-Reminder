import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

// Ekranlar ve Context
import { TemaProvider, useTema } from './TemaContext';
import { AnaSayfaEkrani, IstatistiklerEkrani, AyarlarEkrani } from './screens';

const Tab = createBottomTabNavigator();

// Tab Bar Icon bileşeni (Emoji kullanarak)
const TabBarIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', top: 5 }}>
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{label}</Text>
  </View>
);

function NavigationContent() {
  const { renkler } = useTema();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: renkler.arkaplan,
          borderTopWidth: 1,
          borderTopColor: renkler.sinir,
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: renkler.vurguAcik,
        tabBarInactiveTintColor: renkler.metinSoluk,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tab.Screen
        name="AnaSayfa"
        component={AnaSayfaEkrani}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabBarIcon label="💧" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Istatistikler"
        component={IstatistiklerEkrani}
        options={{
          tabBarLabel: 'İstatistikler',
          tabBarIcon: ({ focused }) => <TabBarIcon label="📊" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Ayarlar"
        component={AyarlarEkrani}
        options={{
          tabBarLabel: 'Ayarlar',
          tabBarIcon: ({ focused }) => <TabBarIcon label="⚙️" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        <NavigationContainer>
          <NavigationContent />
          <StatusBar style="auto" />
        </NavigationContainer>
      </TemaProvider>
    </SafeAreaProvider>
  );
}
