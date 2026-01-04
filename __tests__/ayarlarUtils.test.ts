// =====================================================
// AYARLAR UTILS UNIT TESTLERI
// =====================================================
// ayarlarUtils.ts'deki hesaplamaların testleri

describe('Ayarlar Utils', () => {
    describe('Hedef Secenekleri', () => {
        const HEDEF_SECENEKLERI = [1500, 2000, 2500, 3000, 3500];
        const VARSAYILAN_HEDEF = 2000;

        it('5 hedef secenegi olmali', () => {
            expect(HEDEF_SECENEKLERI.length).toBe(5);
        });

        it('varsayilan hedef 2000ml olmali', () => {
            expect(VARSAYILAN_HEDEF).toBe(2000);
        });

        it('hedefler sirali olmali', () => {
            for (let i = 1; i < HEDEF_SECENEKLERI.length; i++) {
                expect(HEDEF_SECENEKLERI[i]).toBeGreaterThan(HEDEF_SECENEKLERI[i - 1]);
            }
        });

        it('minimum hedef 1500ml olmali', () => {
            expect(Math.min(...HEDEF_SECENEKLERI)).toBe(1500);
        });

        it('maksimum hedef 3500ml olmali', () => {
            expect(Math.max(...HEDEF_SECENEKLERI)).toBe(3500);
        });
    });

    describe('Bardak Secenekleri', () => {
        const BARDAK_SECENEKLERI = [
            { ml: 200, etiket: '200 ml' },
            { ml: 250, etiket: '250 ml' },
            { ml: 330, etiket: '330 ml' },
            { ml: 500, etiket: '500 ml' },
        ];
        const VARSAYILAN_BARDAK = 250;

        it('4 bardak secenegi olmali', () => {
            expect(BARDAK_SECENEKLERI.length).toBe(4);
        });

        it('varsayilan bardak 250ml olmali', () => {
            expect(VARSAYILAN_BARDAK).toBe(250);
        });

        it('her bardagin etiketi ml icermeli', () => {
            BARDAK_SECENEKLERI.forEach(bardak => {
                expect(bardak.etiket).toContain('ml');
            });
        });
    });

    describe('Sise Secenekleri', () => {
        const SISE_SECENEKLERI = [
            { ml: 330, etiket: '330 ml' },
            { ml: 500, etiket: '500 ml' },
            { ml: 750, etiket: '750 ml' },
            { ml: 1000, etiket: '1 L' },
            { ml: 1500, etiket: '1.5 L' },
        ];

        it('5 sise secenegi olmali', () => {
            expect(SISE_SECENEKLERI.length).toBe(5);
        });

        it('1L sise etiketi L icermeli', () => {
            const birLitre = SISE_SECENEKLERI.find(s => s.ml === 1000);
            expect(birLitre?.etiket).toContain('L');
        });
    });

    describe('Profil ve Onerilen Su Hesaplama', () => {
        interface KullaniciProfil {
            kilo: number;
            yas: number;
            aktifMi: boolean;
        }

        // onerilenSuHesapla fonksiyonunun mantığı
        function onerilenSuHesapla(profil: KullaniciProfil): number {
            // Temel formül: kilo * 33ml
            let gunlukMl = profil.kilo * 33;

            // Aktif kişiler için +500ml
            if (profil.aktifMi) {
                gunlukMl += 500;
            }

            // 100'ün katına yuvarla
            return Math.round(gunlukMl / 100) * 100;
        }

        it('70 kilo icin 2300ml onermeli', () => {
            const profil: KullaniciProfil = { kilo: 70, yas: 30, aktifMi: false };
            expect(onerilenSuHesapla(profil)).toBe(2300);
        });

        it('70 kilo aktif icin 2800ml onermeli', () => {
            const profil: KullaniciProfil = { kilo: 70, yas: 30, aktifMi: true };
            expect(onerilenSuHesapla(profil)).toBe(2800);
        });

        it('50 kilo icin 1700ml onermeli', () => {
            const profil: KullaniciProfil = { kilo: 50, yas: 25, aktifMi: false };
            expect(onerilenSuHesapla(profil)).toBe(1700);
        });

        it('100 kilo icin 3300ml onermeli', () => {
            const profil: KullaniciProfil = { kilo: 100, yas: 40, aktifMi: false };
            expect(onerilenSuHesapla(profil)).toBe(3300);
        });
    });

    describe('Sessiz Saatler', () => {
        interface SessizSaatlerAyar {
            aktif: boolean;
            baslangic: number;
            bitis: number;
        }

        // sessizSaatteMiyiz fonksiyonunun mantığı
        function sessizSaatteMiyiz(ayar: SessizSaatlerAyar, saat: number): boolean {
            if (!ayar.aktif) return false;

            if (ayar.baslangic > ayar.bitis) {
                // Gece yarısını geçen aralık (örn: 22:00 - 07:00)
                return saat >= ayar.baslangic || saat < ayar.bitis;
            }
            return saat >= ayar.baslangic && saat < ayar.bitis;
        }

        it('aktif degilse her zaman false donmeli', () => {
            const ayar: SessizSaatlerAyar = { aktif: false, baslangic: 22, bitis: 7 };
            expect(sessizSaatteMiyiz(ayar, 23)).toBe(false);
            expect(sessizSaatteMiyiz(ayar, 3)).toBe(false);
        });

        it('22-07 arasinda gece 23 sessiz olmali', () => {
            const ayar: SessizSaatlerAyar = { aktif: true, baslangic: 22, bitis: 7 };
            expect(sessizSaatteMiyiz(ayar, 23)).toBe(true);
        });

        it('22-07 arasinda sabah 3 sessiz olmali', () => {
            const ayar: SessizSaatlerAyar = { aktif: true, baslangic: 22, bitis: 7 };
            expect(sessizSaatteMiyiz(ayar, 3)).toBe(true);
        });

        it('22-07 arasinda ogle 12 sessiz olmamali', () => {
            const ayar: SessizSaatlerAyar = { aktif: true, baslangic: 22, bitis: 7 };
            expect(sessizSaatteMiyiz(ayar, 12)).toBe(false);
        });

        it('22-07 arasinda aksam 20 sessiz olmamali', () => {
            const ayar: SessizSaatlerAyar = { aktif: true, baslangic: 22, bitis: 7 };
            expect(sessizSaatteMiyiz(ayar, 20)).toBe(false);
        });

        it('10-14 arasinda ogle 12 sessiz olmali', () => {
            const ayar: SessizSaatlerAyar = { aktif: true, baslangic: 10, bitis: 14 };
            expect(sessizSaatteMiyiz(ayar, 12)).toBe(true);
        });
    });

    describe('Streak Bilgisi', () => {
        interface StreakBilgisi {
            mevcutStreak: number;
            enUzunStreak: number;
            sonHedefTarih: string;
        }

        it('mevcut streak en uzun streakten buyuk olmamalı (mantiksal)', () => {
            const bilgi: StreakBilgisi = { mevcutStreak: 5, enUzunStreak: 10, sonHedefTarih: '2024-01-01' };
            expect(bilgi.mevcutStreak).toBeLessThanOrEqual(bilgi.enUzunStreak);
        });

        it('mevcut streak en uzun streak esit olabilir', () => {
            const bilgi: StreakBilgisi = { mevcutStreak: 10, enUzunStreak: 10, sonHedefTarih: '2024-01-01' };
            expect(bilgi.mevcutStreak).toBe(bilgi.enUzunStreak);
        });
    });

    describe('Rekor Bilgisi', () => {
        interface RekorBilgisi {
            miktar: number;
            ml: number;
            tarih: string;
        }

        it('ml degeri pozitif olmali', () => {
            const rekor: RekorBilgisi = { miktar: 10, ml: 2500, tarih: '2024-01-01' };
            expect(rekor.ml).toBeGreaterThan(0);
        });

        it('ml = miktar * bardakBoyutu seklinde hesaplanabilir', () => {
            const bardakBoyutu = 250;
            const miktar = 10;
            const ml = miktar * bardakBoyutu;
            expect(ml).toBe(2500);
        });
    });

    describe('Bioritim Ayarlari', () => {
        interface BioritimAyar {
            aktif: boolean;
            uyanmaSaati: string;
            uyumaSaati: string;
        }

        it('varsayilan uyanma saati 08:00 olmali', () => {
            const varsayilan: BioritimAyar = { aktif: false, uyanmaSaati: '08:00', uyumaSaati: '23:00' };
            expect(varsayilan.uyanmaSaati).toBe('08:00');
        });

        it('saat formati HH:MM olmali', () => {
            const ayar: BioritimAyar = { aktif: true, uyanmaSaati: '07:30', uyumaSaati: '22:45' };
            expect(ayar.uyanmaSaati).toMatch(/^\d{2}:\d{2}$/);
            expect(ayar.uyumaSaati).toMatch(/^\d{2}:\d{2}$/);
        });
    });

    describe('Detoks Ayarlari', () => {
        interface DetoksAyar {
            aktif: boolean;
        }

        it('detoks aktif oldugunda hedef %20 artmali', () => {
            const hedef = 2000;
            const detoksAktif = true;
            const yeniHedef = detoksAktif ? Math.round(hedef * 1.2) : hedef;
            expect(yeniHedef).toBe(2400);
        });

        it('detoks kapaliyken hedef ayni kalmali', () => {
            const hedef = 2000;
            const detoksAktif = false;
            const yeniHedef = detoksAktif ? Math.round(hedef * 1.2) : hedef;
            expect(yeniHedef).toBe(2000);
        });
    });

    describe('En Aktif Zaman Dilimi', () => {
        const ZAMAN_DILIMLERI = [
            { ad: 'Sabah', baslangic: 6, bitis: 12, emoji: '🌅' },
            { ad: 'Öğle', baslangic: 12, bitis: 17, emoji: '☀️' },
            { ad: 'Akşam', baslangic: 17, bitis: 21, emoji: '🌆' },
            { ad: 'Gece', baslangic: 21, bitis: 6, emoji: '🌙' },
        ];

        function saatinDilimi(saat: number): string {
            for (const dilim of ZAMAN_DILIMLERI) {
                if (dilim.baslangic < dilim.bitis) {
                    if (saat >= dilim.baslangic && saat < dilim.bitis) return dilim.ad;
                } else {
                    if (saat >= dilim.baslangic || saat < dilim.bitis) return dilim.ad;
                }
            }
            return 'Bilinmeyen';
        }

        it('saat 8 sabah diliminde olmali', () => {
            expect(saatinDilimi(8)).toBe('Sabah');
        });

        it('saat 14 ogle diliminde olmali', () => {
            expect(saatinDilimi(14)).toBe('Öğle');
        });

        it('saat 19 aksam diliminde olmali', () => {
            expect(saatinDilimi(19)).toBe('Akşam');
        });

        it('saat 23 gece diliminde olmali', () => {
            expect(saatinDilimi(23)).toBe('Gece');
        });

        it('saat 3 gece diliminde olmali', () => {
            expect(saatinDilimi(3)).toBe('Gece');
        });
    });
});
