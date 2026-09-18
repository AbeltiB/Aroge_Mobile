import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing } from '../src/constants';
import { ScreenHeader, Card, LegalSection } from '../src/components/ui';

const LAST_UPDATED = 'September 2026';

export default function TermsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="Terms & Conditions" tone="surface" bordered />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Card padded={false} style={styles.card}>
          <View style={styles.sectionsWrap}>
            <LegalSection title="1. Acceptance of these terms">
              By creating an account or using Aroge, you agree to these terms. If you don't agree,
              please don't use the app.
            </LegalSection>

            <LegalSection title="2. Eligibility">
              You must be at least 18 years old and able to enter into a binding agreement to use
              Aroge, since the app involves real payments between users.
            </LegalSection>

            <LegalSection title="3. Your account">
              Aroge accounts are created and accessed through Telegram sign-in. You're responsible
              for anything that happens through your account, so keep your Telegram account secure.
            </LegalSection>

            <LegalSection title="4. Listings">
              Listings must accurately describe the item, its condition, and its price. You may not
              list stolen, counterfeit, illegal, or hazardous items. Aroge may remove a listing or
              flag it for review if it violates these terms.
            </LegalSection>

            <LegalSection title="5. Offers and orders">
              Buyers may negotiate a listing's price by making an offer. Placing an order is a
              commitment to pay for the item at the agreed price; accepting an order as a seller is
              a commitment to provide the item as described.
            </LegalSection>

            <LegalSection title="6. Payments and escrow">
              Payment for an order is held in escrow rather than paid directly to the seller. Funds
              are released to the seller once the buyer confirms receipt of the item, or
              automatically after a fixed waiting period if no dispute has been raised. Bank
              transfer payments are verified before an order is marked as paid.
            </LegalSection>

            <LegalSection title="7. Delivery">
              Buyers and sellers can arrange an in-person meetup, or use Aroge Delivery where
              available. Both parties are expected to follow through on the delivery method they
              agreed to at checkout.
            </LegalSection>

            <LegalSection title="8. Fees">
              Aroge may charge platform fees on orders. Any applicable fees are shown before you
              complete a purchase — checkout will never charge a fee you weren't shown first.
            </LegalSection>

            <LegalSection title="9. Reviews and trust badges">
              Reviews should reflect a genuine transaction. Trusted-seller and buyer badges are
              awarded automatically based on completed order history and may be revoked if that
              history no longer supports them.
            </LegalSection>

            <LegalSection title="10. Seller responsibilities">
              Sellers are expected to list items honestly, honor accepted offers and orders, and
              follow through on the agreed delivery method promptly.
            </LegalSection>

            <LegalSection title="11. Buyer responsibilities">
              Buyers are expected to pay promptly after placing an order, confirm receipt honestly
              once an item is received, and use the dispute process in good faith rather than to
              avoid a fair transaction.
            </LegalSection>

            <LegalSection title="12. Prohibited conduct">
              You may not use Aroge for fraud, harassment, circumventing escrow by arranging payment
              outside the app for an in-app order, posting fake reviews, or any other activity that
              undermines trust in the marketplace.
            </LegalSection>

            <LegalSection title="13. Disputes">
              If something goes wrong with an order, either party can open a dispute before funds
              are released from escrow. Disputes are reviewed and a decision is made based on the
              evidence provided by both sides.
            </LegalSection>

            <LegalSection title="14. Holiday Mode">
              Sellers can pause visibility of their listings at any time using Holiday Mode, without
              needing to delete or edit each listing individually.
            </LegalSection>

            <LegalSection title="15. Suspension and termination">
              Aroge may suspend or terminate an account that violates these terms, including for
              fraud, repeated policy violations, or abuse of other users.
            </LegalSection>

            <LegalSection title="16. Limitation of liability">
              Aroge provides the platform connecting buyers and sellers and operates escrow in good
              faith, but is not a party to the underlying sale between buyer and seller and is not
              liable for the condition of items exchanged between users.
            </LegalSection>

            <LegalSection title="17. Changes to these terms">
              We may update these terms as Aroge evolves. Continuing to use the app after a change
              means you accept the updated terms.
            </LegalSection>

            <LegalSection title="18. Governing law">
              These terms are governed by the laws of Ethiopia.
            </LegalSection>

            <LegalSection title="19. Contact">
              Questions about these terms can be sent through the Help & Support section of the app.
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
