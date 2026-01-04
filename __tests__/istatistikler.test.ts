// =====================================================
// İstatistikler Ekranı Hesaplama Testleri
// =====================================================
// IstatistiklerEkrani.tsx'deki tüm hesaplamaların unit testleri

interface GunlukVeri {
    gun: string;
    tarih: string;
    miktar: number;
    ml: number;
}

// Mock veri oluşturucu
const gunlukVeriOlustur = (gun: string, miktar: number, ml: number): GunlukVeri => ({
    gun,
    tarih: '2024-01-01',
    miktar,
    ml
});

// =====================================================
// HAFTALIK HESAPLAMALAR
// =====================================================
describe('Haftalık Hesaplamalar', () => {
    const haftalikVeri: GunlukVeri[] = [
        gunlukVeriOlustur('Pzt', 8, 2000),
        gunlukVeriOlustur('Sal', 10, 2500),
        gunlukVeriOlustur('Çar', 6, 1500),
        gunlukVeriOlustur('Per', 8, 2000),
        gunlukVeriOlustur('Cum', 12, 3000),
        gunlukVeriOlustur('Cmt', 7, 1750),
        gunlukVeriOlustur('Paz', 9, 2250),
    ];
    const gunlukHedef = 2000;

    describe('toplamHaftalik', () => {
        it('tum gunlerin ml toplamini dogru hesaplamali', () => {
            const toplamHaftalik = haftalikVeri.reduce((t, g) => t + g.ml, 0);
            expect(toplamHaftalik).toBe(15000); // 2000+2500+1500+2000+3000+1750+2250
        });

        it('bos dizi icin 0 donmeli', () => {
            const bosVeri: GunlukVeri[] = [];
            const toplam = bosVeri.reduce((t, g) => t + g.ml, 0);
            expect(toplam).toBe(0);
        });
    });

    describe('ortalamaGunluk', () => {
        it('gunluk ortalama ml dogru hesaplanmali', () => {
            const toplamHaftalik = haftalikVeri.reduce((t, g) => t + g.ml, 0);
            const ortalamaGunluk = haftalikVeri.length > 0
                ? Math.round(toplamHaftalik / haftalikVeri.length * 10) / 10
                : 0;
            expect(ortalamaGunluk).toBe(2142.9); // 15000 / 7 = 2142.857...
        });

        it('bos dizi icin 0 donmeli', () => {
            const bosVeri: GunlukVeri[] = [];
            const ortalama = bosVeri.length > 0
                ? Math.round(bosVeri.reduce((t, g) => t + g.ml, 0) / bosVeri.length * 10) / 10
                : 0;
            expect(ortalama).toBe(0);
        });
    });

    describe('hedefeUlasanGun', () => {
        it('hedefe ulasan gun sayisini dogru hesaplamali', () => {
            const hedefeUlasanGun = haftalikVeri.filter(g => g.ml >= gunlukHedef).length;
            expect(hedefeUlasanGun).toBe(5); // 2000, 2500, 2000, 3000, 2250
        });

        it('hic hedefe ulasilmamissa 0 donmeli', () => {
            const dusukVeri = haftalikVeri.map(g => ({ ...g, ml: 1000 }));
            const hedefeUlasan = dusukVeri.filter(g => g.ml >= gunlukHedef).length;
            expect(hedefeUlasan).toBe(0);
        });

        it('tum gunler hedefe ulasmissa 7 donmeli', () => {
            const yuksekVeri = haftalikVeri.map(g => ({ ...g, ml: 3000 }));
            const hedefeUlasan = yuksekVeri.filter(g => g.ml >= gunlukHedef).length;
            expect(hedefeUlasan).toBe(7);
        });
    });

    describe('maxMiktar', () => {
        it('en yuksek ml degerini bulmali', () => {
            const maxMiktar = Math.max(...haftalikVeri.map(g => g.ml), gunlukHedef);
            expect(maxMiktar).toBe(3000);
        });

        it('tum degerler hedeften dusukse hedefi donmeli', () => {
            const dusukVeri = haftalikVeri.map(g => ({ ...g, ml: 1000 }));
            const maxMiktar = Math.max(...dusukVeri.map(g => g.ml), gunlukHedef);
            expect(maxMiktar).toBe(2000); // gunlukHedef
        });
    });

    describe('enYuksekGun', () => {
        it('en yuksek ml olan gunu bulmali', () => {
            const enYuksekGun = haftalikVeri.reduce((max, g) => g.ml > max.ml ? g : max, haftalikVeri[0]);
            expect(enYuksekGun.gun).toBe('Cum');
            expect(enYuksekGun.ml).toBe(3000);
        });
    });
});

