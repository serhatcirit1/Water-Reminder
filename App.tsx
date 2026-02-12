import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import './locales/i18n';
import { bildirimIzniIste, hatirlatmalariPlanla, bildirimAyarlariniKaydet, gunlukOzetPlanla, haftalikRaporPlanla } from './bildirimler';

// Ekranlar ve Context
import { TemaProvider, useTema } from './TemaContext';
import { PremiumProvider } from './PremiumContext';
import { AnaSayfaEkrani, IstatistiklerEkrani, GorevlerEkrani, AyarlarEkrani, OnboardingEkrani } from './screens';

const Tab = createBottomTabNavigator();

// Tab Bar Icon bileşeni (Emoji kullanarak)
const TabBarIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', top: -2 }}>
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{label}</Text>
  </View>
);

function NavigationContent() {
  const { renkler } = useTema();
  const { t } = useTranslation();

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
          tabBarLabel: t('home.title'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="💧" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Istatistikler"
        component={IstatistiklerEkrani}
        options={{
          tabBarLabel: t('stats.title'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="📊" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Gorevler"
        component={GorevlerEkrani}
        options={{
          tabBarLabel: t('gorevler.tabTitle'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="🎯" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Ayarlar"
        component={AyarlarEkrani}
        options={{
          tabBarLabel: t('settings.title'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="⚙️" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { renkler } = useTema();
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem('@onboarding_tamamlandi');
      setShowOnboarding(completed !== 'true');
    } catch (error) {
      console.error('Onboarding kontrolü hatası:', error);
      setShowOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    // Onboarding sonrası bildirim izni iste ve bildirimleri planla
    try {
      const izinVerildi = await bildirimIzniIste();
      if (izinVerildi) {
        // Bildirim ayarlarını aktif olarak kaydet
        await bildirimAyarlariniKaydet(true, 120);
        // Hatırlatma bildirimlerini planla
        await hatirlatmalariPlanla(120);
        // Günlük özet bildirimini planla
        await gunlukOzetPlanla();
        // Haftalık rapor bildirimini planla
        await haftalikRaporPlanla();
      }
    } catch (error) {
      console.error('Bildirim ayarlama hatası:', error);
    }
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: renkler.arkaplan }}>
        <ActivityIndicator size="large" color={renkler.vurguAcik} />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingEkrani onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer>
      <NavigationContent />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PremiumProvider>
        <TemaProvider>
          <AppContent />
        </TemaProvider>
      </PremiumProvider>
    </SafeAreaProvider>
  );
}
