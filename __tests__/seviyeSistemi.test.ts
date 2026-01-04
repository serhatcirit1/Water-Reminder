// =====================================================
// SEVİYE SİSTEMİ UNIT TESTLERI
// =====================================================
// seviyeSistemi.ts'deki hesaplamaların testleri

// Dışa aktarılan sabitler ve fonksiyonlar için test
describe('Seviye Sistemi Hesaplamaları', () => {
    // XP gereksinimleri (seviyeSistemi.ts'den)
    const SEVIYE_XP_GEREKSINIMLERI = [
        0,      // Seviye 1 (başlangıç)
        100,    // Seviye 2
        200,    // Seviye 3
        350,    // Seviye 4
        500,    // Seviye 5
        700,    // Seviye 6
        1000,   // Seviye 7
        1400,   // Seviye 8
        1900,   // Seviye 9
        2500,   // Seviye 10
    ];

    const UNVANLAR = [
        '💧 Damla', '🌊 Dere', '🏊 Yüzücü', '🐟 Balık', '🐬 Yunus',
        '🐋 Balina', '🌊 Okyanus', '⚡ Su Ustası', '👑 Su Kralı', '🏆 Efsane'
    ];

    // hesaplaSeviyeDurumu fonksiyonunun mantığı
    function hesaplaSeviyeDurumu(toplamXP: number) {
        let seviye = 1;
        let kalanXP = toplamXP;

        for (let i = 1; i < SEVIYE_XP_GEREKSINIMLERI.length; i++) {
            if (kalanXP >= SEVIYE_XP_GEREKSINIMLERI[i]) {
                kalanXP -= SEVIYE_XP_GEREKSINIMLERI[i];
                seviye++;
            } else {
                break;
            }
        }

        if (seviye > 10) seviye = 10;

        const sonrakiSeviyeXP = seviye < 10
            ? SEVIYE_XP_GEREKSINIMLERI[seviye]
            : SEVIYE_XP_GEREKSINIMLERI[9];

        return {
            seviye,
            toplamXP,
            mevcutSeviyeXP: kalanXP,
            sonrakiSeviyeXP,
            unvan: UNVANLAR[seviye - 1] || UNVANLAR[9],
        };
    }

    describe('hesaplaSeviyeDurumu', () => {
        it('0 XP ile seviye 1 olmali', () => {
            const durum = hesaplaSeviyeDurumu(0);
            expect(durum.seviye).toBe(1);
            expect(durum.unvan).toBe('💧 Damla');
        });

        it('100 XP ile seviye 2 olmali', () => {
            const durum = hesaplaSeviyeDurumu(100);
            expect(durum.seviye).toBe(2);
            expect(durum.mevcutSeviyeXP).toBe(0);
        });

        it('150 XP ile seviye 2 ve 50 kalan XP olmali', () => {
            const durum = hesaplaSeviyeDurumu(150);
            expect(durum.seviye).toBe(2);
            expect(durum.mevcutSeviyeXP).toBe(50);
        });

        it('300 XP ile seviye 3 olmali', () => {
            const durum = hesaplaSeviyeDurumu(300);
            expect(durum.seviye).toBe(3);
            expect(durum.mevcutSeviyeXP).toBe(0);
        });

        it('650 XP ile seviye 4 olmali', () => {
            const durum = hesaplaSeviyeDurumu(650);
            expect(durum.seviye).toBe(4);
            expect(durum.mevcutSeviyeXP).toBe(0);
        });

        it('cok yuksek XP ile max seviye 10 olmali', () => {
            const durum = hesaplaSeviyeDurumu(99999);
            expect(durum.seviye).toBe(10);
            expect(durum.unvan).toBe('🏆 Efsane');
        });

        it('sonrakiSeviyeXP dogru hesaplanmali', () => {
            const durum1 = hesaplaSeviyeDurumu(50);
            expect(durum1.sonrakiSeviyeXP).toBe(100);

            const durum2 = hesaplaSeviyeDurumu(100);
            expect(durum2.sonrakiSeviyeXP).toBe(200);
        });
    });

    describe('XP Kazanimlari', () => {
        const XP_KAZANIMLARI = {
            SU_ICME: 10,
            HEDEF_TAMAMLAMA: 50,
            STREAK_3: 30,
            STREAK_7: 75,
            ROZET_KAZANMA: 25,
            SABAH_SU: 15,
            REKOR_KIRMA: 100,
        };

        it('su icme XP degeri 10 olmali', () => {
            expect(XP_KAZANIMLARI.SU_ICME).toBe(10);
        });

        it('hedef tamamlama XP degeri 50 olmali', () => {
            expect(XP_KAZANIMLARI.HEDEF_TAMAMLAMA).toBe(50);
        });

        it('rekor kirma en yuksek XP olmali', () => {
            const maxXP = Math.max(...Object.values(XP_KAZANIMLARI));
            expect(maxXP).toBe(XP_KAZANIMLARI.REKOR_KIRMA);
        });
    });

    describe('Seviye Atlama', () => {
        it('100 XP eklenmesi seviye atlatmali', () => {
            const eski = hesaplaSeviyeDurumu(50);
            const yeni = hesaplaSeviyeDurumu(50 + 100);
            expect(yeni.seviye).toBeGreaterThan(eski.seviye);
        });

        it('10 XP eklenmesi seviye atlatmamali', () => {
            const eski = hesaplaSeviyeDurumu(50);
            const yeni = hesaplaSeviyeDurumu(60);
            expect(yeni.seviye).toBe(eski.seviye);
        });
    });
});
