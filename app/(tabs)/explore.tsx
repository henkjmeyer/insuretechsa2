import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

const STATUS_COLOR: Record<string, string> = {
  open: '#1AA6F1',
  submitted: '#F59E0B',
  in_review: '#8B5CF6',
  resolved: '#10B981',
  rejected: '#EF4444',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  submitted: 'Submitted',
  in_review: 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export default function ClaimsScreen() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchClaims(); }, []);

  async function fetchClaims() {
    setLoading(true);
    const { data, error } = await supabase
      .from('claims')
      .select('*, policies(insurer, policy_type)')
      .order('created_at', { ascending: false });
    if (!error && data) setClaims(data);
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClaims();
    setRefreshing(false);
  }, []);

  function formatDate(d: string) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Claims</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/add-claim')}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {claims.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No claims yet</Text>
          <Text style={styles.emptySub}>Tap + New to log your first claim.</Text>
        </View>
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          renderItem={({ item }) => (
            <Pressable style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.insurer}>{item.policies?.insurer ?? 'Unknown Insurer'}</Text>
                  <Text style={styles.ref}>Ref: {item.reference ?? 'N/A'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] ?? '#888' }]}>
                  <Text style={styles.badgeText}>{STATUS_LABEL[item.status] ?? item.status}</Text>
                </View>
              </View>
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.meta}>📅 {formatDate(item.incident_date)}</Text>
                {item.amount ? <Text style={styles.meta}>💰 R {parseFloat(item.amount).toFixed(2)}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  heading: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.accent, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  addBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: Spacing.lg, paddingTop: 0 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  insurer: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  ref: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  cardBottom: { flexDirection: 'row', gap: Spacing.md },
  meta: { fontSize: FontSize.sm, color: Colors.textSecondary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
});
