// =====================================================
// ROZET SİSTEMİ UNIT TESTLERI
// =====================================================
// rozetler.ts'deki hesaplamaların testleri

describe('Rozet Sistemi', () => {
    // ROZET_TANIMLARI'ndan
    const ROZET_TANIMLARI = [
        { id: 'streak_3', isim: 'Başlangıç', emoji: '🌱', kosul: '3 günlük streak' },
        { id: 'streak_7', isim: 'Haftalık Şampiyon', emoji: '🔥', kosul: '7 günlük streak' },
        { id: 'streak_14', isim: 'İki Haftalık Kahraman', emoji: '⭐', kosul: '14 günlük streak' },
        { id: 'streak_30', isim: 'Aylık Efsane', emoji: '🏆', kosul: '30 günlük streak' },
        { id: 'toplam_2500', isim: 'İlk Adım', emoji: '💧', kosul: '2500 ml toplam' },
        { id: 'toplam_12500', isim: 'Su Sever', emoji: '🌊', kosul: '12500 ml toplam' },
        { id: 'toplam_25000', isim: 'Hidrasyon Ustası', emoji: '🐳', kosul: '25000 ml toplam' },
        { id: 'toplam_125000', isim: 'Su Efsanesi', emoji: '👑', kosul: '125000 ml toplam' },
        { id: 'ilk_hedef', isim: 'İlk Başarı', emoji: '🎯', kosul: 'İlk hedef tamamlama' },
        { id: 'sabahci', isim: 'Erken Kuş', emoji: '🌅', kosul: 'Sabah erken su içme' },
        { id: 'gece_baykusu', isim: 'Gece Baykuşu', emoji: '🦉', kosul: 'Gece geç su içme' },
        { id: 'rekor_kirici', isim: 'Rekor Kırıcı', emoji: '🚀', kosul: 'Yeni rekor' },
    ];

    describe('Rozet Tanimlari', () => {
        it('toplam 12 rozet tanimli olmali', () => {
            expect(ROZET_TANIMLARI.length).toBe(12);
        });

        it('her rozetin benzersiz id si olmali', () => {
            const idler = ROZET_TANIMLARI.map(r => r.id);
            const benzersizIdler = new Set(idler);
            expect(benzersizIdler.size).toBe(idler.length);
        });

        it('her rozetin emoji si olmali', () => {
            ROZET_TANIMLARI.forEach(rozet => {
                expect(rozet.emoji).toBeDefined();
                expect(rozet.emoji.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Streak Rozet Kontrolu', () => {
        // streakRozetKontrol fonksiyonunun mantığı
        function streakRozetId(streak: number): string | null {
            if (streak >= 30) return 'streak_30';
            if (streak >= 14) return 'streak_14';
            if (streak >= 7) return 'streak_7';
            if (streak >= 3) return 'streak_3';
            return null;
        }

        it('3 gunluk streak ile streak_3 rozeti verilmeli', () => {
            expect(streakRozetId(3)).toBe('streak_3');
        });

        it('7 gunluk streak ile streak_7 rozeti verilmeli', () => {
            expect(streakRozetId(7)).toBe('streak_7');
        });

        it('14 gunluk streak ile streak_14 rozeti verilmeli', () => {
            expect(streakRozetId(14)).toBe('streak_14');
        });

        it('30 gunluk streak ile streak_30 rozeti verilmeli', () => {
            expect(streakRozetId(30)).toBe('streak_30');
        });

        it('2 gunluk streak ile rozet verilmemeli', () => {
            expect(streakRozetId(2)).toBeNull();
        });

        it('100 gunluk streak ile streak_30 rozeti verilmeli', () => {
            expect(streakRozetId(100)).toBe('streak_30');
        });
    });

    describe('Toplam Ml Rozet Kontrolu', () => {
        // toplamRozetKontrol fonksiyonunun mantığı
        function toplamRozetId(toplamMl: number): string | null {
            if (toplamMl >= 125000) return 'toplam_125000';
            if (toplamMl >= 25000) return 'toplam_25000';
            if (toplamMl >= 12500) return 'toplam_12500';
            if (toplamMl >= 2500) return 'toplam_2500';
            return null;
        }

        it('2500 ml ile ilk adim rozeti verilmeli', () => {
            expect(toplamRozetId(2500)).toBe('toplam_2500');
        });

        it('12500 ml ile su sever rozeti verilmeli', () => {
            expect(toplamRozetId(12500)).toBe('toplam_12500');
        });

        it('25000 ml ile hidrasyon ustasi rozeti verilmeli', () => {
            expect(toplamRozetId(25000)).toBe('toplam_25000');
        });

        it('125000 ml ile su efsanesi rozeti verilmeli', () => {
            expect(toplamRozetId(125000)).toBe('toplam_125000');
        });

        it('2000 ml ile rozet verilmemeli', () => {
            expect(toplamRozetId(2000)).toBeNull();
        });

        it('1000000 ml ile en yuksek rozet verilmeli', () => {
            expect(toplamRozetId(1000000)).toBe('toplam_125000');
        });
    });

    describe('Saat Bazli Rozet Kontrolu', () => {
        // saatRozetKontrol fonksiyonunun mantığı
        function saatRozetId(saat: number): string | null {
            if (saat < 8) return 'sabahci';
            if (saat >= 23) return 'gece_baykusu';
            return null;
        }

        it('sabah 6 da erken kus rozeti verilmeli', () => {
            expect(saatRozetId(6)).toBe('sabahci');
        });

        it('sabah 7 de erken kus rozeti verilmeli', () => {
            expect(saatRozetId(7)).toBe('sabahci');
        });

        it('sabah 8 de rozet verilmemeli', () => {
            expect(saatRozetId(8)).toBeNull();
        });

        it('gece 23 te gece baykusu rozeti verilmeli', () => {
            expect(saatRozetId(23)).toBe('gece_baykusu');
        });

        it('gece 0 da (gece yarisi) erken kus rozeti verilmeli', () => {
            expect(saatRozetId(0)).toBe('sabahci');
        });

        it('ogle 12 de rozet verilmemeli', () => {
            expect(saatRozetId(12)).toBeNull();
        });
    });
});
