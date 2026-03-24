import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
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
import type { Policy, PolicyStatus, PolicyType } from '@/types/policy'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

// ─── Config maps ─────────────────────────────────────────────────────────────

const TYPE_ICON: Record<PolicyType, string> = {
  motor:    '🚗',
  home:     '🏠',
  life:     '💙',
  health:   '❤️',
  travel:   '✈️',
  business: '🏢',
  other:    '📄',
}

const TYPE_LABEL: Record<PolicyType, string> = {
  motor:    'Motor',
  home:     'Home',
  life:     'Life',
  health:   'Health',
  travel:   'Travel',
  business: 'Business',
  other:    'Other',
}

const STATUS_COLOR: Record<PolicyStatus, string> = {
  active:    Colors.success,
  expiring:  Colors.warning,
  expired:   Colors.danger,
  lapsed:    Colors.danger,
  pending:   Colors.info,
  cancelled: Colors.textMuted,
}

const STATUS_BG: Record<PolicyStatus, string> = {
  active:    '#F0FDF4',
  expiring:  '#FFFBEB',
  expired:   '#FEF2F2',
  lapsed:    '#FEF2F2',
  pending:   '#EFF9FF',
  cancelled: '#F8FAFC',
}

type FilterOption = 'all' | PolicyStatus

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'expiring',  label: 'Expiring' },
  { key: 'expired',   label: 'Expired' },
  { key: 'lapsed',    label: 'Lapsed' },
  { key: 'pending',   label: 'Pending' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount)
}

function formatExpiry(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

/** Derive status from expiry_date if status is 'active' */
function resolveStatus(policy: Policy): PolicyStatus {
  if (policy.status !== 'active') return policy.status
  if (!policy.expiry_date) return 'active'
  const days = daysUntil(policy.expiry_date)
  if (days < 0)  return 'expired'
  if (days <= 30) return 'expiring'
  return 'active'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PoliciesScreen() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [filter, setFilter] = useState<FilterOption>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPolicies = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('policies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setPolicies((data as Policy[]) ?? [])
  }, [user])

  const load = async () => {
    setLoading(true)
    await fetchPolicies()
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPolicies()
    setRefreshing(false)
  }

  useEffect(() => { load() }, [user])

  const displayed = policies.filter(p => {
    if (filter === 'all') return true
    return resolveStatus(p) === filter
  })

  // Count per status for filter badges
  const counts = policies.reduce<Record<string, number>>((acc, p) => {
    const s = resolveStatus(p)
    acc[s] = (acc[s] ?? 0) + 1
    acc.all = (acc.all ?? 0) + 1
    return acc
  }, { all: 0 })

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Policies</Text>
          <Text style={styles.headerSub}>
            {loading ? '…' : `${policies.length} polic${policies.length === 1 ? 'y' : 'ies'} on file`}
          </Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/(tabs)/add-policy')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {/* ── Filter chips ────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => {
          const active = filter === f.key
          const count = counts[f.key] ?? 0
          return (
            <Pressable
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
                  <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          )
        })}
      </ScrollView>

      {/* ── List ────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : displayed.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          renderItem={({ item }) => <PolicyCard policy={item} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  )
}

// ─── PolicyCard ───────────────────────────────────────────────────────────────

function PolicyCard({ policy }: { policy: Policy }) {
  const status = resolveStatus(policy)
  const days = policy.expiry_date ? daysUntil(policy.expiry_date) : null

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/(tabs)/policy-detail', params: { id: policy.id } })}
    >
      {/* Left icon */}
      <View style={[styles.typeIcon, { backgroundColor: STATUS_BG[status] }]}>
        <Text style={styles.typeEmoji}>{TYPE_ICON[policy.type as PolicyType] ?? '📄'}</Text>
      </View>

      {/* Main content */}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardInsurer} numberOfLines={1}>{policy.insurer}</Text>
          <StatusBadge status={status} />
        </View>

        <Text style={styles.cardType}>{TYPE_LABEL[policy.type as PolicyType] ?? 'Insurance'} Policy</Text>

        <Text style={styles.cardPolicyNum} numberOfLines={1}>{policy.policy_number}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardPremium}>
            {formatZAR(policy.premium_amount)}
            <Text style={styles.cardFreq}>/{policy.premium_frequency === 'monthly' ? 'mo' : 'yr'}</Text>
          </Text>

          {policy.expiry_date && (
            <View style={styles.expiryWrap}>
              {status === 'expiring' && days !== null && (
                <View style={styles.urgentDot} />
              )}
              <Text style={[
                styles.cardExpiry,
                status === 'expiring' && styles.cardExpiryWarn,
                status === 'expired' && styles.cardExpiryDanger,
              ]}>
                {status === 'expired'
                  ? `Expired ${formatExpiry(policy.expiry_date)}`
                  : status === 'expiring' && days !== null
                  ? `Expires in ${days}d`
                  : `Until ${formatExpiry(policy.expiry_date)}`
                }
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  )
}

function StatusBadge({ status }: { status: PolicyStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_BG[status] }]}>
      <View style={[styles.badgeDot, { backgroundColor: STATUS_COLOR[status] }]} />
      <Text style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  )
}

function EmptyState({ filter }: { filter: FilterOption }) {
  const isFiltered = filter !== 'all'
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{isFiltered ? '🔍' : '🛡️'}</Text>
      <Text style={styles.emptyTitle}>
        {isFiltered ? `No ${filter} policies` : 'No policies yet'}
      </Text>
      <Text style={styles.emptySub}>
        {isFiltered
          ? `You don't have any ${filter} policies at the moment.`
          : 'Add your first insurance policy to start tracking your coverage.'
        }
      </Text>
      {!isFiltered && (
        <Pressable
          style={styles.emptyBtn}
          onPress={() => router.push('/(tabs)/add-policy')}
        >
          <Text style={styles.emptyBtnText}>+ Add your first policy</Text>
        </Pressable>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Filters
  filterRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  chipBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  chipBadgeTextActive: {
    color: '#fff',
  },

  // List
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.card,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeEmoji: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInsurer: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardType: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cardPolicyNum: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  cardPremium: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  cardFreq: {
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  expiryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.warning,
  },
  cardExpiry: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  cardExpiryWarn: {
    color: Colors.warning,
  },
  cardExpiryDanger: {
    color: Colors.danger,
  },
  chevron: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
    lineHeight: FontSize.xl + 2,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Empty state
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    ...Shadow.card,
  },
  emptyBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
})
