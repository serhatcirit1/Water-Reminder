// ============================================
// TEMA CONTEXT - Açık/Koyu Mod
// ============================================
// Uygulama genelinde tema yönetimi

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TEMA TİPLERİ ---
export type TemaModu = 'acik' | 'koyu' | 'altin' | 'okyanus' | 'zumrut' | 'midnight';

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
const RENKLER: Record<TemaModu, TemaRenkleri> = {
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
    altin: {
        arkaplan: '#000000',
        kartArkaplan: '#1A1A1A',
        vurgu: '#FFD700',
        vurguAcik: '#FFC107',
        metin: '#FFFFFF',
        metinSoluk: '#BDBDBD',
        sinir: '#FFD700',
    },
    okyanus: {
        arkaplan: '#002B36',
        kartArkaplan: '#073642',
        vurgu: '#2AA198',
        vurguAcik: '#26A69A',
        metin: '#EEE8D5',
        metinSoluk: '#93A1A1',
        sinir: '#2AA198',
    },
    zumrut: {
        arkaplan: '#062E1A',
        kartArkaplan: '#0C4A2D',
        vurgu: '#2ECC71',
        vurguAcik: '#27AE60',
        metin: '#E0F2F1',
        metinSoluk: '#81C784',
        sinir: '#2ECC71',
    },
    midnight: {
        arkaplan: '#0A0E14',
        kartArkaplan: '#151B24',
        vurgu: '#BB86FC',
        vurguAcik: '#CF6679',
        metin: '#E1E1E1',
        metinSoluk: '#757575',
        sinir: '#1F2937',
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
