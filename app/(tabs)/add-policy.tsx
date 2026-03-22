import { router } from 'expo-router'
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

import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import type { PolicyStatus, PolicyType } from '@/types/policy'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

// ─── Config ───────────────────────────────────────────────────────────────────

const POLICY_TYPES: { key: PolicyType; label: string; emoji: string }[] = [
  { key: 'motor',    label: 'Motor',    emoji: '🚗' },
  { key: 'home',     label: 'Home',     emoji: '🏠' },
  { key: 'life',     label: 'Life',     emoji: '💙' },
  { key: 'health',   label: 'Health',   emoji: '❤️' },
  { key: 'travel',   label: 'Travel',   emoji: '✈️' },
  { key: 'business', label: 'Business', emoji: '🏢' },
  { key: 'other',    label: 'Other',    emoji: '📄' },
]

const FREQUENCIES: { key: 'monthly' | 'annual'; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'annual',  label: 'Annual' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Validate and normalise a date string typed as DD/MM/YYYY → YYYY-MM-DD */
function parseDateInput(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9/]/g, '')
  const parts = cleaned.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || y < 2000 || y > 2100) return null
  const date = new Date(y, m - 1, d)
  if (date.getMonth() !== m - 1) return null // invalid day for month
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Auto-insert slashes as user types */
function formatDateTyping(prev: string, next: string): string {
  const digits = next.replace(/\D/g, '').slice(0, 8)
  let out = digits
  if (digits.length > 2) out = digits.slice(0, 2) + '/' + digits.slice(2)
  if (digits.length > 4) out = out.slice(0, 5) + '/' + out.slice(5)
  return out
}

function stripNonNumeric(s: string): string {
  return s.replace(/[^0-9.]/g, '')
}

// ─── Form state type ─────────────────────────────────────────────────────────

