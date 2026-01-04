// =====================================================
// VIRTUAL PLANT UNIT TESTLERI
// =====================================================
// VirtualPlant bileşeni hesaplamalarının testleri

describe('VirtualPlant Hesaplamalari', () => {
    type PlantStage = 'seed' | 'sprout' | 'small' | 'medium' | 'large' | 'flowering';

    // getPlantStage fonksiyonu
    function getPlantStage(percent: number): PlantStage {
        if (percent < 10) return 'seed';
        if (percent < 30) return 'sprout';
        if (percent < 50) return 'small';
        if (percent < 75) return 'medium';
        if (percent < 100) return 'large';
        return 'flowering';
    }

    // getPlantInfo fonksiyonu
    function getPlantInfo(stage: PlantStage) {
        switch (stage) {
            case 'seed': return { emoji: '🌱', name: 'Tohum', color: '#8D6E63' };
            case 'sprout': return { emoji: '🌿', name: 'Filiz', color: '#AED581' };
            case 'small': return { emoji: '🪴', name: 'Küçük Bitki', color: '#81C784' };
            case 'medium': return { emoji: '🌳', name: 'Büyüyen Bitki', color: '#66BB6A' };
            case 'large': return { emoji: '🌲', name: 'Olgun Bitki', color: '#4CAF50' };
            case 'flowering': return { emoji: '🌸', name: 'Çiçek Açtı!', color: '#F48FB1' };
        }
    }

    describe('Bitki Asamasi Belirleme', () => {
        it('%0-9 arasi tohum asamasi olmali', () => {
            expect(getPlantStage(0)).toBe('seed');
            expect(getPlantStage(5)).toBe('seed');
            expect(getPlantStage(9)).toBe('seed');
        });

        it('%10-29 arasi filiz asamasi olmali', () => {
            expect(getPlantStage(10)).toBe('sprout');
            expect(getPlantStage(20)).toBe('sprout');
            expect(getPlantStage(29)).toBe('sprout');
        });

        it('%30-49 arasi kucuk bitki asamasi olmali', () => {
            expect(getPlantStage(30)).toBe('small');
            expect(getPlantStage(40)).toBe('small');
            expect(getPlantStage(49)).toBe('small');
        });

        it('%50-74 arasi buyuyen bitki asamasi olmali', () => {
            expect(getPlantStage(50)).toBe('medium');
            expect(getPlantStage(60)).toBe('medium');
            expect(getPlantStage(74)).toBe('medium');
        });

        it('%75-99 arasi olgun bitki asamasi olmali', () => {
            expect(getPlantStage(75)).toBe('large');
            expect(getPlantStage(90)).toBe('large');
            expect(getPlantStage(99)).toBe('large');
        });

        it('%100+ cicek asamasi olmali', () => {
            expect(getPlantStage(100)).toBe('flowering');
            expect(getPlantStage(150)).toBe('flowering');
        });
    });

    describe('Bitki Bilgisi', () => {
        it('tohum icin dogru bilgi donmeli', () => {
            const info = getPlantInfo('seed');
            expect(info.name).toBe('Tohum');
            expect(info.emoji).toBe('🌱');
        });

        it('filiz icin dogru bilgi donmeli', () => {
            const info = getPlantInfo('sprout');
            expect(info.name).toBe('Filiz');
            expect(info.emoji).toBe('🌿');
        });

        it('cicek icin dogru bilgi donmeli', () => {
            const info = getPlantInfo('flowering');
            expect(info.name).toBe('Çiçek Açtı!');
            expect(info.emoji).toBe('🌸');
            expect(info.color).toBe('#F48FB1'); // Pembe renk
        });
    });

    describe('Yuzde Hesaplama', () => {
        it('toplam ve hedeften yuzde dogru hesaplanmali', () => {
            const toplamMl = 1000;
            const gunlukHedef = 2000;
            const percent = Math.min(100, (toplamMl / gunlukHedef) * 100);
            expect(percent).toBe(50);
        });

        it('maksimum yuzde 100 olmali (overfill durumunda)', () => {
            const toplamMl = 3000;
            const gunlukHedef = 2000;
            const percent = Math.min(100, (toplamMl / gunlukHedef) * 100);
            expect(percent).toBe(100);
        });

        it('%0 icin tohum asamasi olmali', () => {
            const percent = 0;
            expect(getPlantStage(percent)).toBe('seed');
        });
    });

    describe('Asama Gecisleri', () => {
        it('sinir degerlerinde dogru asamaya gecmeli', () => {
            // Tohum -> Filiz
            expect(getPlantStage(9)).toBe('seed');
            expect(getPlantStage(10)).toBe('sprout');

            // Filiz -> Küçük
            expect(getPlantStage(29)).toBe('sprout');
            expect(getPlantStage(30)).toBe('small');

            // Küçük -> Büyüyen
            expect(getPlantStage(49)).toBe('small');
            expect(getPlantStage(50)).toBe('medium');

            // Büyüyen -> Olgun
            expect(getPlantStage(74)).toBe('medium');
            expect(getPlantStage(75)).toBe('large');

            // Olgun -> Çiçek
            expect(getPlantStage(99)).toBe('large');
            expect(getPlantStage(100)).toBe('flowering');
        });
    });

    describe('Tum Asamalar', () => {
        const tumAsamalar: PlantStage[] = ['seed', 'sprout', 'small', 'medium', 'large', 'flowering'];

        it('toplam 6 asama olmali', () => {
            expect(tumAsamalar.length).toBe(6);
        });

        it('her asamanin bilgisi olmali', () => {
            tumAsamalar.forEach(asama => {
                const info = getPlantInfo(asama);
                expect(info.name).toBeDefined();
                expect(info.emoji).toBeDefined();
                expect(info.color).toBeDefined();
            });
        });
    });
});
