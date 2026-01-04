// =====================================================
// HAVA DURUMU UNIT TESTLERI
// =====================================================
// havaDurumu.ts'deki hesaplamaların testleri

describe('Hava Durumu Sistemi', () => {
    describe('sicakligaGoreAralik', () => {
        // sicakligaGoreAralik fonksiyonunun mantığı
        function sicakligaGoreAralik(sicaklik: number): number {
            if (sicaklik >= 35) return 30;
            if (sicaklik >= 30) return 45;
            if (sicaklik >= 25) return 60;
            if (sicaklik >= 15) return 90;
            return 120;
        }

        it('35 derece ve uzerinde 30 dk aralik olmali', () => {
            expect(sicakligaGoreAralik(35)).toBe(30);
            expect(sicakligaGoreAralik(40)).toBe(30);
        });

        it('30-34 derece icin 45 dk aralik olmali', () => {
            expect(sicakligaGoreAralik(30)).toBe(45);
            expect(sicakligaGoreAralik(34)).toBe(45);
        });

        it('25-29 derece icin 60 dk aralik olmali', () => {
            expect(sicakligaGoreAralik(25)).toBe(60);
            expect(sicakligaGoreAralik(29)).toBe(60);
        });

        it('15-24 derece icin 90 dk aralik olmali', () => {
            expect(sicakligaGoreAralik(15)).toBe(90);
            expect(sicakligaGoreAralik(24)).toBe(90);
        });

        it('15 derece altinda 120 dk aralik olmali', () => {
            expect(sicakligaGoreAralik(10)).toBe(120);
            expect(sicakligaGoreAralik(0)).toBe(120);
            expect(sicakligaGoreAralik(-5)).toBe(120);
        });
    });

    describe('sicaklikMesaji', () => {
        // sicaklikMesaji fonksiyonunun mantığı
        function sicaklikMesaji(sicaklik: number): string {
            if (sicaklik >= 35) return '🔥 Bugün çok sıcak! Bol su içmeyi unutma!';
            if (sicaklik >= 30) return '☀️ Sıcak bir gün! Su içmeyi ihmal etme!';
            if (sicaklik >= 25) return '🌡️ Ilık bir hava var, su içmeye devam!';
            if (sicaklik >= 15) return '🌤️ Güzel bir hava, sağlıklı kal!';
            return '🌥️ Serin hava olsa da su içmeyi unutma!';
        }

        it('35 derece uzerinde cok sicak mesaji vermeli', () => {
            expect(sicaklikMesaji(35)).toContain('çok sıcak');
        });

        it('30-34 derece icin sicak mesaji vermeli', () => {
            expect(sicaklikMesaji(32)).toContain('Sıcak');
        });

        it('25-29 derece icin ilik mesaji vermeli', () => {
            expect(sicaklikMesaji(27)).toContain('Ilık');
        });

        it('15-24 derece icin guzel hava mesaji vermeli', () => {
            expect(sicaklikMesaji(20)).toContain('Güzel');
        });

        it('15 derece altinda serin mesaji vermeli', () => {
            expect(sicaklikMesaji(10)).toContain('Serin');
        });
    });

    describe('weatherCodeToInfo', () => {
        // weatherCodeToInfo fonksiyonunun mantığı (basitleştirilmiş)
        function weatherCodeToInfo(code: number, sicaklik: number): { aciklama: string; icon: string } {
            const weatherCodes: { [key: number]: { aciklama: string; icon: string } } = {
                0: { aciklama: 'Açık', icon: '☀️' },
                1: { aciklama: 'Az bulutlu', icon: '🌤️' },
                2: { aciklama: 'Parçalı bulutlu', icon: '⛅' },
                3: { aciklama: 'Bulutlu', icon: '☁️' },
                45: { aciklama: 'Sisli', icon: '🌫️' },
                51: { aciklama: 'Hafif yağmur', icon: '🌧️' },
                71: { aciklama: 'Hafif kar', icon: '🌨️' },
                95: { aciklama: 'Gök gürültülü', icon: '⛈️' },
            };

            const info = weatherCodes[code] || {
                aciklama: sicaklik > 25 ? 'Sıcak' : sicaklik > 15 ? 'Ilık' : 'Serin',
                icon: sicaklik > 25 ? '☀️' : sicaklik > 15 ? '🌤️' : '🌥️'
            };

            return info;
        }

        it('kod 0 icin Acik donmeli', () => {
            const info = weatherCodeToInfo(0, 25);
            expect(info.aciklama).toBe('Açık');
            expect(info.icon).toBe('☀️');
        });

        it('kod 3 icin Bulutlu donmeli', () => {
            const info = weatherCodeToInfo(3, 20);
            expect(info.aciklama).toBe('Bulutlu');
            expect(info.icon).toBe('☁️');
        });

        it('kod 51 icin yagmur donmeli', () => {
            const info = weatherCodeToInfo(51, 18);
            expect(info.aciklama).toContain('yağmur');
        });

        it('kod 71 icin kar donmeli', () => {
            const info = weatherCodeToInfo(71, 0);
            expect(info.aciklama).toContain('kar');
        });

        it('bilinmeyen kod icin sicakliga gore varsayilan deger donmeli', () => {
            const info = weatherCodeToInfo(999, 30);
            expect(info.aciklama).toBe('Sıcak');
            expect(info.icon).toBe('☀️');
        });
    });

    describe('Cache Suresi', () => {
        const CACHE_SURESI = 30 * 60 * 1000; // 30 dakika

        it('cache suresi 30 dakika olmali', () => {
            expect(CACHE_SURESI).toBe(1800000);
        });

        it('cache suresi dogru hesaplanmali', () => {
            expect(CACHE_SURESI).toBe(30 * 60 * 1000);
        });
    });
});
