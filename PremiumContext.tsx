// ============================================
// PREMIUM CONTEXT
// ============================================
// Uygulama genelinde premium durumunu reaktif olarak yönetir

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { premiumDurumYukle, PremiumDurum } from './premiumUtils';

interface PremiumContextType {
    isPremium: boolean;
    premiumDurum: PremiumDurum | null;
    checkPremium: () => Promise<void>;
    setPremium: (durum: PremiumDurum) => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [premiumDurum, setPremiumDurum] = useState<PremiumDurum | null>(null);

    // İlk yükleme
    useEffect(() => {
        checkPremium();
    }, []);

    const checkPremium = async () => {
        const durum = await premiumDurumYukle();
        setIsPremium(durum.aktif);
        setPremiumDurum(durum);
    };

    const setPremium = (durum: PremiumDurum) => {
        setIsPremium(durum.aktif);
        setPremiumDurum(durum);
    };

    return (
        <PremiumContext.Provider value={{ isPremium, premiumDurum, checkPremium, setPremium }}>
            {children}
        </PremiumContext.Provider>
    );
}

export function usePremium() {
    const context = useContext(PremiumContext);
    if (!context) {
        throw new Error('usePremium, PremiumProvider içinde kullanılmalı');
    }
    return context;
}
