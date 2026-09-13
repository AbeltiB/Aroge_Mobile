import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Package, ShoppingBag, Handshake, MessageCircle, Heart,
  Bell, Lock, FileText, HelpCircle, ChevronRight, Store, RotateCcw, Rocket,
} from 'lucide-react-native';
import { colors } from '../../../src/lib/colors';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../../src/constants';
import { useAppState } from '../../../src/context/AppContext';
import { useTranslation, type Locale } from '../../../src/i18n';
import SellerRegistrationWizard from '../../../src/components/SellerRegistrationWizard';
import { Avatar, Badge, Card, Button } from '../../../src/components/ui';
import { haptics } from '../../../src/lib/haptics';

const ACTIVITY_ITEMS = [
  { label: 'My Listings', Icon: Package, route: '/listing/create' as const },
  { label: 'My Orders', Icon: ShoppingBag, route: '/orders' as const },
  { label: 'My Offers', Icon: Handshake, route: '/offers/buying' as const },
  { label: 'Messages', Icon: MessageCircle, route: '/(app)/(tabs)/messages' as const },
  { label: 'Saved Items', Icon: Heart, route: '/saved' as const },
];

function MenuRow({ label, Icon, onPress }: { label: string; Icon: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={() => { haptics.tap(); onPress(); }} activeOpacity={0.7}>
      <Icon size={18} color={Colors.text.secondary} strokeWidth={1.75} />
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={16} color={Colors.text.muted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { sellerMode, sellerProfile, setSellerMode, logout } = useAppState();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <SellerRegistrationWizard
        visible={wizardVisible}
        onComplete={handleWizardComplete}
        onCancel={() => setWizardVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile header */}
        <View style={[styles.profileHeader, sellerMode && styles.profileHeaderSeller]}>
          <Avatar name={sellerProfile?.contactName} size={60} tone={sellerMode ? 'action' : 'brand'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{sellerProfile?.contactName ?? 'My Account'}</Text>
            <Text style={styles.tgHandle}>Signed in with Telegram</Text>
            {sellerMode && sellerProfile && (
              <Badge label={sellerProfile.businessName} tone="neutral" icon={<Store size={11} color="#fff" />} style={styles.sellerBadge} />
            )}
          </View>
        </View>

        {/* Seller mode card */}
        <Card>
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
              thumbColor="#fff"
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
              <Button label="Edit Seller Profile" variant="ghost" size="sm" onPress={() => setWizardVisible(true)} style={{ marginTop: Spacing[2] }} />
            </View>
          )}

          {!sellerMode && (
            <Button
              label={sellerProfile ? 'Re-activate Seller Mode' : 'Set Up Seller Account'}
              variant="secondary"
              icon={sellerProfile ? <RotateCcw size={15} color={Colors.green.primary} /> : <Rocket size={15} color={Colors.green.primary} />}
              onPress={() => handleSellerToggle(true)}
              style={{ marginTop: Spacing[3] }}
            />
          )}
        </Card>

        {/* Activity */}
        <Card padded={false}>
          <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>My Activity</Text>
          {ACTIVITY_ITEMS.map(({ label, Icon, route }) => (
            <MenuRow key={label} label={label} Icon={Icon} onPress={() => router.push(route)} />
          ))}
        </Card>

        {/* Settings */}
        <Card padded={false}>
          <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>Account</Text>

          <View style={[styles.cardRow, styles.langRow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.langSwitch}>
              {(['en', 'am'] as Locale[]).map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => { haptics.select(); setLocale(l); }}
                  style={[styles.langOption, locale === l && styles.langOptionActive]}
                >
                  <Text style={[styles.langOptionText, locale === l && styles.langOptionTextActive]}>
                    {l === 'en' ? 'English' : 'አማርኛ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <MenuRow label="Notifications" Icon={Bell} onPress={() => router.push('/notifications')} />
          <MenuRow label="Privacy & Security" Icon={Lock} onPress={() => {}} />
          <MenuRow label="Terms & Conditions" Icon={FileText} onPress={() => {}} />
          <MenuRow label="Help & Support" Icon={HelpCircle} onPress={() => {}} />
        </Card>

        <Button label="Sign Out" variant="danger" onPress={handleLogout} style={{ marginTop: 4 }} />

        <Text style={styles.version}>Aroge v1.0 · አሮጌ</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.brand, borderRadius: BorderRadius.xl, padding: 18,
  },
  profileHeaderSeller: { backgroundColor: colors.action },
  name: { fontFamily: FontFamily.sans, fontSize: FontSize.md, fontWeight: FontWeight.bold, color: colors.onBrand },
  tgHandle: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  sellerBadge: { marginTop: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
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
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionTitlePadded: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[1] },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: 13, paddingHorizontal: Spacing[4],
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.textPrimary },
  langRow: { paddingHorizontal: Spacing[4], paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  langSwitch: {
    flexDirection: 'row', backgroundColor: colors.canvas,
    borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border,
  },
  langOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  langOptionActive: { backgroundColor: colors.brand },
  langOptionText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  langOptionTextActive: { color: colors.onBrand },
  version: { textAlign: 'center', fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
