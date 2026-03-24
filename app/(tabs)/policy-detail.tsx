import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export default function PolicyDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPolicy();
    fetchDocuments();
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

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('policy_id', id)
      .order('created_at', { ascending: false });
    if (!error && data) setDocuments(data);
  }

  async function handleUpload() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = asset.uri.split('.').pop();
      const fileName = `${user?.id}/${id}/${Date.now()}.${fileExt}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(fileName, blob, { contentType: asset.mimeType || 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('evidence').insert({
        policy_id: id,
        user_id: user?.id,
        file_path: fileName,
        photo_url: publicUrl,
      });
      if (dbError) throw dbError;
      await fetchDocuments();
      Alert.alert('Success', 'Document uploaded successfully.');
    } catch (err: any) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
            <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {documents.length === 0 ? (
          <Text style={styles.emptyDocs}>No documents uploaded yet.</Text>
        ) : (
          documents.map((doc) => (
            <View key={doc.id} style={styles.docItem}>
              {doc.category?.startsWith('image') ? (
                <Image source={{ uri: doc.photo_url }} style={styles.docImage} resizeMode="cover" />
              ) : (
                <View style={styles.docFile}>
                  <Text style={styles.docFileName}>📄 {doc.file_path}</Text>
                </View>
              )}
            </View>
          ))
        )}
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
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary },
  value: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium, maxWidth: '60%', textAlign: 'right' },
  errorText: { color: Colors.textSecondary, fontSize: FontSize.base },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  uploadBtn: { backgroundColor: Colors.accent, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  uploadBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  emptyDocs: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.md },
  docItem: { marginBottom: Spacing.md, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.surface },
  docImage: { width: '100%', height: 200 },
  docFile: { padding: Spacing.md },
  docFileName: { color: Colors.textPrimary, fontSize: FontSize.sm },
});
