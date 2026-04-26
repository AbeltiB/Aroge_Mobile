import React, { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { LogoMark } from '../componenets/ui/LogoMark';
import { Button } from '../componenets/ui/Button';
import { PhoneInput } from '../componenets/ui/PhoneInput';
import { OTPInput } from '../componenets/ui/Otpinput';
import { useAuth } from '../hooks/useAuth';
import {
    BorderRadius,
    Colors,
    FontFamily,
    FontSize,
    FontWeight,
    Layout,
    LetterSpacing,
    LineHeight,
    Spacing,
} from '../constants';

export default function AuthScreen() {
    const {
        step,
        phoneNumber,
        loading,
        error,
        initiatePhoneAuth,
        verifyOTP,
        initiateTelegramAuth,
        resetAuth,
        setPhoneNumber,
    } = useAuth();

    const [otpValue, setOtpValue] = React.useState('');

    // Animated values
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardTranslateY = useRef(new Animated.Value(32)).current;
    const shakeX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(cardTranslateY, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Shake card on error
    useEffect(() => {
        if (error) {
            Animated.sequence([
                Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]).start();
        }
    }, [error]);

    // Navigate to app on success
    useEffect(() => {
        if (step === 'success') {
            router.replace('/(app)');
        }
    }, [step]);

    const handlePhoneSubmit = useCallback(() => {
        initiatePhoneAuth(phoneNumber);
    }, [phoneNumber, initiatePhoneAuth]);

    const handleOTPSubmit = useCallback(() => {
        verifyOTP(otpValue);
    }, [otpValue, verifyOTP]);

    const handleBack = useCallback(() => {
        setOtpValue('');
        resetAuth();
    }, [resetAuth]);

    const isOTPStep = step === 'otp';

    return (
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            {/* Subtle top gradient accent */}
            <LinearGradient
                colors={[`${Colors.green.primary}14`, 'transparent']}
                style={styles.topAccent}
                pointerEvents="none"
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <LogoMark size={56} color={Colors.green.primary} accentColor={Colors.gold.primary} showRing />
                        <Text style={styles.wordmark}>AROGE</Text>
                        <Text style={styles.wordmarkAmharic}>አሮጌ</Text>
                    </View>

                    {/* Card */}
                    <Animated.View
                        style={[
                            styles.card,
                            {
                                opacity: cardOpacity,
                                transform: [{ translateY: cardTranslateY }, { translateX: shakeX }],
                            },
                        ]}
                    >
                        {isOTPStep ? (
                            // ── OTP step ──────────────────────────
                            <>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>Enter the code</Text>
                                    <Text style={styles.cardSubtitle}>
                                        We sent a 6-digit code to{'\n'}
                                        <Text style={styles.phoneHighlight}>+251 {phoneNumber}</Text>
                                    </Text>
                                </View>

                                <OTPInput
                                    value={otpValue}
                                    onChange={setOtpValue}
                                    error={!!error}  // ✅ FIX: Check error truthiness, not step === 'error'
                                    autoFocus
                                />

                                {error && <Text style={styles.errorText}>{error}</Text>}

                                <Button
                                    label="Verify"
                                    variant="primary"
                                    size="lg"
                                    loading={loading}
                                    disabled={otpValue.length < 6}
                                    onPress={handleOTPSubmit}
                                    style={styles.submitBtn}
                                />

                                <Pressable onPress={handleBack} style={styles.backRow}>
                                    <Text style={styles.backText}>← Change number</Text>
                                </Pressable>

                                <ResendRow phoneNumber={phoneNumber} onResend={() => initiatePhoneAuth(phoneNumber)} />
                            </>
                        ) : (
                            // ── Phone entry step ──────────────────
                            <>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>Welcome back</Text>
                                    <Text style={styles.cardSubtitle}>
                                        Sign in or create your account to start buying and selling.
                                    </Text>
                                </View>

                                <PhoneInput
                                    label="Phone number"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    error={error ?? undefined}
                                    onSubmitEditing={handlePhoneSubmit}
                                    returnKeyType="go"
                                    autoFocus
                                />

                                {error && <Text style={styles.errorText}>{error}</Text>}

                                <Button
                                    label="Continue with phone"
                                    variant="primary"
                                    size="lg"
                                    loading={loading}
                                    disabled={phoneNumber.length < 9}
                                    onPress={handlePhoneSubmit}
                                    style={styles.submitBtn}
                                />

                                <Divider />

                                <Button
                                    label="Continue with Telegram"
                                    variant="telegram"
                                    size="lg"
                                    loading={false}
                                    onPress={initiateTelegramAuth}
                                    icon={<Text style={styles.telegramIcon}>✈</Text>}
                                    iconPosition="left"
                                />

                                <Text style={styles.terms}>
                                    By continuing, you agree to our{' '}
                                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                    <Text style={styles.termsLink}>Privacy Policy</Text>.
                                </Text>
                            </>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Divider() {
    return (
        <View style={dividerStyles.row}>
            <View style={dividerStyles.line} />
            <Text style={dividerStyles.text}>or</Text>
            <View style={dividerStyles.line} />
        </View>
    );
}

const dividerStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: Spacing[4],
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border.default,
    },
    text: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.text.muted,
    },
});

interface ResendRowProps {
    phoneNumber: string;
    onResend: () => void;
}

function ResendRow({ phoneNumber, onResend }: ResendRowProps) {
    const [countdown, setCountdown] = React.useState(30);

    useEffect(() => {
        if (countdown <= 0) return;
        const t = setInterval(() => setCountdown((c) => c - 1), 1000);
        return () => clearInterval(t);
    }, [countdown]);

    return (
        <View style={resendStyles.row}>
            <Text style={resendStyles.text}>Didn't receive the code? </Text>
            {countdown > 0 ? (
                <Text style={resendStyles.timer}>Resend in {countdown}s</Text>
            ) : (
                <Pressable
                    onPress={() => {
                        onResend();
                        setCountdown(30);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={resendStyles.link}>Resend</Text>
                </Pressable>
            )}
        </View>
    );
}

const resendStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing[2],
    },
    text: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.text.muted,
    },
    timer: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.text.muted,
    },
    link: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.green.primary,
        textDecorationLine: 'underline',
    },
});

