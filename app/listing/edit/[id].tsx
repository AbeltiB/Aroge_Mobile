import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../src/lib/colors';
import { api } from '../../../src/lib/api';
import type { Category, Listing, ListingPhoto } from '@arogenpm/sdk';
import { ItemCondition } from '@arogenpm/sdk';

const CONDITIONS = Object.values(ItemCondition);
const MAX_PHOTOS = 10;

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [status, setStatus] = useState('DRAFT');
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '',
    condition: ItemCondition.GOOD, price: '', negotiable: false, city: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Listing & { photos?: ListingPhoto[] }>(`/listings/${id}`),
    ]).then(([catRes, listingRes]) => {
      if (catRes.success) setCategories(catRes.data);
      if (listingRes.success) {
        const l = listingRes.data;
        setForm({
          title: l.title, description: l.description, categoryId: l.categoryId,
          condition: l.condition, price: String(l.price),
          negotiable: l.negotiable, city: l.city ?? '',
        });
        setStatus(l.status);
        setPhotos(l.photos ?? []);
      }
      setLoading(false);
    });
  }, [id]);

  function update(key: keyof typeof form, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function pickPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;

    for (const asset of result.assets) {
      const res = await api.uploadFile<ListingPhoto>(`/listings/${id}/photos`, asset.uri, 'photo');
      if (res.success) setPhotos((prev) => [...prev, res.data]);
    }
  }

  async function removePhoto(photoId: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    await api.delete(`/listings/${id}/photos/${photoId}`);
  }

  async function handleSave() {
    if (!form.title || !form.description || !form.categoryId || !form.price) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setSaving(true);
    const res = await api.patch(`/listings/${id}`, { ...form, price: Number(form.price) });
    setSaving(false);
    if (res.success) {
      Alert.alert('Saved', 'Your changes have been saved.', [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      Alert.alert('Error', (res as any).message ?? 'Failed to save changes');
    }
  }

  async function togglePublish() {
    if (photos.length === 0 && status === 'DRAFT') {
      Alert.alert('Add a Photo', 'Add at least one photo before publishing.');
      return;
    }
    const nextStatus = status === 'DRAFT' ? 'ACTIVE' : 'DRAFT';
    const res = await api.patch(`/listings/${id}/status`, { status: nextStatus });
    if (res.success) setStatus(nextStatus);
  }

  function handleArchive() {
    Alert.alert('Archive Listing', 'This removes it from the marketplace. You can\'t undo this.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive', style: 'destructive',
        onPress: async () => {
          const res = await api.delete(`/listings/${id}`);
          if (res.success) router.back();
        },
      },
    ]);
  }

  async function handleDuplicate() {
    const res = await api.post<{ id: string }>('/listings', { ...form, price: Number(form.price) });
    if (res.success) {
      Alert.alert('Duplicated', 'A new draft copy was created. Add photos to publish it.', [
        { text: 'OK', onPress: () => router.replace(`/listing/edit/${res.data.id}` as any) },
      ]);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Listing</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status: {status}</Text>
          {(status === 'DRAFT' || status === 'ACTIVE') && (
            <TouchableOpacity onPress={togglePublish} style={styles.statusToggle}>
              <Text style={styles.statusToggleText}>
                {status === 'DRAFT' ? 'Publish' : 'Unpublish'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Photos ({photos.length}/{MAX_PHOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {photos.map((p) => (
                <View key={p.id} style={styles.photoThumb}>
                  <Image
                    source={{ uri: `https://res.cloudinary.com/demo/image/upload/${p.cloudinaryKey}` }}
                    style={styles.photoImage}
                  />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(p.id)}>
                    <Text style={styles.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={styles.photoAdd} onPress={pickPhotos}>
                  <Text style={styles.photoAddText}>+{'\n'}Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={form.title} onChangeText={(v) => update('title', v)} maxLength={120} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            value={form.description}
            onChangeText={(v) => update('description', v)}
            multiline
            maxLength={2000}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => update('categoryId', cat.id)}
                  style={[styles.chip, form.categoryId === cat.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, form.categoryId === cat.id && styles.chipTextActive]}>{cat.nameEn}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Condition *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => update('condition', c)}
                style={[styles.chip, form.condition === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.condition === c && styles.chipTextActive]}>{c.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Price (ETB) *</Text>
            <TextInput style={styles.input} value={form.price} onChangeText={(v) => update('price', v)} keyboardType="numeric" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Negotiable</Text>
            <Switch
              value={form.negotiable}
              onValueChange={(v) => update('negotiable', v)}
              trackColor={{ true: colors.brand }}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City</Text>
          <TextInput style={styles.input} value={form.city} onChangeText={(v) => update('city', v)} />
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.onAction} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.duplicateBtn} onPress={handleDuplicate}>
          <Text style={styles.duplicateBtnText}>Duplicate as New Draft</Text>
        </TouchableOpacity>

        {status !== 'ARCHIVED' && (
          <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive}>
            <Text style={styles.archiveBtnText}>Archive Listing</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.action, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  back: { color: colors.onAction, fontSize: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onAction },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 10, padding: 12,
  },
  statusLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  statusToggle: { backgroundColor: colors.brand, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  statusToggleText: { color: colors.onBrand, fontSize: 12, fontWeight: '700' },
  field: { gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  input: {
    backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.brandTint, borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, color: colors.brandDeep, fontWeight: '500' },
  chipTextActive: { color: colors.onBrand },
  photoThumb: { width: 76, height: 76, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.brandTint },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  photoAdd: {
    width: 76, height: 76, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  photoAddText: { fontSize: 12, color: colors.brand, fontWeight: '600', textAlign: 'center' },
  saveBtn: { backgroundColor: colors.action, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: colors.onAction, fontSize: 15, fontWeight: '700' },
  duplicateBtn: { backgroundColor: colors.brandTint, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  duplicateBtnText: { color: colors.brand, fontSize: 14, fontWeight: '600' },
  archiveBtn: { backgroundColor: 'rgba(184,92,42,0.10)', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  archiveBtnText: { color: colors.action, fontSize: 14, fontWeight: '600' },
});
