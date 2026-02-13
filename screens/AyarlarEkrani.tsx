import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, TouchableOpacity, Switch, Modal, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PickerModal, TimePickerModal } from '../components/PickerModal';
import { PremiumEkrani } from './index';
import {
    bildirimIzniIste,
    bildirimAyarlariniKaydet,
    bildirimAyarlariniYukle,
    gunlukOzetAyarKaydet,
    gunlukOzetAyarYukle,
    GunlukOzetAyar,
    gunlukOzetPlanla,
    haftalikRaporAyarKaydet,
    haftalikRaporAyarYukle,
    HaftalikRaporAyar,
    haftalikRaporPlanla,
} from '../bildirimler';
import {
    hedefKaydet, hedefYukle, HEDEF_SECENEKLERI,
    bardakBoyutuKaydet, bardakBoyutuYukle,
    sessizSaatlerKaydet, sessizSaatlerYukle, SessizSaatlerAyar,
    sesAyarKaydet, sesAyarYukle,
    profilKaydet, profilYukle, KullaniciProfil, onerilenSuHesapla,
    akilliHatirlatmaAyarKaydet, akilliHatirlatmaAyarYukle, AkilliHatirlatmaAyar,
    bioritimAyarKaydet, bioritimAyarYukle, BioritimAyar
} from '../ayarlarUtils';
import { useTema } from '../TemaContext';
import { healthKitDestekleniyor, healthKitAyarYukle, healthKitToggle, dinamikHedefAyarYukle, dinamikHedefAyarKaydet, dinamikHedefHesapla, DinamikHedefSonuc } from '../healthKit';
import { aiAyarlariniYukle, aiAyarlariniKaydet } from '../aiUtils';
import { usePremium } from '../PremiumContext';
import { csvOlusturVePaylas } from '../exportUtils';
import { aylikPdfOlusturVePaylas, haftalikPdfOlusturVePaylas } from '../pdfExport';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage, getCurrentLanguage } from '../locales/i18n';