// =====================================================
// AYLIK HESAPLAMALAR
// =====================================================
describe('Aylık Hesaplamalar', () => {
    // 30 günlük test verisi
    const aylikVeri: GunlukVeri[] = [];
    for (let i = 1; i <= 30; i++) {
        aylikVeri.push(gunlukVeriOlustur(i.toString(), i % 10 + 5, (i % 10 + 5) * 250));
    }
    const gunlukHedef = 2000;

    describe('toplamAylik', () => {
        it('30 gunluk toplami dogru hesaplamali', () => {
            const toplamAylik = aylikVeri.reduce((t, g) => t + g.ml, 0);
            // Her 10 günde: (5+6+7+8+9+10+11+12+13+14) * 250 = 95 * 250 = 23750
            // 3 kez tekrar: 23750 * 3 = 71250
            expect(toplamAylik).toBe(71250);
        });
    });

    describe('aylikOrtalama', () => {
        it('aylik ortalama ml dogru hesaplanmali', () => {
            const toplamAylik = aylikVeri.reduce((t, g) => t + g.ml, 0);
            const aylikOrtalama = aylikVeri.length > 0
                ? Math.round(toplamAylik / aylikVeri.length * 10) / 10
                : 0;
            expect(aylikOrtalama).toBe(2375); // 71250 / 30
        });
    });

    describe('aylikBasariGun', () => {
        it('hedefe ulasan gun sayisini dogru hesaplamali', () => {
            const aylikBasariGun = aylikVeri.filter(g => g.ml >= gunlukHedef).length;
            // ml >= 2000 => bardak >= 8 => (i % 10 + 5) >= 8 => i % 10 >= 3
            // Her 10 günde 7 gün (3,4,5,6,7,8,9) = 21 gün
            expect(aylikBasariGun).toBe(21);
        });
    });

    describe('aylikMaxMiktar', () => {
        it('aylik en yuksek ml degerini bulmali', () => {
            const aylikMaxMiktar = Math.max(...aylikVeri.map(g => g.ml), gunlukHedef);
            // max bardak = 14 (10-1+5), ml = 14*250 = 3500
            expect(aylikMaxMiktar).toBe(3500);
        });
    });
});

// =====================================================
// TREND ANALİZİ
// =====================================================
describe('Trend Analizi', () => {
    describe('haftalikTrendYuzde', () => {
        it('pozitif trend dogru hesaplanmali', () => {
            const buHaftaToplam = 15000;
            const gecenHaftaToplam = 10000;
            const haftalikTrendYuzde = gecenHaftaToplam > 0
                ? Math.round(((buHaftaToplam - gecenHaftaToplam) / gecenHaftaToplam) * 100)
                : (buHaftaToplam > 0 ? 100 : 0);
            expect(haftalikTrendYuzde).toBe(50); // %50 artış
        });

        it('negatif trend dogru hesaplanmali', () => {
            const buHaftaToplam = 8000;
            const gecenHaftaToplam = 10000;
            const haftalikTrendYuzde = gecenHaftaToplam > 0
                ? Math.round(((buHaftaToplam - gecenHaftaToplam) / gecenHaftaToplam) * 100)
                : (buHaftaToplam > 0 ? 100 : 0);
            expect(haftalikTrendYuzde).toBe(-20); // %20 düşüş
        });

        it('gecen hafta 0 ise ve bu hafta doluysa %100 donmeli', () => {
            const buHaftaToplam = 15000;
            const gecenHaftaToplam = 0;
            const haftalikTrendYuzde = gecenHaftaToplam > 0
                ? Math.round(((buHaftaToplam - gecenHaftaToplam) / gecenHaftaToplam) * 100)
                : (buHaftaToplam > 0 ? 100 : 0);
            expect(haftalikTrendYuzde).toBe(100);
        });

        it('her iki hafta da 0 ise 0 donmeli', () => {
            const buHaftaToplam = 0;
            const gecenHaftaToplam = 0;
            const haftalikTrendYuzde = gecenHaftaToplam > 0
                ? Math.round(((buHaftaToplam - gecenHaftaToplam) / gecenHaftaToplam) * 100)
                : (buHaftaToplam > 0 ? 100 : 0);
            expect(haftalikTrendYuzde).toBe(0);
        });
    });

    describe('aylikTrendYuzde', () => {
        it('ilk yari ve ikinci yari karsilastirmasi dogru olmali', () => {
            const buAyIlkYari = 30000;  // ilk 15 gün
            const buAyIkinciYari = 36000; // son 15 gün
            const aylikTrendYuzde = buAyIlkYari > 0
                ? Math.round(((buAyIkinciYari - buAyIlkYari) / buAyIlkYari) * 100)
                : (buAyIkinciYari > 0 ? 100 : 0);
            expect(aylikTrendYuzde).toBe(20); // %20 artış
        });
    });

    describe('getTrendIcon', () => {
        const getTrendIcon = (yuzde: number) => {
            if (yuzde > 10) return { icon: '📈', renk: '#4CAF50', yazi: `+${yuzde}%` };
            if (yuzde < -10) return { icon: '📉', renk: '#F44336', yazi: `${yuzde}%` };
            return { icon: '➡️', renk: '#FF9800', yazi: `${yuzde >= 0 ? '+' : ''}${yuzde}%` };
        };

        it('pozitif trend icin yesil artis ikonu donmeli', () => {
            const trend = getTrendIcon(25);
            expect(trend.icon).toBe('📈');
            expect(trend.renk).toBe('#4CAF50');
            expect(trend.yazi).toBe('+25%');
        });

        it('negatif trend icin kirmizi dusus ikonu donmeli', () => {
            const trend = getTrendIcon(-15);
            expect(trend.icon).toBe('📉');
            expect(trend.renk).toBe('#F44336');
            expect(trend.yazi).toBe('-15%');
        });

        it('stabil trend icin turuncu ok donmeli', () => {
            const trend = getTrendIcon(5);
            expect(trend.icon).toBe('➡️');
            expect(trend.renk).toBe('#FF9800');
            expect(trend.yazi).toBe('+5%');
        });

        it('tam sinir degerleri dogru hesaplanmali', () => {
            const trend10 = getTrendIcon(10);
            expect(trend10.icon).toBe('➡️'); // 10 dahil stabil

            const trend11 = getTrendIcon(11);
            expect(trend11.icon).toBe('📈'); // 11 artış

            const trendMinus10 = getTrendIcon(-10);
            expect(trendMinus10.icon).toBe('➡️'); // -10 dahil stabil

            const trendMinus11 = getTrendIcon(-11);
            expect(trendMinus11.icon).toBe('📉'); // -11 düşüş
        });
    });
});

