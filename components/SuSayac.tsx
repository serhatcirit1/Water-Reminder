// ============================================
// SU SAYAÇ COMPONENTİ
// ============================================
// Ana sayaç ekranı: emoji, başlık, sayaç ve butonlar
// Props ile dışarıdan veri ve fonksiyon alıyor

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IlerlemeCubugu } from './IlerlemeCubugu';

// --- PROPS TİPİ ---
interface SuSayacProps {
    suSayaci: number;
    gunlukHedef: number;
    onSuIc: () => void;      // Callback fonksiyonu (void döner)
    onSifirla: () => void;
}

// --- COMPONENT ---
export function SuSayac({
    suSayaci,
    gunlukHedef,
    onSuIc,
    onSifirla,
}: SuSayacProps) {
    // İlerleme hesaplama
    const ilerlemeYuzdesi = Math.min((suSayaci / gunlukHedef) * 100, 100);
    const hedefeUlasti = suSayaci >= gunlukHedef;

    return (
        <View style={styles.container}>
            {/* Başlık */}
            <Text style={styles.emoji}>💧</Text>
            <Text style={styles.baslik}>Su İç!</Text>
            <Text style={styles.altBaslik}>Sağlıklı kal, su içmeyi unutma</Text>

            {/* İlerleme Çubuğu - Ayrı component! */}
            <IlerlemeCubugu yuzde={ilerlemeYuzdesi} />

            {/* Sayaç */}
            <Text style={styles.sayac}>
                {suSayaci} / {gunlukHedef} bardak
            </Text>
            <Text style={styles.yuzde}>
                %{Math.round(ilerlemeYuzdesi)} tamamlandı
            </Text>

            {/* Su İç Butonu */}
            <TouchableOpacity style={styles.suButonu} onPress={onSuIc}>
                <Text style={styles.suButonuYazi}>💧 Su İçtim!</Text>
            </TouchableOpacity>

            {/* Sıfırla Butonu */}
            <TouchableOpacity style={styles.sifirlaButonu} onPress={onSifirla}>
                <Text style={styles.sifirlaButonuYazi}>🔄 Sıfırla</Text>
            </TouchableOpacity>

            {/* Kutlama Mesajı - Sadece hedefe ulaşılınca göster */}
            {hedefeUlasti && (
                <Text style={styles.kutlama}>
                    🎉 Tebrikler! Günlük hedefe ulaştın!
                </Text>
            )}
        </View>
    );
}

// --- STİLLER ---
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 30,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 10,
    },
    baslik: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
    },
    altBaslik: {
        fontSize: 16,
        color: '#90CAF9',
        marginBottom: 30,
    },
    sayac: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
    },
    yuzde: {
        fontSize: 16,
        color: '#90CAF9',
        marginBottom: 30,
    },
    suButonu: {
        backgroundColor: '#4FC3F7',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    suButonuYazi: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0D47A1',
    },
    sifirlaButonu: {
        backgroundColor: 'transparent',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#90CAF9',
    },
    sifirlaButonuYazi: {
        fontSize: 16,
        color: '#90CAF9',
    },
    kutlama: {
        marginTop: 30,
        fontSize: 18,
        color: '#FFD54F',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