type FormData = {
  type: PolicyType
  insurer: string
  policy_number: string
  status: PolicyStatus
  premium_amount: string
  premium_frequency: 'monthly' | 'annual'
  start_date: string       // display as DD/MM/YYYY
  expiry_date: string      // display as DD/MM/YYYY
  cover_amount: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const INITIAL: FormData = {
  type: 'motor',
  insurer: '',
  policy_number: '',
  status: 'active',
  premium_amount: '',
  premium_frequency: 'monthly',
  start_date: '',
  expiry_date: '',
  cover_amount: '',
  notes: '',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AddPolicyScreen() {
  const { user } = useAuth()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<FormErrors>({})
  const [focused, setFocused] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (key: keyof FormData) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const setDate = (key: 'start_date' | 'expiry_date') => (raw: string) => {
    const formatted = formatDateTyping(form[key], raw)
    setForm(f => ({ ...f, [key]: formatted }))
  }

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {}

    if (!form.insurer.trim())       e.insurer = 'Insurer name is required'
    if (!form.policy_number.trim()) e.policy_number = 'Policy number is required'

    const premium = parseFloat(form.premium_amount)
    if (!form.premium_amount || isNaN(premium) || premium <= 0)
      e.premium_amount = 'Enter a valid premium amount'

    if (!form.start_date)
      e.start_date = 'Start date is required'
    else if (!parseDateInput(form.start_date))
      e.start_date = 'Use DD/MM/YYYY format'

    if (!form.expiry_date)
      e.expiry_date = 'Expiry date is required'
    else if (!parseDateInput(form.expiry_date))
      e.expiry_date = 'Use DD/MM/YYYY format'

    if (form.cover_amount) {
      const ca = parseFloat(form.cover_amount)
      if (isNaN(ca) || ca <= 0) e.cover_amount = 'Enter a valid cover amount'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate() || !user) return
    setLoading(true)

    const { error } = await supabase.from('policies').insert({
      user_id:            user.id,
      type:               form.type,
      insurer:            form.insurer.trim(),
      policy_number:      form.policy_number.trim(),
      status:             form.status,
      premium_amount:     parseFloat(form.premium_amount),
      premium_frequency:  form.premium_frequency,
      start_date:         parseDateInput(form.start_date),
      expiry_date:        parseDateInput(form.expiry_date),
      cover_amount:       form.cover_amount ? parseFloat(form.cover_amount) : null,
      notes:              form.notes.trim() || null,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Save failed', error.message)
    } else {
      Alert.alert('Policy saved', 'Your policy has been added successfully.', [
        { text: 'Done', onPress: () => router.replace('/(tabs)/policies') },
      ])
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Add Policy</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Section: Policy Type ──────────────────────── */}
          <SectionLabel>Policy Type</SectionLabel>
          <View style={styles.typeGrid}>
            {POLICY_TYPES.map(t => (
              <Pressable
                key={t.key}
                style={[styles.typeTile, form.type === t.key && styles.typeTileActive]}
                onPress={() => setForm(f => ({ ...f, type: t.key }))}
              >
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <Text style={[styles.typeLabel, form.type === t.key && styles.typeLabelActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── Section: Basic Details ────────────────────── */}
          <SectionLabel>Policy Details</SectionLabel>
          <View style={styles.card}>
            <Field label="Insurer / Provider" required error={errors.insurer}>
              <TextInput
                style={[styles.input, focused === 'insurer' && styles.inputFocused, errors.insurer && styles.inputError]}
                placeholder="e.g. Outsurance, Discovery, Sanlam"
                placeholderTextColor={Colors.textMuted}
                value={form.insurer}
                onChangeText={set('insurer')}
                onFocus={() => setFocused('insurer')}
                onBlur={() => setFocused(null)}
                autoCapitalize="words"
              />
            </Field>

            <Divider />

            <Field label="Policy Number" required error={errors.policy_number}>
              <TextInput
                style={[styles.input, focused === 'policy_number' && styles.inputFocused, errors.policy_number && styles.inputError]}
                placeholder="e.g. POL-2024-001234"
                placeholderTextColor={Colors.textMuted}
                value={form.policy_number}
                onChangeText={set('policy_number')}
                onFocus={() => setFocused('policy_number')}
                onBlur={() => setFocused(null)}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Field>

            <Divider />

            <Field label="Status">
              <View style={styles.segmentRow}>
                {(['active', 'pending', 'cancelled'] as PolicyStatus[]).map(s => (
                  <Pressable
                    key={s}
                    style={[styles.segment, form.status === s && styles.segmentActive]}
                    onPress={() => setForm(f => ({ ...f, status: s }))}
                  >
                    <Text style={[styles.segmentText, form.status === s && styles.segmentTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>
          </View>

          {/* ── Section: Dates ────────────────────────────── */}
          <SectionLabel>Coverage Period</SectionLabel>
          <View style={styles.card}>
            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Field label="Start Date" required error={errors.start_date}>
                  <TextInput
                    style={[styles.input, focused === 'start_date' && styles.inputFocused, errors.start_date && styles.inputError]}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={Colors.textMuted}
                    value={form.start_date}
                    onChangeText={setDate('start_date')}
                    onFocus={() => setFocused('start_date')}
                    onBlur={() => setFocused(null)}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </Field>
              </View>
              <View style={styles.halfField}>
                <Field label="Expiry Date" required error={errors.expiry_date}>
                  <TextInput
                    style={[styles.input, focused === 'expiry_date' && styles.inputFocused, errors.expiry_date && styles.inputError]}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={Colors.textMuted}
                    value={form.expiry_date}
                    onChangeText={setDate('expiry_date')}
                    onFocus={() => setFocused('expiry_date')}
                    onBlur={() => setFocused(null)}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </Field>
              </View>
            </View>
          </View>

          {/* ── Section: Premium ──────────────────────────── */}
          <SectionLabel>Premium</SectionLabel>
          <View style={styles.card}>
            <Field label="Premium Amount (ZAR)" required error={errors.premium_amount}>
              <View style={styles.currencyWrap}>
                <Text style={styles.currencyPrefix}>R</Text>
                <TextInput
                  style={[styles.input, styles.currencyInput, focused === 'premium_amount' && styles.inputFocused, errors.premium_amount && styles.inputError]}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  value={form.premium_amount}
                  onChangeText={v => set('premium_amount')(stripNonNumeric(v))}
                  onFocus={() => setFocused('premium_amount')}
                  onBlur={() => setFocused(null)}
                  keyboardType="decimal-pad"
                />
              </View>
            </Field>

            <Divider />

            <Field label="Frequency">
              <View style={styles.segmentRow}>
                {FREQUENCIES.map(f => (
                  <Pressable
                    key={f.key}
                    style={[styles.segment, form.premium_frequency === f.key && styles.segmentActive]}
                    onPress={() => setForm(fr => ({ ...fr, premium_frequency: f.key }))}
                  >
                    <Text style={[styles.segmentText, form.premium_frequency === f.key && styles.segmentTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <Divider />

            <Field label="Cover Amount (ZAR)" hint="Optional" error={errors.cover_amount}>
              <View style={styles.currencyWrap}>
                <Text style={styles.currencyPrefix}>R</Text>
                <TextInput
                  style={[styles.input, styles.currencyInput, focused === 'cover_amount' && styles.inputFocused, errors.cover_amount && styles.inputError]}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  value={form.cover_amount}
                  onChangeText={v => set('cover_amount')(stripNonNumeric(v))}
                  onFocus={() => setFocused('cover_amount')}
                  onBlur={() => setFocused(null)}
                  keyboardType="decimal-pad"
                />
              </View>
            </Field>
          </View>

          {/* ── Section: Notes ────────────────────────────── */}
          <SectionLabel>Notes <Text style={styles.optionalTag}>(optional)</Text></SectionLabel>
          <View style={styles.card}>
            <TextInput
              style={[styles.input, styles.textarea, focused === 'notes' && styles.inputFocused]}
              placeholder="Add any additional details, broker contact, vehicle registration, etc."
              placeholderTextColor={Colors.textMuted}
              value={form.notes}
              onChangeText={set('notes')}
              onFocus={() => setFocused('notes')}
              onBlur={() => setFocused(null)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* ── Save button ───────────────────────────────── */}
          <Pressable
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Policy</Text>
            }
          </Pressable>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Local sub-components ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>
}

function Divider() {
  return <View style={styles.divider} />
}

function Field({
  label, required, hint, error, children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      </View>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    width: 60,
  },
  backText: {
    fontSize: FontSize.base,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Section label
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  optionalTag: {
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
  },

  // Type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeTile: {
    width: '13%',
    minWidth: 44,
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: 4,
    ...Shadow.card,
  },
  typeTileActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeEmoji: {
    fontSize: 20,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: '#fff',
  },

  // Card container
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.card,
  },

  // Field
  fieldWrap: {
    paddingVertical: Spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  fieldHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  fieldError: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
  },
  required: {
    color: Colors.danger,
  },

  // Input
  input: {
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
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
  },
  textarea: {
    height: 100,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },

  // Currency
  currencyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currencyPrefix: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    width: 18,
  },
  currencyInput: {
    flex: 1,
  },

  // Segment control
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: '#fff',
  },

  // Row fields (side by side)
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfField: {
    flex: 1,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },

  // Save button
  saveBtn: {
    height: 54,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    ...Shadow.elevated,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
    letterSpacing: 0.3,
  },
})
