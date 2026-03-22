import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { ScoreRing } from '@/components/ui/score-ring'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

// ─── Types ───────────────────────────────────────────────────────────────────

type Stats = {
  activePolicies: number
  pendingClaims: number
  expiringSoon: number
}

type AlertItem = {
  id: string
  title: string
  body: string
  severity: 'info' | 'warning' | 'danger'
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function firstName(fullName?: string | null): string {
  if (!fullName) return 'there'
  return fullName.split(' ')[0]
}

function initials(fullName?: string | null): string {
  if (!fullName) return '?'
  return fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const SEVERITY_COLOR: Record<AlertItem['severity'], string> = {
  info: Colors.info,
  warning: Colors.warning,
  danger: Colors.danger,
}

const SEVERITY_BG: Record<AlertItem['severity'], string> = {
  info: '#EFF9FF',
  warning: '#FFFBEB',
  danger: '#FEF2F2',
}

const SEVERITY_ICON: Record<AlertItem['severity'], string> = {
  info: 'ℹ',
  warning: '⚠',
  danger: '✕',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ activePolicies: 0, pendingClaims: 0, expiringSoon: 0 })
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [score, setScore] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fullName = user?.user_metadata?.full_name as string | undefined

  const fetchDashboard = async () => {
    if (!user) return

    const [policiesRes, claimsRes, alertsRes] = await Promise.all([
      supabase
        .from('policies')
        .select('id, status, expiry_date', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'active'),

      supabase
        .from('claims')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'pending'),

      supabase
        .from('alerts')
        .select('id, title, body, severity, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const activePolicies = policiesRes.count ?? 0
    const pendingClaims = claimsRes.count ?? 0

    // Expiring within 30 days
    const in30 = new Date()
    in30.setDate(in30.getDate() + 30)
    const expiringSoon = (policiesRes.data ?? []).filter(p => {
      if (!p.expiry_date) return false
      return new Date(p.expiry_date) <= in30
    }).length

    // Simple protection score: starts at 40, +20 per active policy (max 40), -10 per pending claim
    const computed = Math.min(100, Math.max(0,
      40
      + Math.min(activePolicies * 20, 40)
      - pendingClaims * 10
      - expiringSoon * 5
    ))

    setStats({ activePolicies, pendingClaims, expiringSoon })
    setAlerts((alertsRes.data as AlertItem[]) ?? [])
    setScore(computed)
  }

  const load = async () => {
    setLoading(true)
    await fetchDashboard()
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDashboard()
    setRefreshing(false)
  }

  useEffect(() => { load() }, [user])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* ── Top bar ─────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appLabel}>InsureTech</Text>
            <Text style={styles.topDate}>{formatDate()}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(fullName)}</Text>
          </View>
        </View>

        {/* ── Hero card ───────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={styles.heroName}>{firstName(fullName)}</Text>
            <Text style={styles.heroSub}>Here's your protection overview.</Text>

            <View style={styles.scoreLabelRow}>
              <View style={styles.scoreDot} />
              <Text style={styles.scoreLabelText}>Protection Score</Text>
            </View>
          </View>

          {loading
            ? <ActivityIndicator color={Colors.accent} size="large" style={{ marginRight: Spacing.md }} />
            : <ScoreRing score={score} size={120} />
          }
        </View>

        {/* ── Stats row ───────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            value={loading ? '—' : String(stats.activePolicies)}
            label="Active Policies"
            accent={Colors.accent}
          />
          <StatCard
            value={loading ? '—' : String(stats.pendingClaims)}
            label="Pending Claims"
            accent={stats.pendingClaims > 0 ? Colors.warning : Colors.success}
          />
          <StatCard
            value={loading ? '—' : String(stats.expiringSoon)}
            label="Expiring Soon"
            accent={stats.expiringSoon > 0 ? Colors.danger : Colors.success}
          />
        </View>

        {/* ── Alerts ──────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {alerts.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{alerts.length}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.lg }} />
          ) : alerts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptySub}>No alerts right now. You're on top of things.</Text>
            </View>
          ) : (
            alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </View>

        {/* ── Quick action ────────────────────────────────── */}
        <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/add-policy')}>
          <Text style={styles.quickActionIcon}>+</Text>
          <View>
            <Text style={styles.quickActionTitle}>Add a policy</Text>
            <Text style={styles.quickActionSub}>Link a new insurance policy to your account</Text>
          </View>
          <Text style={styles.quickActionChevron}>›</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}

function AlertCard({ alert }: { alert: AlertItem }) {
  const color = SEVERITY_COLOR[alert.severity]
  const bg = SEVERITY_BG[alert.severity]
  const icon = SEVERITY_ICON[alert.severity]

  return (
    <View style={alertStyles.card}>
      <View style={[alertStyles.iconWrap, { backgroundColor: bg }]}>
        <Text style={[alertStyles.icon, { color }]}>{icon}</Text>
      </View>
      <View style={alertStyles.body}>
        <Text style={alertStyles.title}>{alert.title}</Text>
        <Text style={alertStyles.message} numberOfLines={2}>{alert.body}</Text>
      </View>
      <View style={[alertStyles.pill, { backgroundColor: bg }]}>
        <Text style={[alertStyles.pillText, { color }]}>{alert.severity}</Text>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Spacing.xxl,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  appLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  topDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },

  // Hero card
  heroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadow.elevated,
  },
  heroLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  greetingText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: FontWeight.medium,
  },
  heroName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  scoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  scoreLabelText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },

  // Sections
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },

  // Empty state
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.card,
  },
  emptyIcon: {
    fontSize: 28,
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Quick action
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  quickActionIcon: {
    fontSize: FontSize.xl,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    width: 36,
    textAlign: 'center',
  },
  quickActionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  quickActionSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    flex: 1,
  },
  quickActionChevron: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
  },
})

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    ...Shadow.card,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
})

const alertStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  pill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
})
