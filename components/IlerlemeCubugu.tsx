// ============================================
// İLERLEME ÇUBUĞU COMPONENTİ
// ============================================
// Bu component su içme ilerlemesini görsel olarak gösterir.
// "Reusable Component" örneği - farklı yerlerde kullanılabilir.

import React from 'react';
import { View, StyleSheet } from 'react-native';

// --- PROPS TİPİ ---
// TypeScript ile props'ların tipini tanımlıyoruz
// Bu sayede hangi props'ların gerekli olduğu belli olur
interface IlerlemeCubuguProps {
    yuzde: number;        // 0-100 arası ilerleme yüzdesi
    renk?: string;        // Opsiyonel: çubuk rengi (? = opsiyonel)
    arkaplanRenk?: string; // Opsiyonel: arkaplan rengi
    yukseklik?: number;    // Opsiyonel: çubuk yüksekliği
}

// --- COMPONENT ---
// Props'ları destructuring ile alıyoruz
// Varsayılan değerler = ile atanıyor
export function IlerlemeCubugu({
    yuzde,
    renk = '#4FC3F7',
    arkaplanRenk = '#1565C0',
    yukseklik = 24,
}: IlerlemeCubuguProps) {
    // Yüzdeyi 0-100 arasında sınırla
    const guvenliyYuzde = Math.min(Math.max(yuzde, 0), 100);

    return (
        <View
            style={[
                styles.kutu,
                {
                    backgroundColor: arkaplanRenk,
                    height: yukseklik,
                    borderRadius: yukseklik / 2, // Yüksekliğe göre yuvarlaklık
                }
            ]}
        >
            <View
                style={[
                    styles.cubuk,
                    {
                        width: `${guvenliyYuzde}%`,
                        backgroundColor: renk,
                        borderRadius: yukseklik / 2,
                    }
                ]}
            />
        </View>
    );
}

// --- STİLLER ---
const styles = StyleSheet.create({
    kutu: {
        width: '100%',
        maxWidth: 300,
        overflow: 'hidden', // Çubuk taşmasın
        marginBottom: 15,
    },
    cubuk: {
        height: '100%',
    },
});
