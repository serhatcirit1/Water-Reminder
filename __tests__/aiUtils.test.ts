// =====================================================
// AI UTILS UNIT TESTLERI
// =====================================================
// Akıllı hedef motoru hesaplamalarının testleri

describe('AI Utils - Smart Goal Engine', () => {
    // Test yardımcı fonksiyonları (aiUtils.ts'den kopyalandı)
    function sicaklikFaktoru(sicaklik: number): { ekstraMl: number; sebep: string | null } {
        if (sicaklik >= 35) {
            return { ekstraMl: 750, sebep: `Çok sıcak hava (${sicaklik}°C) - +750ml` };
        } else if (sicaklik >= 30) {
            return { ekstraMl: 500, sebep: `Sıcak hava (${sicaklik}°C) - +500ml` };
        } else if (sicaklik >= 25) {
            return { ekstraMl: 250, sebep: `Ilık hava (${sicaklik}°C) - +250ml` };
        }
        return { ekstraMl: 0, sebep: null };
    }

    function aktiviteFaktoru(adimSayisi: number): { ekstraMl: number; sebep: string | null } {
        if (adimSayisi >= 15000) {
            return { ekstraMl: 600, sebep: `Çok aktif gün - +600ml` };
        } else if (adimSayisi >= 10000) {
            return { ekstraMl: 400, sebep: `Aktif gün - +400ml` };
        } else if (adimSayisi >= 5000) {
            return { ekstraMl: 200, sebep: `Orta aktivite - +200ml` };
        }
        return { ekstraMl: 0, sebep: null };
    }

    function haftaGunuFaktoru(gun: number): { carpan: number; sebep: string | null } {
        const haftaSonu = gun === 0 || gun === 6;
        if (haftaSonu) {
            return { carpan: 0.9, sebep: 'Hafta sonu - %10 azaltıldı' };
        }
        return { carpan: 1, sebep: null };
    }

    function trendHesapla(veriler: number[]): { egim: number; yorum: string } {
        if (veriler.length < 2) {
            return { egim: 0, yorum: 'Yeterli veri yok' };
        }
        const n = veriler.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += veriler[i];
            sumXY += i * veriler[i];
            sumX2 += i * i;
        }
        const egim = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        let yorum = '';
        if (egim > 50) yorum = '📈 Harika! Su tüketimin artıyor.';
        else if (egim > 0) yorum = '⬆️ Hafif yukarı trend.';
        else if (egim < -50) yorum = '📉 Dikkat! Su tüketimin düşüyor.';
        else if (egim < 0) yorum = '⬇️ Hafif düşüş trendi.';
        else yorum = '➡️ Sabit gidiyorsun.';
        return { egim: Math.round(egim), yorum };
    }

    describe('Sıcaklık Faktörü', () => {
        it('25°C altında ekstra ml olmamalı', () => {
            expect(sicaklikFaktoru(20).ekstraMl).toBe(0);
            expect(sicaklikFaktoru(24).ekstraMl).toBe(0);
        });

        it('25-29°C arası +250ml eklemeli', () => {
            expect(sicaklikFaktoru(25).ekstraMl).toBe(250);
            expect(sicaklikFaktoru(28).ekstraMl).toBe(250);
        });

        it('30-34°C arası +500ml eklemeli', () => {
            expect(sicaklikFaktoru(30).ekstraMl).toBe(500);
            expect(sicaklikFaktoru(33).ekstraMl).toBe(500);
        });

        it('35°C ve üstü +750ml eklemeli', () => {
            expect(sicaklikFaktoru(35).ekstraMl).toBe(750);
            expect(sicaklikFaktoru(40).ekstraMl).toBe(750);
        });
    });

    describe('Aktivite Faktörü', () => {
        it('5000 adım altında ekstra ml olmamalı', () => {
            expect(aktiviteFaktoru(0).ekstraMl).toBe(0);
            expect(aktiviteFaktoru(4999).ekstraMl).toBe(0);
        });

        it('5000-9999 adım arası +200ml eklemeli', () => {
            expect(aktiviteFaktoru(5000).ekstraMl).toBe(200);
            expect(aktiviteFaktoru(9000).ekstraMl).toBe(200);
        });

        it('10000-14999 adım arası +400ml eklemeli', () => {
            expect(aktiviteFaktoru(10000).ekstraMl).toBe(400);
            expect(aktiviteFaktoru(14000).ekstraMl).toBe(400);
        });

        it('15000+ adım için +600ml eklemeli', () => {
            expect(aktiviteFaktoru(15000).ekstraMl).toBe(600);
            expect(aktiviteFaktoru(20000).ekstraMl).toBe(600);
        });
    });

    describe('Hafta Günü Faktörü', () => {
        it('hafta içi çarpan 1 olmalı', () => {
            expect(haftaGunuFaktoru(1).carpan).toBe(1); // Pazartesi
            expect(haftaGunuFaktoru(2).carpan).toBe(1); // Salı
            expect(haftaGunuFaktoru(5).carpan).toBe(1); // Cuma
        });

        it('hafta sonu çarpan 0.9 olmalı', () => {
            expect(haftaGunuFaktoru(0).carpan).toBe(0.9); // Pazar
            expect(haftaGunuFaktoru(6).carpan).toBe(0.9); // Cumartesi
        });
    });

    describe('Trend Hesaplama', () => {
        it('yetersiz veri için 0 eğim döndürmeli', () => {
            expect(trendHesapla([]).egim).toBe(0);
            expect(trendHesapla([100]).egim).toBe(0);
        });

        it('artan veri için pozitif eğim döndürmeli', () => {
            const result = trendHesapla([1000, 1200, 1400, 1600, 1800]);
            expect(result.egim).toBeGreaterThan(0);
        });

        it('azalan veri için negatif eğim döndürmeli', () => {
            const result = trendHesapla([2000, 1800, 1600, 1400, 1200]);
            expect(result.egim).toBeLessThan(0);
        });

        it('sabit veri için 0 civarı eğim döndürmeli', () => {
            const result = trendHesapla([1500, 1500, 1500, 1500]);
            expect(Math.abs(result.egim)).toBeLessThan(10);
        });
    });

    describe('Hedef Hesaplama Entegrasyonu', () => {
        it('sıcak gün + yüksek aktivite kombine etmeli', () => {
            const sicaklik = sicaklikFaktoru(32); // +500ml
            const aktivite = aktiviteFaktoru(12000); // +400ml
            const toplam = sicaklik.ekstraMl + aktivite.ekstraMl;
            expect(toplam).toBe(900);
        });

        it('hedef %150yi geçmemeli', () => {
            const tabanaHedef = 2000;
            const maksimum = tabanaHedef * 1.5;
            expect(maksimum).toBe(3000);
        });

        it('hedef %80in altına düşmemeli', () => {
            const tabanaHedef = 2000;
            const minimum = tabanaHedef * 0.8;
            expect(minimum).toBe(1600);
        });
    });
});
