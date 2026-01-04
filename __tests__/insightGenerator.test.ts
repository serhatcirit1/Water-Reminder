// =====================================================
// INSIGHT GENERATOR UNIT TESTLERI
// =====================================================
// AI içgörü sistemi hesaplamalarının testleri

describe('Insight Generator Hesaplamalari', () => {
    // Test yardımcı fonksiyonları

    describe('Saat Bloğu Analizi', () => {
        function saatBloguBelirle(saat: number): string {
            if (saat >= 6 && saat < 10) return '06:00-10:00';
            else if (saat >= 10 && saat < 14) return '10:00-14:00';
            else if (saat >= 14 && saat < 18) return '14:00-18:00';
            else if (saat >= 18 && saat < 22) return '18:00-22:00';
            return 'gece';
        }

        it('sabah saatlerini dogru bloğa atamalı', () => {
            expect(saatBloguBelirle(6)).toBe('06:00-10:00');
            expect(saatBloguBelirle(9)).toBe('06:00-10:00');
        });

        it('öğle saatlerini dogru bloğa atamalı', () => {
            expect(saatBloguBelirle(10)).toBe('10:00-14:00');
            expect(saatBloguBelirle(13)).toBe('10:00-14:00');
        });

        it('öğleden sonra dogru bloğa atamalı', () => {
            expect(saatBloguBelirle(14)).toBe('14:00-18:00');
            expect(saatBloguBelirle(17)).toBe('14:00-18:00');
        });

        it('akşam saatlerini dogru bloğa atamalı', () => {
            expect(saatBloguBelirle(18)).toBe('18:00-22:00');
            expect(saatBloguBelirle(21)).toBe('18:00-22:00');
        });

        it('gece saatlerini gece olarak atamalı', () => {
            expect(saatBloguBelirle(0)).toBe('gece');
            expect(saatBloguBelirle(5)).toBe('gece');
            expect(saatBloguBelirle(23)).toBe('gece');
        });
    });

    describe('Hafta Sonu Karşılaştırması', () => {
        function haftaSonuMu(gun: number): boolean {
            return gun === 0 || gun === 6;
        }

        it('Pazar gunu hafta sonu olmalı', () => {
            expect(haftaSonuMu(0)).toBe(true);
        });

        it('Cumartesi gunu hafta sonu olmalı', () => {
            expect(haftaSonuMu(6)).toBe(true);
        });

        it('hafta içi gunler hafta sonu olmamalı', () => {
            expect(haftaSonuMu(1)).toBe(false);
            expect(haftaSonuMu(2)).toBe(false);
            expect(haftaSonuMu(3)).toBe(false);
            expect(haftaSonuMu(4)).toBe(false);
            expect(haftaSonuMu(5)).toBe(false);
        });
    });

    describe('Yuzde Fark Hesapları', () => {
        function yuzdeFarkHesapla(ortalama: number, deger: number): number {
            if (ortalama === 0) return 0;
            return Math.round(((ortalama - deger) / ortalama) * 100);
        }

        it('dusuk deger icin pozitif yuzde donmeli', () => {
            expect(yuzdeFarkHesapla(100, 70)).toBe(30);
        });

        it('yuksek deger icin negatif yuzde donmeli', () => {
            expect(yuzdeFarkHesapla(100, 130)).toBe(-30);
        });

        it('esit degerler icin 0 donmeli', () => {
            expect(yuzdeFarkHesapla(100, 100)).toBe(0);
        });

        it('ortalama 0 ise 0 donmeli', () => {
            expect(yuzdeFarkHesapla(0, 50)).toBe(0);
        });
    });

    describe('Gun Adları', () => {
        const gunAdlari = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

        it('7 gun olmalı', () => {
            expect(gunAdlari.length).toBe(7);
        });

        it('Pazar 0. index olmalı', () => {
            expect(gunAdlari[0]).toBe('Pazar');
        });

        it('Cumartesi 6. index olmalı', () => {
            expect(gunAdlari[6]).toBe('Cumartesi');
        });
    });

    describe('Oncelik Sıralama', () => {
        type Oncelik = 'yuksek' | 'orta' | 'dusuk';

        function oncelikSirala(a: Oncelik, b: Oncelik): number {
            const oncelikSira = { yuksek: 0, orta: 1, dusuk: 2 };
            return oncelikSira[a] - oncelikSira[b];
        }

        it('yuksek oncelik once gelmeli', () => {
            expect(oncelikSirala('yuksek', 'orta')).toBeLessThan(0);
            expect(oncelikSirala('yuksek', 'dusuk')).toBeLessThan(0);
        });

        it('orta oncelik dusukten once gelmeli', () => {
            expect(oncelikSirala('orta', 'dusuk')).toBeLessThan(0);
        });

        it('ayni oncelikler esit olmali', () => {
            expect(oncelikSirala('yuksek', 'yuksek')).toBe(0);
            expect(oncelikSirala('orta', 'orta')).toBe(0);
        });
    });

    describe('Veri Yeterliliği Kontrolü', () => {
        function veriYeterliMi(kayitSayisi: number, minimumGerekli: number): boolean {
            return kayitSayisi >= minimumGerekli;
        }

        it('kayit sayisi yeterliyse true donmeli', () => {
            expect(veriYeterliMi(20, 20)).toBe(true);
            expect(veriYeterliMi(30, 20)).toBe(true);
        });

        it('kayit sayisi yetersizse false donmeli', () => {
            expect(veriYeterliMi(15, 20)).toBe(false);
            expect(veriYeterliMi(0, 20)).toBe(false);
        });
    });

    describe('İcgoru Kategorileri', () => {
        const kategoriler = ['zaman', 'gun', 'performans', 'oneri'];

        it('4 kategori olmali', () => {
            expect(kategoriler.length).toBe(4);
        });

        it('tum kategoriler tanimli olmali', () => {
            expect(kategoriler).toContain('zaman');
            expect(kategoriler).toContain('gun');
            expect(kategoriler).toContain('performans');
            expect(kategoriler).toContain('oneri');
        });
    });
});
