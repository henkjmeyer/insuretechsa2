import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Claim = {
  id: string;
  description: string;
  reference: string | null;
  status: string;
  amount: number | null;
  incident_date: string | null;
  submitted_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  submitted: Colors.accent,
  in_review: Colors.accent,
  resolved: Colors.success,
  rejected: Colors.danger,
};

export default function ClaimsScreen() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  async function fetchClaims() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', user?.id)
      .order('submitted_at', { ascending: false });
    setClaims(data || []);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Claims</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/add-claim')}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} />
      ) : claims.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No claims yet</Text>
          <Text style={styles.emptySub}>Tap + New to log your first claim</Text>
        </View>
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || Colors.accent }]}>
                  <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
                </View>
              </View>
              {item.reference && <Text style={styles.cardRef}>Ref: {item.reference}</Text>}
              {item.amount && <Text style={styles.cardAmount}>R {item.amount.toLocaleString()}</Text>}
              <Text style={styles.cardDate}>{new Date(item.submitted_at).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.accent, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  addBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  cardDesc: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.bold, marginRight: Spacing.sm },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  statusText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  cardRef: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
  cardAmount: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.bold, marginBottom: 2 },
  cardDate: { fontSize: FontSize.xs, color: Colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary },
});