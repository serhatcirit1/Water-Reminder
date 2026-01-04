// =====================================================
// TREND FORECASTING UNIT TESTLERI
// =====================================================
// Haftalık tahmin hesaplamalarının testleri

describe('Trend Forecasting Hesaplamalari', () => {
    const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    describe('Gun Adları', () => {
        it('7 gun adı olmalı', () => {
            expect(GUN_ADLARI.length).toBe(7);
        });

        it('Pazar index 0 olmalı', () => {
            expect(GUN_ADLARI[0]).toBe('Pazar');
        });

        it('Cumartesi index 6 olmalı', () => {
            expect(GUN_ADLARI[6]).toBe('Cumartesi');
        });
    });

    describe('Haftalık Hedef Hesabı', () => {
        it('günlük hedefin 7 katı olmalı', () => {
            const gunlukHedef = 2000;
            const haftalikHedef = gunlukHedef * 7;
            expect(haftalikHedef).toBe(14000);
        });
    });

    describe('Geçen Gün Sayısı', () => {
        // Pazar = 0, bu yüzden +1
        function gecenGunSayisi(bugunGun: number): number {
            return bugunGun + 1;
        }

        it('Pazar için 1 gün geçmiş olmalı', () => {
            expect(gecenGunSayisi(0)).toBe(1);
        });

        it('Çarşamba için 4 gün geçmiş olmalı', () => {
            expect(gecenGunSayisi(3)).toBe(4);
        });

        it('Cumartesi için 7 gün geçmiş olmalı', () => {
            expect(gecenGunSayisi(6)).toBe(7);
        });
    });

    describe('Kalan Gün Sayısı', () => {
        function kalanGunSayisi(bugunGun: number): number {
            const gecen = bugunGun + 1;
            return 7 - gecen;
        }

        it('Pazar için 6 gün kalmalı', () => {
            expect(kalanGunSayisi(0)).toBe(6);
        });

        it('Perşembe için 2 gün kalmalı', () => {
            expect(kalanGunSayisi(4)).toBe(2);
        });

        it('Cumartesi için 0 gün kalmalı', () => {
            expect(kalanGunSayisi(6)).toBe(0);
        });
    });

    describe('Günlük Ortalama Hesabı', () => {
        function gunlukOrtalama(toplam: number, gunSayisi: number): number {
            if (gunSayisi === 0) return 0;
            return Math.round(toplam / gunSayisi);
        }

        it('10000ml 5 güne bölünürse 2000 olmalı', () => {
            expect(gunlukOrtalama(10000, 5)).toBe(2000);
        });

        it('0 gün için 0 dönmeli', () => {
            expect(gunlukOrtalama(5000, 0)).toBe(0);
        });
    });

    describe('Tamamlanma Olasılığı', () => {
        function tamamlanmaOlasiligi(tahminiToplam: number, hedef: number): number {
            return Math.min(100, Math.round((tahminiToplam / hedef) * 100));
        }

        it('hedef aşılırsa 100 olmalı', () => {
            expect(tamamlanmaOlasiligi(15000, 14000)).toBe(100);
        });

        it('yarı tamamlanmışsa 50 olmalı', () => {
            expect(tamamlanmaOlasiligi(7000, 14000)).toBe(50);
        });

        it('hiç içilmemişse 0 olmalı', () => {
            expect(tamamlanmaOlasiligi(0, 14000)).toBe(0);
        });
    });

    describe('Tamamlanma Günü Hesabı', () => {
        function tamamlanmaGunuHesapla(
            bugunGun: number,
            kalanMl: number,
            gunlukOrtalama: number
        ): string | null {
            if (gunlukOrtalama <= 0) return null;

            const kalanGunTahmini = Math.ceil(kalanMl / gunlukOrtalama);
            const kalanGun = 7 - (bugunGun + 1);

            if (kalanGunTahmini <= kalanGun) {
                const tamamlanmaGunIndex = (bugunGun + kalanGunTahmini) % 7;
                return GUN_ADLARI[tamamlanmaGunIndex];
            }
            return null; // Bu hafta tamamlanamayacak
        }

        it('Pazartesi 2 gün sonra tamamlanacaksa Çarşamba olmalı', () => {
            // Pazartesi = 1, 2 gün sonra = index 3 = Çarşamba
            expect(tamamlanmaGunuHesapla(1, 4000, 2000)).toBe('Çarşamba');
        });

        it('günlük ortalama 0 ise null dönmeli', () => {
            expect(tamamlanmaGunuHesapla(1, 4000, 0)).toBe(null);
        });

        it('bu hafta tamamlanamayacaksa null dönmeli', () => {
            // Cuma = 5, sadece 1 gün kalıyor (Cumartesi)
            // 10000ml kaldı, günlük 2000 = 5 gün gerekli
            expect(tamamlanmaGunuHesapla(5, 10000, 2000)).toBe(null);
        });
    });

    describe('Gelecek Hafta Tahmini', () => {
        function basariOraniHesapla(ortMl: number, gunlukHedef: number): number {
            const haftalikHedef = gunlukHedef * 7;
            const tahminiHaftalik = ortMl * 7;
            return Math.round((tahminiHaftalik / haftalikHedef) * 100);
        }

        it('ortalama hedefin üstündeyse 100+ olmalı', () => {
            expect(basariOraniHesapla(2500, 2000)).toBeGreaterThan(100);
        });

        it('ortalama hedefin altındaysa 100den az olmalı', () => {
            expect(basariOraniHesapla(1500, 2000)).toBeLessThan(100);
        });

        it('ortalama hedefle aynıysa 100 olmalı', () => {
            expect(basariOraniHesapla(2000, 2000)).toBe(100);
        });
    });
});
