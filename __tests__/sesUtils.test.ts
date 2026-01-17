// ============================================
// SES UTILS UNIT TESTS
// ============================================

// Mock modules
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('expo-av', () => ({
    Audio: {
        Sound: {
            createAsync: jest.fn().mockResolvedValue({
                sound: {
                    unloadAsync: jest.fn(),
                    setOnPlaybackStatusUpdate: jest.fn(),
                },
            }),
        },
    },
}));

jest.mock('../ayarlarUtils', () => ({
    sesAyarYukle: jest.fn(),
}));

import { Audio } from 'expo-av';
import { sesAyarYukle } from '../ayarlarUtils';
import { suSesiCal, sesiTemizle } from '../sesUtils';

describe('SesUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('suSesiCal', () => {
        it('ses aktifse ses çalar', async () => {
            (sesAyarYukle as jest.Mock).mockResolvedValue(true);

            await suSesiCal();

            expect(Audio.Sound.createAsync).toHaveBeenCalled();
        });

        it('ses kapalıysa ses çalmaz', async () => {
            (sesAyarYukle as jest.Mock).mockResolvedValue(false);

            await suSesiCal();

            expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
        });

        it('hata durumunda sessizce devam eder', async () => {
            (sesAyarYukle as jest.Mock).mockResolvedValue(true);
            (Audio.Sound.createAsync as jest.Mock).mockRejectedValue(new Error('Test'));

            // Hata fırlatmamalı
            await expect(suSesiCal()).resolves.toBeUndefined();
        });
    });

    describe('sesiTemizle', () => {
        it('fonksiyon hatasız çalışır', async () => {
            await expect(sesiTemizle()).resolves.toBeUndefined();
        });
    });
});
