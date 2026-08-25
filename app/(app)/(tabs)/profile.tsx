import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../../src/lib/colors';
import { useAppState } from '../../../src/context/AppContext';
import { useTranslation, type Locale } from '../../../src/i18n';
import SellerRegistrationWizard from '../../../src/components/SellerRegistrationWizard';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, sellerMode, sellerProfile, setSellerMode, logout } = useAppState();
  const { locale, setLocale, t } = useTranslation();
  const [wizardVisible, setWizardVisible] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleSellerToggle(value: boolean) {
    if (toggling) return;
    if (value && !sellerProfile) {
      setWizardVisible(true);
      return;
    }
    setToggling(true);
    await setSellerMode(value);
    setToggling(false);
  }

  async function handleWizardComplete() {
    setWizardVisible(false);
    await setSellerMode(true);
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SellerRegistrationWizard
        visible={wizardVisible}
        onComplete={handleWizardComplete}
        onCancel={() => setWizardVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile header */}
        <View style={[styles.profileHeader, sellerMode && styles.profileHeaderSeller]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{sellerProfile?.contactName ?? 'My Account'}</Text>
            <Text style={styles.tgHandle}>via Telegram · ID {user?.telegramId ?? '—'}</Text>
            {sellerMode && sellerProfile && (
              <View style={styles.sellerBadge}>
                <Text style={styles.sellerBadgeText}>🏪 {sellerProfile.businessName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Seller mode card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Seller Mode</Text>
              <Text style={styles.cardSub}>
                {sellerMode
                  ? 'Active — your seller dashboard is on'
                  : 'Off — turn on to list and sell items'}
              </Text>
            </View>
            <Switch
              value={sellerMode}
              onValueChange={handleSellerToggle}
              trackColor={{ true: colors.brand, false: colors.border }}
              thumbColor={sellerMode ? colors.surface : '#ccc'}
              disabled={toggling}
            />
          </View>

          {sellerMode && sellerProfile && (
            <View style={styles.sellerInfo}>
              <View style={styles.sellerInfoRow}>
                <Text style={styles.infoLabel}>Business</Text>
                <Text style={styles.infoValue}>{sellerProfile.businessName}</Text>
              </View>
              <View style={styles.sellerInfoRow}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{sellerProfile.businessType}</Text>
              </View>
              <View style={styles.sellerInfoRow}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{sellerProfile.city}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setWizardVisible(true)}
                style={styles.editProfileBtn}
              >
                <Text style={styles.editProfileText}>Edit Seller Profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {!sellerMode && (
            <TouchableOpacity
              style={styles.activateBtn}
              onPress={() => handleSellerToggle(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.activateBtnText}>
                {sellerProfile ? '🔄 Re-activate Seller Mode' : '🚀 Set Up Seller Account'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Activity */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Activity</Text>
          {[
            { label: '📦 My Listings', onPress: () => router.push('/listing/create' as any) },
            { label: '🛍 My Orders', onPress: () => router.push('/orders' as any) },
            { label: '🤝 My Offers', onPress: () => router.push('/offers/buying' as any) },
            { label: '💬 Messages', onPress: () => router.push('/(app)/(tabs)/messages' as any) },
            { label: '❤️ Saved Items', onPress: () => router.push('/saved' as any) },
          ].map(({ label, onPress }) => (
            <TouchableOpacity key={label} style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
              <Text style={styles.menuLabel}>{label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={[styles.cardRow, { paddingVertical: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.langSwitch}>
              {(['en', 'am'] as Locale[]).map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLocale(l)}
                  style={[styles.langOption, locale === l && styles.langOptionActive]}
                >
                  <Text style={[styles.langOptionText, locale === l && styles.langOptionTextActive]}>
                    {l === 'en' ? 'English' : 'አማርኛ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {[
            { label: '🔔 Notifications', onPress: () => router.push('/notifications' as any) },
            { label: '🔒 Privacy & Security', onPress: () => {} },
            { label: '📜 Terms & Conditions', onPress: () => {} },
            { label: '❓ Help & Support', onPress: () => {} },
          ].map(({ label, onPress }) => (
            <TouchableOpacity key={label} style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
              <Text style={styles.menuLabel}>{label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Aroge v1.0 · አሮጌ</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.brand, borderRadius: 20, padding: 18,
  },
  profileHeaderSeller: { backgroundColor: colors.action },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28 },
  name: { fontSize: 18, fontWeight: '700', color: colors.onBrand },
  tgHandle: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  sellerBadge: {
    marginTop: 6, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  sellerBadgeText: { fontSize: 11, color: colors.onBrand, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sellerInfo: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border, gap: 2,
  },
  sellerInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  editProfileBtn: {
    marginTop: 8, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.brandTint, alignItems: 'center',
  },
  editProfileText: { color: colors.brand, fontSize: 13, fontWeight: '600' },
  activateBtn: {
    marginTop: 10, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.actionTint, alignItems: 'center',
  },
  activateBtnText: { color: colors.action, fontSize: 14, fontWeight: '700' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  menuLabel: { fontSize: 14, color: colors.textPrimary },
  langSwitch: {
    flexDirection: 'row', backgroundColor: colors.canvas,
    borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border,
  },
  langOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  langOptionActive: { backgroundColor: colors.brand },
  langOptionText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  langOptionTextActive: { color: colors.onBrand },
  menuArrow: { fontSize: 20, color: colors.textMuted, lineHeight: 22 },
  logoutBtn: {
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(184,92,42,0.08)', alignItems: 'center', marginTop: 4,
  },
  logoutText: { color: colors.action, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
