import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_OPTIONS = ['pending', 'submitted', 'in_review', 'resolved', 'rejected'];

export default function AddClaimScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [amount, setAmount] = useState('');
 const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('claims').insert({
        user_id: user?.id,
        description: description.trim(),
        reference: reference.trim() || null,
        incident_date: incidentDate.trim() || null,
        amount: amount.trim() ? parseFloat(amount) : null,
        status,
        notes: notes.trim() || null,
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Success', 'Claim logged successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>New Claim</Text>
        <Text style={styles.label}>Description *</Text>
        <TextInput style={styles.input} placeholder="Describe what happened" placeholderTextColor={Colors.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        <Text style={styles.label}>Reference Number</Text>
        <TextInput style={styles.input} placeholder="e.g. CLM-2024-001" placeholderTextColor={Colors.textSecondary} value={reference} onChangeText={setReference} />
        <Text style={styles.label}>Incident Date (DD/MM/YYYY)</Text>
        <TextInput style={styles.input} placeholder="e.g. 24/03/2026" placeholderTextColor={Colors.textSecondary} value={incidentDate} onChangeText={setIncidentDate} keyboardType="numeric" />
        <Text style={styles.label}>Claim Amount (R)</Text>
        <TextInput style={styles.input} placeholder="e.g. 5000" placeholderTextColor={Colors.textSecondary} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
              <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>{s.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Notes</Text>
        <TextInput style={styles.input} placeholder="Any additional notes" placeholderTextColor={Colors.textSecondary} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Log Claim</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: { padding: Spacing.md },
  backText: { color: Colors.accent, fontSize: FontSize.base },
  content: { padding: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base, borderWidth: 1, borderColor: Colors.border },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  statusChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  statusChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  statusChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statusChipTextActive: { color: '#fff', fontWeight: FontWeight.bold },
  saveBtn: { backgroundColor: Colors.accent, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.xl },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },

});