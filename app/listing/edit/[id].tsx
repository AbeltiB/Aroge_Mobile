import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { X, Plus } from 'lucide-react-native';
import { colors } from '../../../src/lib/colors';
import { Spacing, BorderRadius } from '../../../src/constants';
import { api } from '../../../src/lib/api';
import type { Category, Listing, ListingPhoto } from '@arogenpm/sdk';
import { ItemCondition } from '@arogenpm/sdk';
import { ScreenHeader, Card, Badge, Input, Chip, Button, RemoteImage } from '../../../src/components/ui';

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
        { text: 'OK', onPress: () => router.replace(`/listing/edit/${res.data.id}`) },
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="Edit Listing" tone="action" bordered />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statusRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.statusLabel}>Status</Text>
            <Badge label={status} tone={status === 'ACTIVE' ? 'success' : status === 'ARCHIVED' ? 'error' : 'neutral'} />
          </View>
          {(status === 'DRAFT' || status === 'ACTIVE') && (
            <Button
              label={status === 'DRAFT' ? 'Publish' : 'Unpublish'}
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={togglePublish}
            />
          )}
        </View>

        <Card style={styles.section}>
          <Text style={styles.label}>Photos ({photos.length}/{MAX_PHOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {photos.map((p) => (
                <View key={p.id} style={styles.photoThumb}>
                  <RemoteImage photoKey={p.cloudinaryKey} style={styles.photoImage} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(p.id)}>
                    <X size={11} color="#fff" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={styles.photoAdd} onPress={pickPhotos}>
                  <Plus size={20} color={colors.brand} strokeWidth={2} />
                  <Text style={styles.photoAddText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Card>

        <Card style={styles.section}>
          <View style={styles.field}>
            <Input label="Title *" value={form.title} onChangeText={(v) => update('title', v)} maxLength={120} />
          </View>

          <View style={styles.field}>
            <Input
              label="Description *"
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              style={{ height: 100, paddingTop: 12, textAlignVertical: 'top' }}
              maxLength={2000}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {categories.map((cat) => (
                  <Chip key={cat.id} label={cat.nameEn} selected={form.categoryId === cat.id} onPress={() => update('categoryId', cat.id)} tone="action" />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Condition *</Text>
            <View style={styles.chipWrap}>
              {CONDITIONS.map((c) => (
                <Chip key={c} label={c.replace('_', ' ')} selected={form.condition === c} onPress={() => update('condition', c)} tone="action" />
              ))}
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Price (ETB) *" value={form.price} onChangeText={(v) => update('price', v)} keyboardType="numeric" />
            </View>
            <View style={styles.negotiableField}>
              <Text style={styles.label}>Negotiable</Text>
              <Switch
                value={form.negotiable}
                onValueChange={(v) => update('negotiable', v)}
                trackColor={{ true: colors.brand }}
                style={{ marginTop: 14 }}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Input label="City" value={form.city} onChangeText={(v) => update('city', v)} />
          </View>
        </Card>

        <Button label="Save Changes" variant="primary" loading={saving} onPress={handleSave} style={{ marginTop: 4 }} />
        <Button label="Duplicate as New Draft" variant="secondary" onPress={handleDuplicate} />
        {status !== 'ARCHIVED' && (
          <Button label="Archive Listing" variant="danger" onPress={handleArchive} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing[4], gap: Spacing[3] },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  statusLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  section: { gap: Spacing[3] },
  field: { gap: 4 },
  row: { flexDirection: 'row', gap: Spacing[3] },
  negotiableField: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  photoThumb: { width: 76, height: 76, borderRadius: BorderRadius.md, overflow: 'hidden', backgroundColor: colors.brandTint },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: 76, height: 76, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  photoAddText: { fontSize: 11, color: colors.brand, fontWeight: '600' },
});
