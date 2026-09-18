import { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../src/constants';
import { ScreenHeader, Card } from '../src/components/ui';
import { haptics } from '../src/lib/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Faq {
  question: string;
  answer: string;
}

const FAQS: Faq[] = [
  {
    question: 'How does escrow protect my payment?',
    answer: 'When you pay for an order, the money is held by Aroge instead of going straight to the seller. It’s only released once you confirm you’ve received the item, or automatically after a fixed waiting period if you haven’t raised a dispute.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'Bank transfer is the payment method available today. You’ll see the full fee breakdown and payment details before you confirm a purchase.',
  },
  {
    question: 'How do I list an item for sale?',
    answer: 'Turn on Seller Mode from your Profile tab, then tap “List” or “Create a Listing.” Add photos, a description, condition, and price — your listing goes live once submitted.',
  },
  {
    question: 'What is Seller Mode?',
    answer: 'Seller Mode switches your app into a shop dashboard — tracking your listings, orders, offers, and earnings — while keeping your normal buyer experience one toggle away.',
  },
  {
    question: 'What is Holiday Mode?',
    answer: 'Holiday Mode hides all of your listings from buyers without deleting them, useful if you’re away and can’t fulfill orders for a while. Turn it off anytime to make your shop visible again.',
  },
  {
    question: 'What is Aroge Live?',
    answer: 'Aroge Live lets you manage claims from a live sale you’re running on TikTok or Instagram — tag items with a short code, take claims by code and phone number, and convert them into real orders, all from the Live tab.',
  },
  {
    question: 'How do I get paid as a seller?',
    answer: 'Once a buyer confirms receipt (or the auto-release window passes), the held payment is released to you. You can track order status from the Orders section of your dashboard.',
  },
  {
    question: 'What if there’s a problem with my order?',
    answer: 'Open the order and use the dispute option before funds are released from escrow. Provide as much detail as you can — disputes are reviewed before any release decision is made.',
  },
  {
    question: 'How do I change the app language?',
    answer: 'Go to Profile → Account, and switch between English and አማርኛ (Amharic) at any time.',
  },
  {
    question: 'How do I delete my account or my data?',
    answer: 'A direct in-app way to request this is coming soon. See our Privacy & Security page for what data we keep and for how long in the meantime.',
  },
];

function FaqRow({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    haptics.select();
    setOpen((v) => !v);
  }

  return (
    <TouchableOpacity style={styles.faqRow} onPress={toggle} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <ChevronDown
          size={18}
          color={Colors.text.muted}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </View>
      {open && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="Help & Support" tone="surface" bordered />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Answers to the most common questions about buying, selling, and staying safe on Aroge.
        </Text>

        <Card padded={false} style={styles.card}>
          {FAQS.map((faq, i) => (
            <View key={faq.question} style={i > 0 ? styles.divider : undefined}>
              <FaqRow faq={faq} />
            </View>
          ))}
        </Card>

        <Card style={styles.contactCard}>
          <MessageCircle size={22} color={Colors.green.primary} strokeWidth={1.75} />
          <Text style={styles.contactTitle}>Question about a specific order?</Text>
          <Text style={styles.contactBody}>
            The buyer or seller on that order is usually the fastest way to sort things out. A
            dedicated Aroge support contact is coming soon for everything else.
          </Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/messages')} style={styles.contactLink}>
            <Text style={styles.contactLinkText}>Go to Messages</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing[4], paddingBottom: 48, gap: Spacing[3] },
  intro: {
    fontFamily: FontFamily.interRegular,
    fontSize: 13,
    color: Colors.inkSoft,
    lineHeight: 19,
  },
  card: { overflow: 'hidden' },
  divider: { borderTopWidth: 1, borderTopColor: Colors.line },
  faqRow: { padding: Spacing[4], gap: 8 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  faqQuestion: {
    flex: 1,
    fontFamily: FontFamily.interSemibold,
    fontSize: 14,
    color: Colors.ink,
  },
  faqAnswer: {
    fontFamily: FontFamily.interRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.inkSoft,
  },
  contactCard: { alignItems: 'center', gap: 6, paddingVertical: Spacing[5] },
  contactTitle: { fontFamily: FontFamily.displaySemibold, fontSize: 15, color: Colors.ink },
  contactBody: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12.5,
    color: Colors.inkSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactLink: {
    marginTop: 4,
    backgroundColor: Colors.green.tint,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  contactLinkText: { fontFamily: FontFamily.interBold, fontSize: 13, color: Colors.green.primary },
});