// ── Main styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.cream.background,
    },
    flex: {
        flex: 1,
    },
    topAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: Layout.pagePadding,
        paddingBottom: Spacing[8],
    },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: Spacing[8],
        paddingBottom: Spacing[6],
        gap: 4,
    },
    wordmark: {
        fontFamily: FontFamily.serif,
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.regular,
        color: Colors.green.primary,
        letterSpacing: 10,
        marginTop: Spacing[3],
    },
    wordmarkAmharic: {
        fontFamily: FontFamily.serif,
        fontSize: FontSize.xs,
        color: Colors.gold.primary,
        letterSpacing: LetterSpacing.eyebrow,
        textTransform: 'uppercase',
    },

    // Card
    card: {
        backgroundColor: Colors.cream.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing[6],
        gap: Spacing[4],
        shadowColor: Colors.green.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    cardHeader: {
        gap: Spacing[2],
        marginBottom: Spacing[2],
    },
    cardTitle: {
        fontFamily: FontFamily.serif,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.regular,
        color: Colors.text.primary,
        letterSpacing: LetterSpacing.tight,
    },
    cardSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.base,
        color: Colors.text.secondary,
        lineHeight: FontSize.base * LineHeight.normal,
    },
    phoneHighlight: {
        fontWeight: FontWeight.semibold,
        color: Colors.green.primary,
    },

    // Misc
    submitBtn: {
        marginTop: Spacing[2],
    },
    errorText: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.error,
        textAlign: 'center',
        marginTop: -Spacing[2],
    },
    backRow: {
        alignItems: 'center',
        paddingVertical: Spacing[1],
    },
    backText: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.text.secondary,
    },
    telegramIcon: {
        fontSize: 16,
        color: '#fff',
        transform: [{ rotate: '45deg' }],
    },
    terms: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.text.muted,
        textAlign: 'center',
        lineHeight: FontSize.xs * 1.6,
    },
    termsLink: {
        color: Colors.green.primary,
        textDecorationLine: 'underline',
    },
});