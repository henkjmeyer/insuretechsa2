import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export default function PolicyDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  async function fetchPolicy() {
    setLoading(true);
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('id', id)
      .single();
    if (!error) setPolicy(data);
    setLoading(false);
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );

  if (!policy) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Policy not found.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{policy.insurer}</Text>
        <Text style={styles.sub}>{policy.policy_type?.toUpperCase()} POLICY</Text>
        <View style={styles.card}>
          <Row label="Policy Number" value={policy.policy_number} />
          <Row label="Premium" value={`R ${parseFloat(policy.premium_amount).toFixed(2)}`} />
          <Row label="Start Date" value={policy.start_date} />
          <Row label="Expiry Date" value={policy.expiry_date} />
          <Row label="Status" value={policy.status?.toUpperCase()} />
          {policy.notes ? <Row label="Notes" value={policy.notes} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { padding: Spacing.md },
  backText: { color: Colors.accent, fontSize: FontSize.base },
  content: { padding: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  sub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary },
  value: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium, maxWidth: '60%', textAlign: 'right' },
  errorText: { color: Colors.textSecondary, fontSize: FontSize.base },
});
