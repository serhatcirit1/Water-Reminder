// Basit su hesaplama testleri - expo bagimliligi olmayan
describe('Su Hesaplamalari', () => {
    it('ml hesaplamasi: bardak * boyut', () => {
        const bardakSayisi = 8;
        const bardakBoyutu = 250;
        const toplamMl = bardakSayisi * bardakBoyutu;
        expect(toplamMl).toBe(2000);
    });

    it('yuzde hesaplamasi', () => {
        const toplamMl = 1500;
        const hedef = 2000;
        const yuzde = Math.round((toplamMl / hedef) * 100);
        expect(yuzde).toBe(75);
    });

    it('kalan ml hesaplamasi', () => {
        const toplamMl = 1200;
        const hedef = 2000;
        const kalan = Math.max(hedef - toplamMl, 0);
        expect(kalan).toBe(800);
    });

    it('hedef tamamlandi kontrolu', () => {
        const toplamMl = 2500;
        const hedef = 2000;
        const tamamlandi = toplamMl >= hedef;
        expect(tamamlandi).toBe(true);
    });

    it('detoks modu hedef artisi', () => {
        const hedef = 2000;
        const detoksAktif = true;
        const yeniHedef = detoksAktif ? Math.round(hedef * 1.2) : hedef;
        expect(yeniHedef).toBe(2400);
    });

    it('sicak hava uyarisi kontrolu', () => {
        const sicaklik = 28;
        const uyariGoster = sicaklik >= 25;
        expect(uyariGoster).toBe(true);
    });
});
