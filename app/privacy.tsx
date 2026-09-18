import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing } from '../src/constants';
import { ScreenHeader, Card, LegalSection } from '../src/components/ui';

const LAST_UPDATED = 'September 2026';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="Privacy & Security" tone="surface" bordered />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Card padded={false} style={styles.card}>
          <View style={styles.sectionsWrap}>
            <LegalSection title="Overview">
              This policy explains what information Aroge collects when you use the app, how it's
              used, and the choices you have. Aroge is a marketplace where buyers and sellers meet,
              with escrow protecting payments until an order is confirmed.
            </LegalSection>

            <LegalSection title="Information we collect">
              {'•'} Your Telegram profile — name, Telegram ID, and avatar, used to sign you in and identify you to other users.{'\n'}
              {'•'} Location details you provide — city and sub-city, shown on your listings and used to estimate delivery.{'\n'}
              {'•'} Listings, offers, and order activity you create.{'\n'}
              {'•'} Messages you send to other users through the app.{'\n'}
              {'•'} Payment verification details for orders you place, such as a bank transfer reference number.{'\n'}
              {'•'} A push-notification token, so the app can notify you about orders and messages.
            </LegalSection>

            <LegalSection title="How we use your information">
              We use this information to operate the marketplace — matching buyers and sellers,
              creating and tracking orders, holding and releasing escrow funds, verifying bank
              transfer payments, sending you notifications about things that need your attention,
              and detecting fraud or abuse.
            </LegalSection>

            <LegalSection title="How we share your information">
              Other users can see your name, avatar, city, listings, and public seller rating as a
              normal part of using the marketplace. A buyer and seller in an order can see what's
              needed to complete that order. Payment references may be shared with our bank-transfer
              verification provider to confirm a payment. We do not sell your personal information
              to third parties.
            </LegalSection>

            <LegalSection title="Data security">
              Aroge uses Telegram-based sign-in, so we never store a password for your account.
              Payments for orders are held in escrow and only released once a buyer confirms
              receipt (or automatically after a fixed waiting period if there's no dispute).
              Connections between the app and our servers are encrypted.
            </LegalSection>

            <LegalSection title="Data retention">
              We keep your information for as long as your account is active, and for a period
              afterward where needed to resolve disputes, meet legal obligations, or keep our
              records accurate.
            </LegalSection>

            <LegalSection title="Your choices">
              You can turn on Holiday Mode at any time to hide your listings from buyers without
              deleting them. You may request access to, correction of, or deletion of your personal
              data by contacting us — see Help & Support in the app for the current ways to reach us.
            </LegalSection>

            <LegalSection title="Children's privacy">
              Aroge involves real payments between users and is intended for people 18 years of age
              or older. We don't knowingly collect information from anyone younger than that.
            </LegalSection>

            <LegalSection title="Changes to this policy">
              We may update this policy as Aroge changes. Meaningful changes will be reflected here
              with an updated date at the top of this page.
            </LegalSection>

            <LegalSection title="Contact">
              Questions about this policy can be sent through the Help & Support section of the app.
            </LegalSection>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing[4], paddingBottom: 48, gap: Spacing[3] },
  updated: {
    fontFamily: FontFamily.interSemibold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  card: { padding: Spacing[4] },
  sectionsWrap: { gap: Spacing[5] },
});
