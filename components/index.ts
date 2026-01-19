// ============================================
// COMPONENTS INDEX DOSYASI
// ============================================
// Bu dosya tüm componentleri tek yerden export eder
// "Barrel Export" pattern'ı denir

// Yerine:
//   import { SuSayac } from './components/SuSayac';
//   import { AyarlarPaneli } from './components/AyarlarPaneli';

// Şöyle yazabilirsin:
//   import { SuSayac, AyarlarPaneli } from './components';

export { SuSayac } from './SuSayac';
export { AyarlarPaneli } from './AyarlarPaneli';
export { IlerlemeCubugu } from './IlerlemeCubugu';
export { default as StreakShareCard } from './StreakShareCard';
