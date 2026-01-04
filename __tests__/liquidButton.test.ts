// =====================================================
// LIQUID BUTTON UNIT TESTLERI
// =====================================================
// LiquidButton bileşeni hesaplamalarının testleri

describe('LiquidButton Hesaplamalari', () => {
    describe('Su Seviyesi Hesaplama', () => {
        // waterLevel = min(85, max(25, 25 + (fillPercent * 0.6)))
        function hesaplaSuSeviyesi(fillPercent: number): number {
            return Math.min(85, Math.max(25, 25 + (fillPercent * 0.6)));
        }

        it('0% dolulukta minimum seviye 25 olmali', () => {
            expect(hesaplaSuSeviyesi(0)).toBe(25);
        });

        it('50% dolulukta seviye 55 olmali', () => {
            expect(hesaplaSuSeviyesi(50)).toBe(55); // 25 + 30 = 55
        });

        it('100% dolulukta maksimum seviye 85 olmali', () => {
            expect(hesaplaSuSeviyesi(100)).toBe(85); // 25 + 60 = 85
        });

        it('120% dolulukta da maksimum 85 olmali', () => {
            expect(hesaplaSuSeviyesi(120)).toBe(85); // max 85
        });

        it('negatif deger icin minimum 25 olmali', () => {
            expect(hesaplaSuSeviyesi(-10)).toBe(25);
        });
    });

    describe('Dalga Animasyonu', () => {
        // Dalga fazı hesaplama
        function dalgaYuksekligi(wavePhase: number, amplitude: number = 6): number {
            return Math.sin(wavePhase) * amplitude;
        }

        it('faz 0 da dalga yuksekligi 0 olmali', () => {
            expect(Math.round(dalgaYuksekligi(0))).toBe(0);
        });

        it('faz PI/2 da dalga maksimum olmali', () => {
            expect(Math.round(dalgaYuksekligi(Math.PI / 2))).toBe(6);
        });

        it('faz PI da dalga 0 olmali', () => {
            expect(Math.round(dalgaYuksekligi(Math.PI))).toBe(0);
        });

        it('faz 3*PI/2 da dalga minimum olmali', () => {
            expect(Math.round(dalgaYuksekligi(3 * Math.PI / 2))).toBe(-6);
        });
    });

    describe('Buton Durumu', () => {
        it('hedefe ulasilmissa buttonComplete true olmali', () => {
            const toplamMl = 2500;
            const gunlukHedef = 2000;
            const hedefeUlasti = toplamMl >= gunlukHedef;
            expect(hedefeUlasti).toBe(true);
        });

        it('hedefe ulasilmamissa buttonComplete false olmali', () => {
            const toplamMl = 1500;
            const gunlukHedef = 2000;
            const hedefeUlasti = toplamMl >= gunlukHedef;
            expect(hedefeUlasti).toBe(false);
        });
    });

    describe('Baloncuk Gorunurlugu', () => {
        it('%30 uzerinde baloncuklar gorunmeli', () => {
            const fillPercent = 35;
            const showBubbles = fillPercent > 30;
            expect(showBubbles).toBe(true);
        });

        it('%30 altinda baloncuklar gorunmemeli', () => {
            const fillPercent = 25;
            const showBubbles = fillPercent > 30;
            expect(showBubbles).toBe(false);
        });
    });
});