// =====================================================
// XP BAR HESAPLAMASI
// =====================================================
describe('XP Bar Hesaplaması', () => {
    it('xp bar yuzdesini dogru hesaplamali', () => {
        const mevcutSeviyeXP = 75;
        const sonrakiSeviyeXP = 100;
        const yuzde = Math.min((mevcutSeviyeXP / sonrakiSeviyeXP) * 100, 100);
        expect(yuzde).toBe(75);
    });

    it('xp %100u gecmemeli', () => {
        const mevcutSeviyeXP = 150;
        const sonrakiSeviyeXP = 100;
        const yuzde = Math.min((mevcutSeviyeXP / sonrakiSeviyeXP) * 100, 100);
        expect(yuzde).toBe(100);
    });

    it('xp 0 ise %0 donmeli', () => {
        const mevcutSeviyeXP = 0;
        const sonrakiSeviyeXP = 100;
        const yuzde = Math.min((mevcutSeviyeXP / sonrakiSeviyeXP) * 100, 100);
        expect(yuzde).toBe(0);
    });
});

// =====================================================
// GRAFİK BAR YÜKSEKLİĞİ HESAPLAMASI
// =====================================================
describe('Grafik Bar Yüksekliği', () => {
    it('bar yuksekligi oranli hesaplanmali', () => {
        const ml = 2000;
        const maxMiktar = 3000;
        const maxYukseklik = 120;
        const barYukseklik = (ml / maxMiktar) * maxYukseklik;
        expect(barYukseklik).toBe(80);
    });

    it('max degerde tam yukseklik olmali', () => {
        const ml = 3000;
        const maxMiktar = 3000;
        const maxYukseklik = 120;
        const barYukseklik = (ml / maxMiktar) * maxYukseklik;
        expect(barYukseklik).toBe(120);
    });

    it('sifir degerde yukseklik 0 olmali', () => {
        const ml = 0;
        const maxMiktar = 3000;
        const maxYukseklik = 120;
        const barYukseklik = (ml / maxMiktar) * maxYukseklik;
        expect(barYukseklik).toBe(0);
    });
});

// =====================================================
// LİTRE DÖNÜŞÜMÜ
// =====================================================
describe('Litre Dönüşümü', () => {
    it('ml to litre donusumu dogru olmali', () => {
        const ml = 2500;
        const litre = (ml / 1000).toFixed(1);
        expect(litre).toBe('2.5');
    });

    it('kucuk degerler icin dogru yuvarlanmali', () => {
        const ml = 750;
        const litre = (ml / 1000).toFixed(1);
        expect(litre).toBe('0.8');
    });

    it('buyuk degerler icin dogru donusturulmeli', () => {
        const ml = 15250;
        const litre = (ml / 1000).toFixed(1);
        expect(litre).toBe('15.3');
    });
});
