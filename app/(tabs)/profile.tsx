import { router } from 'expo-router'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/context/auth-context'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

function initials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

type MenuItemProps = {
  icon: string
  label: string
  value?: string
  onPress?: () => void
  destructive?: boolean
  disabled?: boolean
}

function MenuItem({ icon, label, value, onPress, destructive, disabled }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && !disabled && styles.menuItemPressed]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.menuIcon, destructive && styles.menuIconDestructive]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive, disabled && styles.menuLabelDisabled]}>
        {label}
      </Text>
      {value
        ? <Text style={styles.menuValue}>{value}</Text>
        : !disabled && <Text style={styles.menuChevron}>›</Text>
      }
    </Pressable>
  )
}

function MenuDivider() {
  return <View style={styles.menuDivider} />
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const fullName = user?.user_metadata?.full_name as string | undefined
  const email = user?.email ?? ''

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* ── Avatar card ────────────────────────────── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials(fullName)}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{fullName ?? 'User'}</Text>
            <Text style={styles.avatarEmail}>{email}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        </View>

        {/* ── My Insurance ────────────────────────────── */}
        <Text style={styles.sectionLabel}>My Insurance</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="🛡️"
            label="My Policies"
            onPress={() => router.push('/(tabs)/policies')}
          />
          <MenuDivider />
          <MenuItem
            icon="📋"
            label="Claims"
            value="Coming soon"
            disabled
          />
          <MenuDivider />
          <MenuItem
            icon="📎"
            label="Documents & Evidence"
            value="Coming soon"
            disabled
          />
          <MenuDivider />
          <MenuItem
            icon="🔔"
            label="Alerts & Reminders"
            value="Coming soon"
            disabled
          />
        </View>

        {/* ── Account ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="👤"
            label="Edit Profile"
            value="Coming soon"
            disabled
          />
          <MenuDivider />
          <MenuItem
            icon="🔒"
            label="Change Password"
            value="Coming soon"
            disabled
          />
          <MenuDivider />
          <MenuItem
            icon="🌍"
            label="Region"
            value="South Africa"
            disabled
          />
        </View>

        {/* ── Support ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="❓"
            label="Help & FAQ"
            value="Coming soon"
            disabled
          />
          <MenuDivider />
          <MenuItem
            icon="📧"
            label="Contact Support"
            value="Coming soon"
            disabled
          />
        </View>

        {/* ── Sign out ─────────────────────────────────── */}
        <View style={[styles.menuCard, { marginTop: Spacing.lg }]}>
          <MenuItem
            icon="🚪"
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </View>

        {/* ── Version ──────────────────────────────────── */}
        <Text style={styles.version}>InsureTech · MVP v1.0 · South Africa</Text>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Spacing.xxl,
  },

  // Header
  header: {
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

  // Avatar card
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.elevated,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
    marginBottom: 2,
  },
  avatarEmail: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.55)',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(26,166,241,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },

  // Section label
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // Menu card
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
    ...Shadow.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  menuItemPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDestructive: {
    backgroundColor: '#FEF2F2',
  },
  menuIconText: {
    fontSize: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuLabelDestructive: {
    color: Colors.danger,
  },
  menuLabelDisabled: {
    color: Colors.textMuted,
  },
  menuValue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  menuChevron: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
    lineHeight: FontSize.xl + 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.md + 32 + Spacing.md,
  },

  // Version
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xl,
    letterSpacing: 0.3,
  },
})