// --- STYLES & SUB-COMPONENTS ---
const SettingSection = ({ title, children, style }: { title?: string, children: React.ReactNode, style?: any }) => (
    <View style={[styles.section, style]}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

const SettingRow = ({ icon, label, subLabel, onPress, value, showArrow = true, style }: { icon: string, label: string, subLabel?: string, onPress?: () => void, value?: string | React.ReactNode, showArrow?: boolean, style?: any }) => (
    <TouchableOpacity
        style={[styles.row, style]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
    >
        <View style={styles.rowIconContainer}>
            <Text style={styles.rowIcon}>{icon}</Text>
        </View>
        <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>{label}</Text>
            {subLabel ? <Text style={styles.rowSubLabel}>{subLabel}</Text> : null}
        </View>
        <View style={styles.rowRight}>
            {value && (typeof value === 'string' ? <Text style={styles.rowValue}>{value}</Text> : value)}
            {showArrow && onPress && <Text style={styles.rowArrow}>›</Text>}
        </View>
    </TouchableOpacity>
);

const SettingSwitch = ({ icon, label, subLabel, value, onValueChange }: { icon: string, label: string, subLabel?: string, value: boolean, onValueChange: (val: boolean) => void }) => (
    <View style={styles.row}>
        <View style={styles.rowIconContainer}>
            <Text style={styles.rowIcon}>{icon}</Text>
        </View>
        <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>{label}</Text>
            {subLabel ? <Text style={styles.rowSubLabel}>{subLabel}</Text> : null}
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#E0E0E0', true: '#4FC3F7' }}
            thumbColor={value ? '#FFFFFF' : '#F5F5F5'}
        />
    </View>
);

// --- MAIN COMPONENT ---
export function AyarlarEkrani() {
    const [bildirimAktif, setBildirimAktif] = useState(true);
    const [hatirlatmaAraligi, setHatirlatmaAraligi] = useState(120);
    const [gunlukHedef, setGunlukHedef] = useState(2000);
    const [bardakBoyutu, setBardakBoyutu] = useState(250);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [sessizSaatler, setSessizSaatler] = useState<SessizSaatlerAyar>({
        aktif: false, baslangic: 22, bitis: 7
    });
    const [sesAktif, setSesAktif] = useState(true);
    const [profil, setProfil] = useState<KullaniciProfil>({
        kilo: 70, yas: 30, aktifMi: false, cinsiyet: 'erkek', boy: 170
    });
    const [gunlukOzet, setGunlukOzet] = useState<GunlukOzetAyar>({
        aktif: true, saat: 21
    });
    const [haftalikRapor, setHaftalikRapor] = useState<HaftalikRaporAyar>({
        aktif: true, gun: 0, saat: 20
    });
    const [akilliHatirlatma, setAkilliHatirlatma] = useState<AkilliHatirlatmaAyar>({
        aktif: true, aralikDakika: 90
    });
    const [healthKitAktif, setHealthKitAktif] = useState(false);
    const [dinamikHedefAktif, setDinamikHedefAktif] = useState(false);
    const [dinamikHedefSonuc, setDinamikHedefSonuc] = useState<DinamikHedefSonuc | null>(null);
    const [bioritim, setBioritim] = useState<BioritimAyar>({
        aktif: false, uyanmaSaati: '08:00', uyumaSaati: '23:00'
    });
    const [aiAktif, setAiAktif] = useState(true);

    const { isPremium: premiumAktif, setPremium } = usePremium();
    const { mod, renkler, modDegistir, otomatikMod, otomatikModDegistir } = useTema();
    const { t } = useTranslation();
    const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

    // Modals
    const [hedefModalGoster, setHedefModalGoster] = useState(false);
    const [bildirimAralikModalGoster, setBildirimAralikModalGoster] = useState(false);
    const [sessizBaslangicModalGoster, setSessizBaslangicModalGoster] = useState(false);
    const [sessizBitisModalGoster, setSessizBitisModalGoster] = useState(false);
    const [akilliAralikModalGoster, setAkilliAralikModalGoster] = useState(false);
    const [bioritimUyanmaModalGoster, setBioritimUyanmaModalGoster] = useState(false);
    const [bioritimUyumaModalGoster, setBioritimUyumaModalGoster] = useState(false);
    const [premiumModalGoster, setPremiumModalGoster] = useState(false);
    const [dilModalGoster, setDilModalGoster] = useState(false);
    const [profilModalGoster, setProfilModalGoster] = useState(false);

    useEffect(() => {
        ayarlariYukle();
    }, []);

    const ayarlariYukle = async () => {
        try {
            const bildirimAyarlar = await bildirimAyarlariniYukle();
            setBildirimAktif(bildirimAyarlar.aktif);
            setHatirlatmaAraligi(bildirimAyarlar.aralikDakika);
            const hedef = await hedefYukle();
            setGunlukHedef(hedef);
            const boyut = await bardakBoyutuYukle();
            setBardakBoyutu(boyut);
            const sessiz = await sessizSaatlerYukle();
            setSessizSaatler(sessiz);
            const ses = await sesAyarYukle();
            setSesAktif(ses);
            const kProfil = await profilYukle();
            setProfil(kProfil);
            const ozetAyar = await gunlukOzetAyarYukle();
            setGunlukOzet(ozetAyar);
            const akilliAyar = await akilliHatirlatmaAyarYukle();
            setAkilliHatirlatma(akilliAyar);
            const haftalikAyar = await haftalikRaporAyarYukle();
            setHaftalikRapor(haftalikAyar);
            const hkAktif = await healthKitAyarYukle();
            setHealthKitAktif(hkAktif);
            const dhAktif = await dinamikHedefAyarYukle();
            setDinamikHedefAktif(dhAktif);
            const bioAyar = await bioritimAyarYukle();
            setBioritim(bioAyar);
            const aiAyar = await aiAyarlariniYukle();
            setAiAktif(aiAyar.aktif);
        } catch (hata) {
            console.error('Ayarlar yüklenemedi:', hata);
        } finally {
            setYukleniyor(false);
        }
    };

    const bildirimDurumuDegistir = async (yeniDeger: boolean) => {
        setBildirimAktif(yeniDeger);
        if (yeniDeger) {
            const izinVar = await bildirimIzniIste();
            if (!izinVar) {
                setBildirimAktif(false);
                Alert.alert(t('alerts.permissionRequired'), t('alerts.notificationPermission'));
                return;
            }
        }
        await bildirimAyarlariniKaydet(yeniDeger, hatirlatmaAraligi);
    };

    const aralikDegistir = async (yeniAralik: number) => {
        setHatirlatmaAraligi(yeniAralik);
        if (bildirimAktif) await bildirimAyarlariniKaydet(true, yeniAralik);
    };

    const hedefDegistir = async (yeniHedef: number) => {
        setGunlukHedef(yeniHedef);
        await hedefKaydet(yeniHedef);
    };

    const profilDegistir = async (yeniProfil: KullaniciProfil) => {
        setProfil(yeniProfil);
        await profilKaydet(yeniProfil);
    };

    if (yukleniyor) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.yukleniyorYazi}>⚙️ {t('common.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]} edges={['top']}>
            <ScrollView
                style={[styles.container, { backgroundColor: renkler.arkaplan }]}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                    {premiumAktif && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PRO</Text></View>}
                </View>

                {/* PREMIUM BANNER */}
                {!premiumAktif && (
                    <TouchableOpacity
                        style={styles.premiumCard}
                        onPress={() => setPremiumModalGoster(true)}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#FFD700', '#FFA000']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.premiumGradient}
                        >
                            <View style={styles.premiumContent}>
                                <Text style={styles.premiumTitle}>WATER PREMIUM 💎</Text>
                                <Text style={styles.premiumSubtitle}>{t('home.premiumBannerSubtitle')}</Text>
                            </View>
                            <View style={styles.premiumButton}>
                                <Text style={styles.premiumButtonText}>{t('home.explore')}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* PROFILE SUMMARY CARD */}
                <View style={styles.profileCard}>
                    <View style={styles.profileInfo}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{profil.cinsiyet === 'kadin' ? '👩' : '👨'}</Text>
                        </View>
                        <View>
                            <Text style={styles.profileName}>{profil.yas} {t('settings.age')}, {profil.kilo} kg</Text>
                            <Text style={styles.profileStatus}>{profil.aktifMi ? t('alerts.activeLifestyle') : t('alerts.normalLifestyle')}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.editButton} onPress={() => setProfilModalGoster(true)}>
                        <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                    </TouchableOpacity>
                </View>

                {/* 1. GOALS Section */}
                <SettingSection title={t('settings.dailyGoal')}>
                    <SettingRow
                        icon="🎯"
                        label={t('settings.dailyGoal')}
                        value={`${gunlukHedef} ml`}
                        onPress={() => setHedefModalGoster(true)}
                    />
                    <SettingSwitch
                        icon="🔥"
                        label={t('settings.dynamicGoal')}
                        subLabel={t('settings.dynamicGoalDesc')}
                        value={dinamikHedefAktif}
                        onValueChange={async (val) => {
                            setDinamikHedefAktif(val);
                            await dinamikHedefAyarKaydet(val);
                            if (val) {
                                const sonuc = await dinamikHedefHesapla(profil.kilo);
                                setDinamikHedefSonuc(sonuc);
                                Alert.alert(
                                    t('settings.recommendedGoal'),
                                    `${sonuc.hedefMl} ml (${sonuc.aciklama})`,
                                    [
                                        { text: t('common.cancel'), style: 'cancel' },
                                        {
                                            text: t('alerts.apply'),
                                            onPress: async () => {
                                                await hedefKaydet(sonuc.hedefMl);
                                                setGunlukHedef(sonuc.hedefMl);
                                            }
                                        }
                                    ]
                                );
                            }
                        }}
                    />
                    <SettingSwitch
                        icon="🧠"
                        label={t('settings.aiFeatures')}
                        subLabel={t('settings.aiDesc')}
                        value={aiAktif}
                        onValueChange={async (val) => {
                            setAiAktif(val);
                            await aiAyarlariniKaydet({ aktif: val });
                        }}
                    />
                </SettingSection>

                {/* 2. NOTIFICATIONS Section */}
                <SettingSection title={t('settings.notifications')}>
                    <SettingSwitch
                        icon="🔔"
                        label={t('settings.notifications')}
                        value={bildirimAktif}
                        onValueChange={bildirimDurumuDegistir}
                    />
                    {bildirimAktif && (
                        <>
                            <SettingRow
                                icon="⏰"
                                label={t('settings.reminderInterval')}
                                value={hatirlatmaAraligi >= 60 ? `${hatirlatmaAraligi / 60} ${t('time.hours')}` : `${hatirlatmaAraligi} ${t('time.minutes')}`}
                                onPress={() => setBildirimAralikModalGoster(true)}
                            />
                            <SettingSwitch
                                icon="🌙"
                                label={t('settings.silentHours')}
                                value={sessizSaatler.aktif}
                                onValueChange={async (val) => {
                                    const yeni = { ...sessizSaatler, aktif: val };
                                    setSessizSaatler(yeni);
                                    await sessizSaatlerKaydet(yeni);
                                }}
                            />
                            {sessizSaatler.aktif && (
                                <View style={styles.subRowContainer}>
                                    <TouchableOpacity style={styles.subRowItem} onPress={() => setSessizBaslangicModalGoster(true)}>
                                        <Text style={styles.subRowLabel}>{t('settings.startTime')}</Text>
                                        <Text style={styles.subRowValue}>{sessizSaatler.baslangic}:00</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.subRowItem} onPress={() => setSessizBitisModalGoster(true)}>
                                        <Text style={styles.subRowLabel}>{t('settings.endTime')}</Text>
                                        <Text style={styles.subRowValue}>{sessizSaatler.bitis}:00</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <SettingSwitch
                                icon="💡"
                                label={t('settings.smartReminder')}
                                subLabel={t('settings.smartReminderDesc')}
                                value={akilliHatirlatma.aktif}
                                onValueChange={async (val) => {
                                    const yeni = { ...akilliHatirlatma, aktif: val };
                                    setAkilliHatirlatma(yeni);
                                    await akilliHatirlatmaAyarKaydet(yeni);
                                }}
                            />
                            {akilliHatirlatma.aktif && (
                                <SettingRow
                                    icon="⏱️"
                                    label={t('settings.smartInterval')}
                                    value={akilliHatirlatma.aralikDakika >= 60 ? `${akilliHatirlatma.aralikDakika / 60} ${t('time.hours')}` : `${akilliHatirlatma.aralikDakika} ${t('time.minutes')}`}
                                    onPress={() => setAkilliAralikModalGoster(true)}
                                    showArrow={true}
                                />
                            )}
                        </>
                    )}
                </SettingSection>

                {/* 3. APPEARANCE & APP */}
                <SettingSection title={t('settings.theme')}>
                    <View style={styles.themeSelector}>
                        {[
                            { id: 'acik', icon: '💧', label: t('settings.themeBlue'), color: '#42A5F5' },
                            { id: 'koyu', icon: '🌿', label: t('settings.themeGreen'), color: '#4CAF50' },
                            { id: 'system', icon: '🔄', label: t('settings.themeSystem'), color: '#9C27B0' },
                        ].map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.themeOption,
                                    (item.id === 'system' ? otomatikMod : (!otomatikMod && mod === item.id)) && { borderColor: item.color, backgroundColor: item.color + '20' }
                                ]}
                                onPress={() => {
                                    if (item.id === 'system') otomatikModDegistir(true);
                                    else modDegistir(item.id as any);
                                }}
                            >
                                <Text style={styles.themeIcon}>{item.icon}</Text>
                                <Text style={[styles.themeLabel, (item.id === 'system' ? otomatikMod : (!otomatikMod && mod === item.id)) && { color: item.color, fontWeight: 'bold' }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Premium Themes */}
                    <View style={{ padding: 16, paddingTop: 8 }}>
                        <Text style={[styles.rowLabel, { marginBottom: 12, fontSize: 13, color: 'rgba(255,255,255,0.7)' }]}>🎭 {t('settings.specialThemes')}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                            {[
                                { id: 'altin', color: '#FFD700', icon: '👑' },
                                { id: 'okyanus', color: '#2AA198', icon: '🌊' },
                                { id: 'zumrut', color: '#2ECC71', icon: '🌿' },
                                { id: 'midnight', color: '#BB86FC', icon: '🌌' },
                            ].map((theme) => (
                                <TouchableOpacity
                                    key={theme.id}
                                    style={{
                                        flex: 1, height: 50, borderRadius: 16,
                                        backgroundColor: theme.color,
                                        justifyContent: 'center', alignItems: 'center',
                                        borderWidth: mod === theme.id ? 3 : 0,
                                        borderColor: '#FFF',
                                        shadowColor: theme.color, shadowOpacity: 0.4, shadowRadius: 8
                                    }}
                                    onPress={() => premiumAktif ? modDegistir(theme.id as any) : setPremiumModalGoster(true)}
                                >
                                    <Text style={{ fontSize: 20 }}>{theme.icon}</Text>
                                    {!premiumAktif && (
                                        <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#222', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' }}>
                                            <Text style={{ fontSize: 10 }}>🔒</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <SettingRow
                        icon="🌐"
                        label={t('settings.language')}
                        value={LANGUAGES.find(l => l.code === currentLang)?.flag || '🌐'}
                        onPress={() => setDilModalGoster(true)}
                    />
                </SettingSection>

                {/* 4. EXPORT & DATA */}
                <SettingSection title={t('settings.dataExport')}>
                    <SettingRow
                        icon="📊"
                        label={t('settings.pdfWeekly')}
                        showArrow={true}
                        onPress={async () => premiumAktif ? await haftalikPdfOlusturVePaylas(gunlukHedef) : setPremiumModalGoster(true)}
                        style={{ opacity: premiumAktif ? 1 : 0.6 }}
                    />
                    <SettingRow
                        icon="📄"
                        label={t('settings.pdfMonthly')}
                        showArrow={true}
                        onPress={async () => premiumAktif ? await aylikPdfOlusturVePaylas(gunlukHedef) : setPremiumModalGoster(true)}
                        style={{ opacity: premiumAktif ? 1 : 0.6 }}
                    />
                    <SettingRow
                        icon="📥"
                        label={t('settings.csvData')}
                        showArrow={true}
                        onPress={async () => premiumAktif ? await csvOlusturVePaylas(gunlukHedef) : setPremiumModalGoster(true)}
                        style={{ opacity: premiumAktif ? 1 : 0.6 }}
                    />
                    {healthKitDestekleniyor() && (
                        <SettingSwitch
                            icon="❤️"
                            label={t('settings.appleHealth')}
                            value={healthKitAktif}
                            onValueChange={async () => {
                                const val = await healthKitToggle();
                                setHealthKitAktif(val);
                            }}
                        />
                    )}
                </SettingSection>

                {/* LEGALS */}
                <View style={styles.footerLinks}>
                    <TouchableOpacity onPress={() => Linking.openURL('https://serhatcirit1.github.io/Smart-Water-AI-Insights-Privacy-Policy/')}>
                        <Text style={styles.linkText}>{t('settings.legal.privacyPolicy')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.linkDot}>•</Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://serhatcirit1.github.io/Smart-Water-AI-Insights-Privacy-Policy/terms.html')}>
                        <Text style={styles.linkText}>{t('settings.legal.termsOfUse')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.versionText}>v{t('appInfo.versionValue')} • {t('appInfo.developerName')}</Text>

            </ScrollView>

            {/* --- MODALS --- */}
            <Modal visible={premiumModalGoster} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPremiumModalGoster(false)}>
                <PremiumEkrani onClose={() => setPremiumModalGoster(false)} />
            </Modal>

            <PickerModal
                visible={hedefModalGoster}
                title={t('settings.pickerTitles.dailyGoal')}
                value={gunlukHedef}
                options={HEDEF_SECENEKLERI.map(ml => ({ label: `${ml} ml (${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L)`, value: ml }))}
                onSelect={(val) => hedefDegistir(Number(val))}
                onClose={() => setHedefModalGoster(false)}
            />

            <PickerModal
                visible={bildirimAralikModalGoster}
                title={t('settings.pickerTitles.reminderInterval')}
                value={hatirlatmaAraligi}
                options={[
                    { label: `30 ${t('time.minutes')}`, value: 30 },
                    { label: `1 ${t('time.hours')}`, value: 60 },
                    { label: `2 ${t('time.hours')}`, value: 120 },
                    { label: `3 ${t('time.hours')}`, value: 180 },
                ]}
                onSelect={(val) => aralikDegistir(Number(val))}
                onClose={() => setBildirimAralikModalGoster(false)}
            />

            <TimePickerModal
                visible={sessizBaslangicModalGoster}
                title={t('settings.pickerTitles.silentStart')}
                hour={sessizSaatler.baslangic}
                onSelect={async (h) => { const n = { ...sessizSaatler, baslangic: h }; setSessizSaatler(n); await sessizSaatlerKaydet(n); }}
                onClose={() => setSessizBaslangicModalGoster(false)}
            />
            <TimePickerModal
                visible={sessizBitisModalGoster}
                title={t('settings.pickerTitles.silentEnd')}
                hour={sessizSaatler.bitis}
                onSelect={async (h) => { const n = { ...sessizSaatler, bitis: h }; setSessizSaatler(n); await sessizSaatlerKaydet(n); }}
                onClose={() => setSessizBitisModalGoster(false)}
            />

            <PickerModal
                visible={akilliAralikModalGoster}
                title={t('settings.pickerTitles.smartReminderInterval')}
                value={akilliHatirlatma.aralikDakika}
                options={[
                    { label: `30 ${t('time.minutes')}`, value: 30 },
                    { label: `45 ${t('time.minutes')}`, value: 45 },
                    { label: `1 ${t('time.hours')}`, value: 60 },
                    { label: `1.5 ${t('time.hours')}`, value: 90 },
                    { label: `2 ${t('time.hours')}`, value: 120 },
                    { label: `2.5 ${t('time.hours')}`, value: 150 },
                    { label: `3 ${t('time.hours')}`, value: 180 },
                    { label: `4 ${t('time.hours')}`, value: 240 },
                ]}
                onSelect={async (val) => {
                    const yeni = { ...akilliHatirlatma, aralikDakika: Number(val) };
                    setAkilliHatirlatma(yeni);
                    await akilliHatirlatmaAyarKaydet(yeni);
                }}
                onClose={() => setAkilliAralikModalGoster(false)}
            />

            <Modal visible={dilModalGoster} transparent={true} animationType="fade" onRequestClose={() => setDilModalGoster(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDilModalGoster(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>🌐 {t('settings.language')}</Text>
                        {LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[styles.langItem, currentLang === lang.code && styles.langItemActive]}
                                onPress={async () => { await changeLanguage(lang.code); setCurrentLang(lang.code); setDilModalGoster(false); }}
                            >
                                <Text style={{ fontSize: 24, marginRight: 10 }}>{lang.flag}</Text>
                                <Text style={[styles.langText, currentLang === lang.code && styles.langTextActive]}>{lang.name}</Text>
                                {currentLang === lang.code && <Text style={{ color: '#4FC3F7', marginLeft: 'auto' }}>✓</Text>}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={profilModalGoster} transparent={true} animationType="fade" onRequestClose={() => setProfilModalGoster(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfilModalGoster(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('settings.appInfo')}</Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                            <TouchableOpacity onPress={() => profilDegistir({ ...profil, cinsiyet: 'erkek' })} style={[styles.genderBtn, profil.cinsiyet === 'erkek' && styles.genderBtnActive]}>
                                <Text style={{ fontSize: 30 }}>👨</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => profilDegistir({ ...profil, cinsiyet: 'kadin' })} style={[styles.genderBtn, profil.cinsiyet === 'kadin' && styles.genderBtnActive]}>
                                <Text style={{ fontSize: 30 }}>👩</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.controlRow}>
                            <Text style={styles.controlLabel}>{t('settings.weight')}</Text>
                            <View style={styles.controlButtons}>
                                <TouchableOpacity onPress={() => profilDegistir({ ...profil, kilo: Math.max(30, profil.kilo - 1) })}>
                                    <Text style={styles.controlBtn}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.controlValue}>{profil.kilo} kg</Text>
                                <TouchableOpacity onPress={() => profilDegistir({ ...profil, kilo: Math.min(150, profil.kilo + 1) })}>
                                    <Text style={styles.controlBtn}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.controlRow}>
                            <Text style={styles.controlLabel}>{t('settings.age')}</Text>
                            <View style={styles.controlButtons}>
                                <TouchableOpacity onPress={() => profilDegistir({ ...profil, yas: Math.max(10, profil.yas - 1) })}>
                                    <Text style={styles.controlBtn}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.controlValue}>{profil.yas}</Text>
                                <TouchableOpacity onPress={() => profilDegistir({ ...profil, yas: Math.min(100, profil.yas + 1) })}>
                                    <Text style={styles.controlBtn}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.controlRow}>
                            <Text style={styles.controlLabel}>{t('alerts.activeLifestyle')}</Text>
                            <Switch value={profil.aktifMi} onValueChange={(v) => profilDegistir({ ...profil, aktifMi: v })} />
                        </View>

                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setProfilModalGoster(false)}>
                            <Text style={styles.modalCloseText}>{t('common.done')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 20 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    yukleniyorYazi: { color: 'white', fontSize: 16 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFF' },
    premiumBadge: { backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
    premiumBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },

    premiumCard: { marginBottom: 24, borderRadius: 20, overflow: 'hidden', elevation: 5 },
    premiumGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    premiumContent: { flex: 1 },
    premiumTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    premiumSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
    premiumButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    premiumButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 20, marginBottom: 24 },
    profileInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 24 },
    profileName: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    profileStatus: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    editButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    editButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' },
    sectionContent: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, overflow: 'hidden' },

    row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', minHeight: 64 },
    rowIconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rowIcon: { fontSize: 18 },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 15, color: '#FFF', fontWeight: '500' },
    rowSubLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center' },
    rowValue: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginRight: 8 },
    rowArrow: { fontSize: 18, color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' },

    subRowContainer: { flexDirection: 'row', padding: 16, paddingTop: 0, gap: 12 },
    subRowItem: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, alignItems: 'center' },
    subRowLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    subRowValue: { fontSize: 16, color: '#4FC3F7', fontWeight: 'bold', marginTop: 4 },

    themeSelector: { flexDirection: 'row', padding: 8, gap: 8 },
    themeOption: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.02)' },
    themeIcon: { fontSize: 24, marginBottom: 8 },
    themeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

    footerLinks: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    linkText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    linkDot: { color: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
    versionText: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 12, marginBottom: 40 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1E293B', borderRadius: 24, padding: 24, alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
    langItem: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
    langItemActive: { backgroundColor: 'rgba(79, 195, 247, 0.1)', borderColor: '#4FC3F7', borderWidth: 1 },
    langText: { color: '#FFF', fontSize: 16 },
    langTextActive: { color: '#4FC3F7', fontWeight: 'bold' },

    // Quick Edit Styles
    controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
    controlLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
    controlButtons: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
    controlBtn: { fontSize: 18, width: 32, textAlign: 'center', color: '#4FC3F7' },
    controlValue: { width: 60, textAlign: 'center', fontWeight: 'bold', color: '#FFF' },
    genderBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 10, borderWidth: 2, borderColor: 'transparent' },
    genderBtnActive: { borderColor: '#4FC3F7', backgroundColor: 'rgba(79, 195, 247, 0.1)' },
    modalCloseBtn: { marginTop: 10, padding: 16 },
    modalCloseText: { color: '#4FC3F7', fontSize: 16, fontWeight: 'bold' },
});
