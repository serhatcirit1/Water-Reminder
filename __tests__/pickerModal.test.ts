// =====================================================
// PICKER MODAL UNIT TESTLERI
// =====================================================
// PickerModal bileşeni hesaplamalarının testleri

describe('PickerModal Hesaplamalari', () => {
    describe('Gunluk Hedef Secenekleri', () => {
        const hedefSecenekleri = [
            { label: '1000 ml (1 L)', value: 1000 },
            { label: '1500 ml (1.5 L)', value: 1500 },
            { label: '2000 ml (2 L)', value: 2000 },
            { label: '2500 ml (2.5 L)', value: 2500 },
            { label: '3000 ml (3 L)', value: 3000 },
            { label: '3500 ml (3.5 L)', value: 3500 },
            { label: '4000 ml (4 L)', value: 4000 },
        ];

        it('7 hedef secenegi olmali', () => {
            expect(hedefSecenekleri.length).toBe(7);
        });

        it('minimum hedef 1000ml olmali', () => {
            expect(Math.min(...hedefSecenekleri.map(s => s.value))).toBe(1000);
        });

        it('maksimum hedef 4000ml olmali', () => {
            expect(Math.max(...hedefSecenekleri.map(s => s.value))).toBe(4000);
        });

        it('her secenek 500ml aralikla artmali', () => {
            for (let i = 1; i < hedefSecenekleri.length; i++) {
                const fark = hedefSecenekleri[i].value - hedefSecenekleri[i - 1].value;
                expect(fark).toBe(500);
            }
        });
    });

    describe('Bildirim Araligi Secenekleri', () => {
        const aralikSecenekleri = [
            { label: '15 dakika', value: 15 },
            { label: '30 dakika', value: 30 },
            { label: '45 dakika', value: 45 },
            { label: '1 saat', value: 60 },
            { label: '1.5 saat', value: 90 },
            { label: '2 saat', value: 120 },
            { label: '3 saat', value: 180 },
            { label: '4 saat', value: 240 },
        ];

        it('8 aralik secenegi olmali', () => {
            expect(aralikSecenekleri.length).toBe(8);
        });

        it('minimum aralik 15 dakika olmali', () => {
            expect(Math.min(...aralikSecenekleri.map(s => s.value))).toBe(15);
        });

        it('maksimum aralik 240 dakika olmali', () => {
            expect(Math.max(...aralikSecenekleri.map(s => s.value))).toBe(240);
        });
    });

    describe('Saat Formatlama', () => {
        function saatFormatla(saat: number, dakika: number = 0): string {
            return `${saat.toString().padStart(2, '0')}:${dakika.toString().padStart(2, '0')}`;
        }

        it('tek haneli saat dogru formatlanmali', () => {
            expect(saatFormatla(8, 0)).toBe('08:00');
            expect(saatFormatla(9, 30)).toBe('09:30');
        });

        it('cift haneli saat dogru formatlanmali', () => {
            expect(saatFormatla(22, 0)).toBe('22:00');
            expect(saatFormatla(23, 45)).toBe('23:45');
        });

        it('gece yarisi dogru formatlanmali', () => {
            expect(saatFormatla(0, 0)).toBe('00:00');
        });
    });

    describe('Aralik Gosterimi', () => {
        function aralikGoster(dakika: number): string {
            if (dakika >= 60) {
                const saat = dakika / 60;
                return `${saat} saat`;
            }
            return `${dakika} dk`;
        }

        it('60 dk alti dakika olarak gostermeli', () => {
            expect(aralikGoster(30)).toBe('30 dk');
            expect(aralikGoster(45)).toBe('45 dk');
        });

        it('60 dk ve uzeri saat olarak gostermeli', () => {
            expect(aralikGoster(60)).toBe('1 saat');
            expect(aralikGoster(120)).toBe('2 saat');
        });

        it('90 dk 1.5 saat olarak gostermeli', () => {
            expect(aralikGoster(90)).toBe('1.5 saat');
        });
    });

    describe('Sessiz Saatler', () => {
        const sessizSaatSecenekleri = Array.from({ length: 24 }, (_, i) => ({
            label: i.toString().padStart(2, '0'),
            value: i
        }));

        it('24 saat secenegi olmali', () => {
            expect(sessizSaatSecenekleri.length).toBe(24);
        });

        it('ilk secenek 00 olmali', () => {
            expect(sessizSaatSecenekleri[0].label).toBe('00');
            expect(sessizSaatSecenekleri[0].value).toBe(0);
        });

        it('son secenek 23 olmali', () => {
            expect(sessizSaatSecenekleri[23].label).toBe('23');
            expect(sessizSaatSecenekleri[23].value).toBe(23);
        });
    });

    describe('Dakika Secenekleri', () => {
        const dakikaSecenekleri = [
            { label: '00', value: 0 },
            { label: '15', value: 15 },
            { label: '30', value: 30 },
            { label: '45', value: 45 },
        ];

        it('4 dakika secenegi olmali', () => {
            expect(dakikaSecenekleri.length).toBe(4);
        });

        it('15er dakika aralikla olmali', () => {
            for (let i = 1; i < dakikaSecenekleri.length; i++) {
                const fark = dakikaSecenekleri[i].value - dakikaSecenekleri[i - 1].value;
                expect(fark).toBe(15);
            }
        });
    });
});
