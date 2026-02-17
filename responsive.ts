import { Dimensions, PixelRatio, Platform, ViewStyle, FlexStyle } from 'react-native';
import * as Device from 'expo-device';

// Tablet tespiti için boyut eşiği
const TABLET_MIN_WIDTH = 768;

/**
 * Cihazın tablet olup olmadığını kontrol eder.
 * Hem expo-device hem de ekran boyutlarını kullanır.
 */
export const isTablet = (): boolean => {
    // 1. Expo Device kontrolü (en güvenilir)
    if (Device.deviceType === Device.DeviceType.TABLET) {
        return true;
    }

    // 2. Ekran boyutu kontrolü (yedek)
    const { width, height } = Dimensions.get('window');
    const smallerDimension = Math.min(width, height);

    return smallerDimension >= TABLET_MIN_WIDTH;
};

/**
 * Tablet için maksimum içerik genişliği
 */
export const TABLET_CONTENT_MAX_WIDTH = 800;

/**
 * Responsive layout stilleri
 */
export const responsiveStyles = {
    /**
     * Ana container stili - Tablette ortalar ve genişliği sınırlar
     */
    container: (baseStyle: any = {}): any => {
        if (isTablet()) {
            return {
                ...baseStyle,
                width: '100%',
                maxWidth: TABLET_CONTENT_MAX_WIDTH,
                alignSelf: 'center',
            };
        }
        return baseStyle;
    },

    /**
     * Tam ekran wrapper - Tablette arka planı doldurur ama içeriği ortalar
     */
    screenWrapper: (backgroundColor: string): any => {
        if (isTablet()) {
            return {
                flex: 1,
                backgroundColor,
                alignItems: 'center', // İçeriği yatayda ortala
            };
        }
        return {
            flex: 1,
            backgroundColor,
        };
    },

    /**
     * Grid yapısı için kolon sayısı hesaplar
     */
    getGridColumns: (): number => {
        return isTablet() ? 2 : 1;
    }
};
