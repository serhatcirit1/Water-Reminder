// ============================================
// TEMA CONTEXT - Açık/Koyu Mod
// ============================================
// Uygulama genelinde tema yönetimi

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TEMA TİPLERİ ---
export type TemaModu = 'acik' | 'koyu';

export interface TemaRenkleri {
    arkaplan: string;
    kartArkaplan: string;
    vurgu: string;
    vurguAcik: string;
    metin: string;
    metinSoluk: string;
    sinir: string;
}

// --- RENK PALETLERİ ---
const RENKLER: { acik: TemaRenkleri; koyu: TemaRenkleri } = {
    koyu: {
        arkaplan: '#15202B',
        kartArkaplan: '#134156ff',
        vurgu: '#134156ff',
        vurguAcik: '#81D4FA',
        metin: '#FFFFFF',
        metinSoluk: '#90CAF9',
        sinir: '#1976D2',
    },
    acik: {
        arkaplan: '#0D47A1',
        kartArkaplan: '#1565C0',
        vurgu: '#1976D2',
        vurguAcik: '#42A5F5',
        metin: '#0D47A1',
        metinSoluk: '#5472D3',
        sinir: '#90CAF9',
    },
};

// --- CONTEXT ---
interface TemaContextType {
    mod: TemaModu;
    renkler: TemaRenkleri;
    modDegistir: (yeniMod: TemaModu) => void;
    koyuMu: boolean;
}

const TemaContext = createContext<TemaContextType | undefined>(undefined);

// --- STORAGE KEY ---
const TEMA_MOD_KEY = '@tema_mod';

// --- PROVIDER ---
interface TemaProviderProps {
    children: ReactNode;
}

export function TemaProvider({ children }: TemaProviderProps) {
    const [mod, setMod] = useState<TemaModu>('koyu');

    // İlk yükleme
    useEffect(() => {
        temaYukle();
    }, []);

    const temaYukle = async () => {
        try {
            const kayitliMod = await AsyncStorage.getItem(TEMA_MOD_KEY);
            if (kayitliMod) setMod(kayitliMod as TemaModu);
        } catch (hata) {
            console.error('Tema yüklenemedi:', hata);
        }
    };

    const modDegistir = async (yeniMod: TemaModu) => {
        setMod(yeniMod);
        await AsyncStorage.setItem(TEMA_MOD_KEY, yeniMod);
    };

    const renkler = RENKLER[mod];
    const koyuMu = mod === 'koyu';

    return (
        <TemaContext.Provider value={{ mod, renkler, modDegistir, koyuMu }}>
            {children}
        </TemaContext.Provider>
    );
}

// --- HOOK ---
export function useTema() {
    const context = useContext(TemaContext);
    if (!context) {
        throw new Error('useTema, TemaProvider içinde kullanılmalı');
    }
    return context;
}
