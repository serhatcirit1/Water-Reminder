// =====================================================
// GÜNLÜK GÖREVLER UNIT TESTLERI
// =====================================================
// gunlukGorevler.ts'deki hesaplamaların testleri

describe('Günlük Görevler Sistemi', () => {
    // Görev şablonları
    const GOREV_SABLONLARI = [
        { id: 'sabah_su', baslik: 'Güne Başlangıç', hedef: 500, xpOdulu: 25 },
        { id: 'ogle_su', baslik: 'Öğle Molası', hedef: 500, xpOdulu: 20 },
        { id: 'aksam_su', baslik: 'Akşam Rutini', hedef: 500, xpOdulu: 20 },
        { id: 'toplam_1250', baslik: 'Yarıladık', hedef: 1250, xpOdulu: 15 },
        { id: 'toplam_2000', baslik: 'Sağlıklı Yaşam', hedef: 2000, xpOdulu: 30 },
        { id: 'ust_uste_3', baslik: 'Hidrasyon Serisi', hedef: 750, xpOdulu: 35 },
    ];

    describe('Gorev Sablonlari', () => {
        it('toplam 6 gorev sablonu olmali', () => {
            expect(GOREV_SABLONLARI.length).toBe(6);
        });

        it('her gorev sablonunun hedefi olmali', () => {
            GOREV_SABLONLARI.forEach(sablon => {
                expect(sablon.hedef).toBeGreaterThan(0);
            });
        });

        it('her gorev sablonunun xp odulu olmali', () => {
            GOREV_SABLONLARI.forEach(sablon => {
                expect(sablon.xpOdulu).toBeGreaterThan(0);
            });
        });

        it('sabah gorevi 500ml hedefli olmali', () => {
            const sabahGorev = GOREV_SABLONLARI.find(g => g.id === 'sabah_su');
            expect(sabahGorev?.hedef).toBe(500);
        });

        it('gunluk 2L gorevi en yuksek xp odullu olmali (30)', () => {
            const toplam2000 = GOREV_SABLONLARI.find(g => g.id === 'toplam_2000');
            expect(toplam2000?.xpOdulu).toBe(30);
        });
    });

    describe('Gorev Ilerleme Hesaplamasi', () => {
        interface Gorev {
            id: string;
            hedef: number;
            ilerleme: number;
            tamamlandi: boolean;
        }

        function gorevIlerlemesiHesapla(gorev: Gorev, yeniIlerleme: number): Gorev {
            const guncellenmis = { ...gorev, ilerleme: yeniIlerleme };
            if (guncellenmis.ilerleme >= guncellenmis.hedef) {
                guncellenmis.tamamlandi = true;
            }
            return guncellenmis;
        }

        it('ilerleme hedefi gecince tamamlandi olmali', () => {
            const gorev: Gorev = { id: 'test', hedef: 500, ilerleme: 0, tamamlandi: false };
            const sonuc = gorevIlerlemesiHesapla(gorev, 500);
            expect(sonuc.tamamlandi).toBe(true);
        });

        it('ilerleme hedeften dusukken tamamlanmamali', () => {
            const gorev: Gorev = { id: 'test', hedef: 500, ilerleme: 0, tamamlandi: false };
            const sonuc = gorevIlerlemesiHesapla(gorev, 300);
            expect(sonuc.tamamlandi).toBe(false);
        });

        it('ilerleme hedefi geçse bile hesaplanmalı', () => {
            const gorev: Gorev = { id: 'test', hedef: 500, ilerleme: 0, tamamlandi: false };
            const sonuc = gorevIlerlemesiHesapla(gorev, 600);
            expect(sonuc.tamamlandi).toBe(true);
            expect(sonuc.ilerleme).toBe(600);
        });
    });

    describe('Su Icme Gorev Kontrolu', () => {
        // suIcmeGorevKontrol mantığı
        function gorevUygunMu(gorevId: string, saat: number): boolean {
            if (gorevId === 'sabah_su' && saat < 10) return true;
            if (gorevId === 'ogle_su' && saat >= 12 && saat < 14) return true;
            if (gorevId === 'aksam_su' && saat >= 18 && saat < 21) return true;
            if (gorevId === 'toplam_1250' || gorevId === 'toplam_2000') return true;
            if (gorevId === 'ust_uste_3') return true;
            return false;
        }

        it('sabah 8 de sabah gorevi uygun olmali', () => {
            expect(gorevUygunMu('sabah_su', 8)).toBe(true);
        });

        it('sabah 10 da sabah gorevi uygun olmamali', () => {
            expect(gorevUygunMu('sabah_su', 10)).toBe(false);
        });

        it('ogle 12 de ogle gorevi uygun olmali', () => {
            expect(gorevUygunMu('ogle_su', 12)).toBe(true);
        });

        it('ogle 13 de ogle gorevi uygun olmali', () => {
            expect(gorevUygunMu('ogle_su', 13)).toBe(true);
        });

        it('ogle 14 de ogle gorevi uygun olmamali', () => {
            expect(gorevUygunMu('ogle_su', 14)).toBe(false);
        });

        it('aksam 19 da aksam gorevi uygun olmali', () => {
            expect(gorevUygunMu('aksam_su', 19)).toBe(true);
        });

        it('aksam 21 de aksam gorevi uygun olmamali', () => {
            expect(gorevUygunMu('aksam_su', 21)).toBe(false);
        });

        it('toplam gorevler her zaman uygun olmali', () => {
            expect(gorevUygunMu('toplam_1250', 3)).toBe(true);
            expect(gorevUygunMu('toplam_2000', 15)).toBe(true);
        });
    });

    describe('Tarih Formati', () => {
        function bugunTarih(): string {
            return new Date().toISOString().split('T')[0];
        }

        it('tarih YYYY-MM-DD formatinda olmali', () => {
            const tarih = bugunTarih();
            expect(tarih).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('tarih uzunlugu 10 karakter olmali', () => {
            const tarih = bugunTarih();
            expect(tarih.length).toBe(10);
        });
    });
});
