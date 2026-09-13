import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Modal,
  Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { User, Store, Check, ChevronLeft, ArrowRight, PartyPopper, Lightbulb, Lock, FileText, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../lib/colors';
import { Colors } from '../constants';
import { api } from '../lib/api';
import { useAppState } from '../context/AppContext';
import type { SellerProfile } from '../lib/tokenStorage';
import { Input, Chip, Button } from './ui';

interface Props {
  visible: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const BUSINESS_TYPES = [
  'Individual Seller',
  'Retail Shop',
  'Electronics Store',
  'Fashion Boutique',
  'Furniture Store',
  'Auto Parts',
  'Other Business',
];

const STEPS = ['Account Type', 'Business Info', 'Contact Details', 'Review & Confirm'];

export default function SellerRegistrationWizard({ visible, onComplete, onCancel }: Props) {
  const { setSellerProfile } = useAppState();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Individual Seller');
  const [city, setCity] = useState('Addis Ababa');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [tin, setTin] = useState('');
  const [licenseUri, setLicenseUri] = useState<string | null>(null);

  function canAdvance(): boolean {
    if (step === 0) return true;
    if (step === 1) return businessName.trim().length >= 2 && city.trim().length >= 2;
    if (step === 2) return contactName.trim().length >= 2;
    return true;
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const profile: SellerProfile = {
        businessName: accountType === 'personal' ? contactName : businessName,
        businessType,
        city,
        contactName,
        phone: phone || undefined,
        tin: tin || undefined,
        registeredAt: new Date().toISOString(),
      };

      if (accountType === 'business') {
        const res = await api.post<any>('/businesses', {
          name: businessName,
          type: businessType,
          tin: tin || undefined,
          city,
        });
        if (res.success) {
          profile.businessId = res.data.id;
          if (licenseUri) {
            await api.uploadFile(`/businesses/${res.data.id}/license`, licenseUri, 'license');
          }
        }
      }

      await setSellerProfile(profile);
      onComplete();
    } catch {
      Alert.alert('Error', 'Could not save your seller profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Become a Seller</Text>
            <View style={{ width: 56 }} />
          </View>

          {/* Progress bar */}
          <View style={styles.progress}>
            {STEPS.map((s, i) => (
              <View key={s} style={[styles.progressStep, i <= step && styles.progressStepActive]}>
                <View style={[styles.progressDot, i <= step && styles.progressDotActive, i === step && styles.progressDotCurrent]}>
                  {i < step && <Check size={12} color={colors.onBrand} strokeWidth={3} />}
                  {i === step && <Text style={{ color: colors.onBrand, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>}
                  {i > step && <Text style={{ color: colors.textMuted, fontSize: 11 }}>{i + 1}</Text>}
                </View>
                <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]} numberOfLines={1}>
                  {s}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {/* Step 0: Account Type */}
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>How will you sell?</Text>
                <Text style={styles.stepDesc}>Choose the account type that fits you. You can always update this later.</Text>

                <TouchableOpacity
                  style={[styles.typeCard, accountType === 'personal' && styles.typeCardActive]}
                  onPress={() => setAccountType('personal')}
                  activeOpacity={0.8}
                >
                  <View style={styles.typeIcon}>
                    <User size={22} color={accountType === 'personal' ? Colors.green.primary : Colors.text.muted} strokeWidth={1.75} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeTitle, accountType === 'personal' && styles.typeTitleActive]}>
                      Personal Seller
                    </Text>
                    <Text style={styles.typeDesc}>I'm an individual selling my own pre-loved items</Text>
                  </View>
                  <View style={[styles.radio, accountType === 'personal' && styles.radioActive]} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeCard, accountType === 'business' && styles.typeCardActive]}
                  onPress={() => setAccountType('business')}
                  activeOpacity={0.8}
                >
                  <View style={styles.typeIcon}>
                    <Store size={22} color={accountType === 'business' ? Colors.green.primary : Colors.text.muted} strokeWidth={1.75} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeTitle, accountType === 'business' && styles.typeTitleActive]}>
                      Business / Shop
                    </Text>
                    <Text style={styles.typeDesc}>I run a registered business or shop with multiple items</Text>
                  </View>
                  <View style={[styles.radio, accountType === 'business' && styles.radioActive]} />
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <Lightbulb size={15} color={Colors.green.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    Both types can sell on Aroge. Businesses get a verified badge and can list under their brand name.
                  </Text>
                </View>
              </View>
            )}

            {/* Step 1: Business Info */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {accountType === 'personal' ? 'Your Seller Name' : 'Business Details'}
                </Text>
                <Text style={styles.stepDesc}>
                  {accountType === 'personal'
                    ? 'This is how buyers will see you on the marketplace.'
                    : 'Enter your business information for buyer trust.'}
                </Text>

                <View style={styles.field}>
                  <Input
                    label={accountType === 'personal' ? 'Display Name *' : 'Business Name *'}
                    placeholder={accountType === 'personal' ? 'e.g. Abelti\'s Preloved' : 'e.g. ABC Electronics'}
                    value={businessName}
                    onChangeText={setBusinessName}
                    maxLength={80}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4, marginTop: 6 }}>
                      {BUSINESS_TYPES.map((t) => (
                        <Chip key={t} label={t} selected={businessType === t} onPress={() => setBusinessType(t)} />
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.field}>
                  <Input label="City *" placeholder="Addis Ababa" value={city} onChangeText={setCity} />
                </View>

                {accountType === 'business' && (
                  <>
                    <View style={styles.field}>
                      <Input
                        label="TIN (Tax ID) — optional"
                        placeholder="Business tax identification number"
                        value={tin}
                        onChangeText={setTin}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>
                        Business License <Text style={{ color: colors.textMuted }}>— optional for now, required to get verified</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.licensePicker}
                        onPress={async () => {
                          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                          if (!permission.granted) return;
                          const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.8,
                          });
                          if (!result.canceled && result.assets[0]) setLicenseUri(result.assets[0].uri);
                        }}
                      >
                        {licenseUri ? (
                          <Image source={{ uri: licenseUri }} style={styles.licensePreview} />
                        ) : (
                          <View style={styles.licensePickerContent}>
                            <FileText size={18} color={Colors.green.primary} strokeWidth={1.75} />
                            <Text style={styles.licensePickerText}>Upload license photo</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={styles.hintRow}>
                        <Lock size={11} color={Colors.text.muted} />
                        <Text style={styles.licenseHint}>
                          Stored securely — only Aroge admins can view it, never shown publicly.
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Step 2: Contact Details */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Contact Person</Text>
                <Text style={styles.stepDesc}>
                  Help buyers reach you directly for questions about your listings.
                </Text>

                <View style={styles.field}>
                  <Input
                    label="Your Full Name *"
                    placeholder="Your name for buyer communication"
                    value={contactName}
                    onChangeText={setContactName}
                    maxLength={80}
                  />
                </View>

                <View style={styles.field}>
                  <Input
                    label="Phone Number — optional"
                    placeholder="+251 9XX XXX XXX"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.infoBox}>
                  <Lock size={15} color={Colors.green.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    Your phone number is only shown to buyers after an order is confirmed. It's never public.
                  </Text>
                </View>
              </View>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Almost done!</Text>
                <Text style={styles.stepDesc}>Review your seller profile before activating.</Text>

                <View style={styles.reviewCard}>
                  <ReviewRow label="Account Type" value={accountType === 'personal' ? 'Personal Seller' : 'Business / Shop'} />
                  <ReviewRow label={accountType === 'personal' ? 'Display Name' : 'Business Name'} value={businessName} />
                  <ReviewRow label="Category" value={businessType} />
                  <ReviewRow label="City" value={city} />
                  <ReviewRow label="Contact Name" value={contactName} />
                  {phone ? <ReviewRow label="Phone" value={phone} /> : null}
                  {tin ? <ReviewRow label="TIN" value={tin} /> : null}
                </View>

                <View style={styles.infoBox}>
                  <CheckCircle2 size={15} color={Colors.green.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    By activating seller mode you agree to Aroge's Seller Terms. All transactions go through Aroge Escrow for your protection.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.footer}>
            {step > 0 && (
              <View style={{ flex: 0.6 }}>
                <Button
                  label="Back"
                  variant="secondary"
                  onPress={() => setStep(s => s - 1)}
                  icon={<ChevronLeft size={16} color={Colors.green.primary} />}
                />
              </View>
            )}
            <View style={{ flex: step > 0 ? 1 : undefined, width: step === 0 ? '100%' : undefined }}>
              <Button
                label={step < STEPS.length - 1 ? 'Continue' : 'Activate Seller Mode'}
                variant="primary"
                loading={saving}
                disabled={!canAdvance() || saving}
                onPress={step < STEPS.length - 1 ? () => setStep(s => s + 1) : handleFinish}
                icon={step < STEPS.length - 1
                  ? <ArrowRight size={16} color={Colors.text.onTerracotta} />
                  : <PartyPopper size={16} color={Colors.text.onTerracotta} />}
                iconPosition="right"
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={reviewStyles.row}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={reviewStyles.value}>{value}</Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { fontSize: 13, color: colors.textMuted, flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 2, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelBtn: { width: 56 },
  cancelText: { color: colors.action, fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  progress: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  progressStep: { flex: 1, alignItems: 'center', gap: 4, opacity: 0.4 },
  progressStepActive: { opacity: 1 },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: colors.brandTint },
  progressDotCurrent: { backgroundColor: colors.brand },
  progressLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center', fontWeight: '500' },
  progressLabelActive: { color: colors.brand, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 40 },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  stepDesc: { fontSize: 14, color: colors.textBody, lineHeight: 20, marginTop: -8 },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeCardActive: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  typeIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center',
  },
  typeTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  typeTitleActive: { color: colors.brand },
  typeDesc: { fontSize: 12, color: colors.textBody, marginTop: 2, lineHeight: 16 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
  },
  radioActive: { borderColor: colors.brand, backgroundColor: colors.brand },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.brandTint,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
  },
  infoIcon: { marginTop: 1 },
  infoText: { flex: 1, fontSize: 13, color: colors.brandDeep, lineHeight: 18 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  licensePicker: {
    height: 100, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  licensePickerContent: { alignItems: 'center', gap: 4 },
  licensePreview: { width: '100%', height: '100%' },
  licensePickerText: { fontSize: 13, color: colors.brand, fontWeight: '600' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  licenseHint: { flex: 1, fontSize: 11, color: colors.textMuted },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
