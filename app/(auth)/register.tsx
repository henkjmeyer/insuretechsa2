import { Link, router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { supabase } from '@/lib/supabase'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })
    setLoading(false)

    if (error) {
      Alert.alert('Registration failed', error.message)
    } else {
      Alert.alert(
        'Account created',
        'Please check your email to verify your account, then sign in.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      )
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
            <View style={styles.logoMark}>
              <Text style={styles.logoIcon}>◈</Text>
            </View>
            <Text style={styles.appName}>Get Started</Text>
            <Text style={styles.tagline}>Create your InsureTech account</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create account</Text>
            <Text style={styles.cardSubtitle}>Manage all your policies in one place</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                placeholder="Jane Smith"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, focusedField === 'password' && styles.inputFocused]}
                placeholder="Min. 8 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'confirm' && styles.inputFocused,
                  confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
                ]}
                placeholder="Repeat password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorHint}>Passwords don't match</Text>
              )}
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Create Account</Text>
              }
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          <Text style={styles.legal}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // Header
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: FontWeight.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.elevated,
  },
  logoIcon: {
    fontSize: 26,
    color: '#fff',
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.55)',
    marginTop: Spacing.xs,
    letterSpacing: 0.2,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.elevated,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  // Fields
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: '#F0F9FF',
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#FFF5F5',
  },
  errorHint: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },

  // Button
  button: {
    height: 52,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },

  legal: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.35)',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    lineHeight: 16,
  },
})
