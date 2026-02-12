import { akilliHedefHesapla } from '../aiUtils';
import { suTuketimiOku, adimSayisiAl } from '../healthKit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HavaDurumuVerisi } from '../havaDurumu';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('react-native', () => ({
    Platform: { OS: 'ios' },
    Alert: { alert: jest.fn() },
}));

// Mock i18n to avoid loading translation files
jest.mock('../locales/i18n', () => ({
    t: (key: string) => key,
    // Add other properties if needed
    __esModule: true,
    default: {
        t: (key: string) => key,
    }
}));

const mockGetWaterSamples = jest.fn();
const mockGetStepCount = jest.fn();

jest.mock('react-native-health', () => {
    return {
        __esModule: true,
        default: {
            getWaterSamples: (opts: any, cb: any) => mockGetWaterSamples(opts, cb),
            getStepCount: (opts: any, cb: any) => mockGetStepCount(opts, cb),
            initHealthKit: jest.fn(),
        },
    };
}, { virtual: true });

describe('Entegrasyon Kontrolleri', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true'); // HealthKit active by default
    });

    describe('AI Hedef Hesaplama', () => {
        it('adim sayisi 0 oldugunda aktivite faktoru eklememeli', async () => {
            const hedef = 2000;
            const hava: HavaDurumuVerisi = {
                sicaklik: 20,
                icon: '☀️',
                aciklama: 'Clear',
                sehir: 'Test City',
                timestamp: Date.now()
            };

            // Adım sayısı 0
            const sonuc = await akilliHedefHesapla(hedef, hava, 0);

            const aktiviteSebebi = sonuc.sebepler ? sonuc.sebepler.find(s => s.toLowerCase().includes('aktif') || s.toLowerCase().includes('hareket')) : undefined;
            expect(aktiviteSebebi).toBeUndefined();
        });

        it('yuksek adim sayisinda hedef artmali', async () => {
            const hedef = 2000;
            const hava: HavaDurumuVerisi = {
                sicaklik: 20,
                icon: '☀️',
                aciklama: 'Clear',
                sehir: 'Test City',
                timestamp: Date.now()
            };

            // 15000 adım -> +600ml
            const sonuc = await akilliHedefHesapla(hedef, hava, 15000);

            expect(sonuc.onerilenHedef).toBeGreaterThan(hedef);
        });
    });

    describe('HealthKit Veri Okuma', () => {
        it('su tuketimini dogru okumali', async () => {
            // Mock response
            const mockSamples = [
                { value: 0.5 }, // 0.5 Litre
                { value: 0.25 } // 0.25 Litre
            ];

            mockGetWaterSamples.mockImplementation((opts: any, callback: any) => {
                callback(null, mockSamples);
            });

            const ml = await suTuketimiOku();

            // 0.75 L = 750 ml
            expect(ml).toBe(750);
        });

        it('hata durumunda 0 donmeli', async () => {
            mockGetWaterSamples.mockImplementation((opts: any, callback: any) => {
                callback('Error', null);
            });

            const ml = await suTuketimiOku();
            expect(ml).toBe(0);
        });

        it('adim sayisini dogru okumali', async () => {
            mockGetStepCount.mockImplementation((opts: any, callback: any) => {
                callback(null, { value: 5432 });
            });

            const adim = await adimSayisiAl();
            expect(adim).toBe(5432);
        });
    });
});
