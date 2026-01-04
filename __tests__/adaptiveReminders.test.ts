// =====================================================
// ADAPTIVE REMINDERS UNIT TESTLERI
// =====================================================
// Akıllı hatırlatma sistemi hesaplamalarının testleri

describe('Adaptive Reminders Hesaplamalari', () => {
    describe('Tepki Oranı Hesabı', () => {
        function tepkiOraniHesapla(tepkili: number, toplam: number): number {
            if (toplam === 0) return 0;
            return Math.round((tepkili / toplam) * 100);
        }

        it('tum tepkiler pozitifse %100 olmali', () => {
            expect(tepkiOraniHesapla(10, 10)).toBe(100);
        });

        it('yarisinda tepki varsa %50 olmali', () => {
            expect(tepkiOraniHesapla(5, 10)).toBe(50);
        });

        it('hic tepki yoksa %0 olmali', () => {
            expect(tepkiOraniHesapla(0, 10)).toBe(0);
        });

        it('veri yoksa %0 donmeli', () => {
            expect(tepkiOraniHesapla(0, 0)).toBe(0);
        });
    });

    describe('Öğrenme Yüzdesi', () => {
        function ogrenmeYuzdesiHesapla(veriSayisi: number): number {
            return Math.min(100, Math.round((veriSayisi / 30) * 100));
        }

        it('30 veri icin %100 olmali', () => {
            expect(ogrenmeYuzdesiHesapla(30)).toBe(100);
        });

        it('15 veri icin %50 olmali', () => {
            expect(ogrenmeYuzdesiHesapla(15)).toBe(50);
        });

        it('60 veri icin de %100 olmali (max)', () => {
            expect(ogrenmeYuzdesiHesapla(60)).toBe(100);
        });

        it('0 veri icin %0 olmali', () => {
            expect(ogrenmeYuzdesiHesapla(0)).toBe(0);
        });
    });

    describe('Optimal Saat Seçimi', () => {
        function enIyiSaatleriSec(
            saatOranlar: { saat: number; oran: number }[]
        ): number[] {
            return saatOranlar
                .filter(s => s.oran >= 0.3)
                .sort((a, b) => b.oran - a.oran)
                .slice(0, 4)
                .map(s => s.saat);
        }

        it('yuksek oranli saatleri secmeli', () => {
            const veriler = [
                { saat: 9, oran: 0.8 },
                { saat: 12, oran: 0.6 },
                { saat: 15, oran: 0.4 },
                { saat: 18, oran: 0.2 }, // %30 altinda
            ];
            expect(enIyiSaatleriSec(veriler)).toEqual([9, 12, 15]);
        });

        it('en fazla 4 saat secmeli', () => {
            const veriler = [
                { saat: 8, oran: 0.9 },
                { saat: 9, oran: 0.85 },
                { saat: 10, oran: 0.8 },
                { saat: 11, oran: 0.75 },
                { saat: 12, oran: 0.7 },
            ];
            expect(enIyiSaatleriSec(veriler)).toHaveLength(4);
        });

        it('dusuk oranli saatleri elemeli', () => {
            const veriler = [
                { saat: 9, oran: 0.1 },
                { saat: 12, oran: 0.2 },
            ];
            expect(enIyiSaatleriSec(veriler)).toEqual([]);
        });
    });

    describe('Kaçınılacak Saatler', () => {
        function kacinilacakSaatleriSec(
            saatOranlar: { saat: number; oran: number }[]
        ): number[] {
            return saatOranlar
                .filter(s => s.oran < 0.1)
                .map(s => s.saat);
        }

        it('dusuk oranli saatleri secmeli', () => {
            const veriler = [
                { saat: 9, oran: 0.05 },
                { saat: 12, oran: 0.5 },
                { saat: 15, oran: 0.02 },
            ];
            expect(kacinilacakSaatleriSec(veriler)).toEqual([9, 15]);
        });

        it('yuksek oranli saatleri dahil etmemeli', () => {
            const veriler = [
                { saat: 9, oran: 0.8 },
                { saat: 12, oran: 0.6 },
            ];
            expect(kacinilacakSaatleriSec(veriler)).toEqual([]);
        });
    });

    describe('Sonraki Optimal Saat', () => {
        function sonrakiOptimalSaatBul(
            optimalSaatler: number[],
            suankiSaat: number
        ): number | null {
            const sirali = optimalSaatler.sort((a, b) => a - b);
            for (const saat of sirali) {
                if (saat > suankiSaat) {
                    return saat;
                }
            }
            return null; // Bugun icin uygun saat yok
        }

        it('sonraki uygun saati bulmali', () => {
            expect(sonrakiOptimalSaatBul([9, 12, 15, 18], 10)).toBe(12);
        });

        it('ilk saati gecmisse 2. saati donmeli', () => {
            expect(sonrakiOptimalSaatBul([9, 12, 15, 18], 9)).toBe(12);
        });

        it('tum saatler gecmisse null donmeli', () => {
            expect(sonrakiOptimalSaatBul([9, 12, 15, 18], 20)).toBeNull();
        });
    });

    describe('30 Dakika Kontrol', () => {
        function otuzDakikaIcindeMi(
            bildirimZamani: number,
            suAnkiZaman: number
        ): boolean {
            const fark = suAnkiZaman - bildirimZamani;
            return fark >= 0 && fark <= 30 * 60 * 1000;
        }

        it('10 dakika icinde true donmeli', () => {
            const simdi = Date.now();
            const onDakikaOnce = simdi - 10 * 60 * 1000;
            expect(otuzDakikaIcindeMi(onDakikaOnce, simdi)).toBe(true);
        });

        it('40 dakika oncesi false donmeli', () => {
            const simdi = Date.now();
            const kirkDakikaOnce = simdi - 40 * 60 * 1000;
            expect(otuzDakikaIcindeMi(kirkDakikaOnce, simdi)).toBe(false);
        });

        it('tam 30 dakika true donmeli', () => {
            const simdi = Date.now();
            const otuzDakikaOnce = simdi - 30 * 60 * 1000;
            expect(otuzDakikaIcindeMi(otuzDakikaOnce, simdi)).toBe(true);
        });
    });

    describe('Mesaj Durumu', () => {
        function mesajUret(ogrenmeYuzdesi: number, tepkiOrani: number): string {
            if (ogrenmeYuzdesi < 30) {
                return 'ogreniyor';
            } else if (tepkiOrani >= 70) {
                return 'harika';
            } else if (tepkiOrani >= 40) {
                return 'buluyor';
            } else {
                return 'optimize';
            }
        }

        it('az veriyle ogreniyor mesaji vermeli', () => {
            expect(mesajUret(20, 50)).toBe('ogreniyor');
        });

        it('yuksek tepki oraninda harika mesaji vermeli', () => {
            expect(mesajUret(100, 80)).toBe('harika');
        });

        it('orta tepki oraninda buluyor mesaji vermeli', () => {
            expect(mesajUret(100, 50)).toBe('buluyor');
        });

        it('dusuk tepki oraninda optimize mesaji vermeli', () => {
            expect(mesajUret(100, 20)).toBe('optimize');
        });
    });
});
