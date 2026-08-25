import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import type { Category } from 'aroge-sdk';
import { ItemCondition } from 'aroge-sdk';

const CONDITIONS = Object.values(ItemCondition);
const MAX_PHOTOS = 10;

export default function CreateListingScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: ItemCondition.GOOD,
    price: '',
    negotiable: false,
    city: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Category[]>('/categories').then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

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

    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
    }
  }

  function removePhoto(uri: string) {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }

  async function handleCreate() {
    if (!form.title || !form.description || !form.categoryId || !form.price) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Add a Photo', 'At least one photo is required.');
      return;
    }

    setSaving(true);
    const res = await api.post<{ id: string }>('/listings', {
      ...form,
      price: Number(form.price),
    });

    if (!res.success) {
      Alert.alert('Error', (res as any).message ?? 'Failed to create listing');
      setSaving(false);
      return;
    }

    for (const uri of photos) {
      const uploadRes = await api.uploadFile(`/listings/${res.data.id}/photos`, uri, 'photo');
      if (!uploadRes.success) {
        Alert.alert(
          'Photo upload issue',
          'The listing was created but one or more photos failed to upload. You can add them later.'
        );
        break;
      }
    }

    setSaving(false);
    Alert.alert('Listing Created', 'Your listing is saved as draft. Publish it to go live.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Listing</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={styles.field}>
          <Text style={styles.label}>Photos * ({photos.length}/{MAX_PHOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(uri)}>
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
          <TextInput
            style={styles.input}
            placeholder="What are you selling?"
            value={form.title}
            onChangeText={(v) => update('title', v)}
            maxLength={120}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Describe the item, its condition, any defects…"
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
                  style={[
                    styles.chip,
                    form.categoryId === cat.id && styles.chipActive,
                  ]}
                >
                  <Text style={[styles.chipText, form.categoryId === cat.id && styles.chipTextActive]}>
                    {cat.nameEn}
                  </Text>
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
                <Text style={[styles.chipText, form.condition === c && styles.chipTextActive]}>
                  {c.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Price (ETB) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={form.price}
              onChangeText={(v) => update('price', v)}
              keyboardType="numeric"
            />
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
          <TextInput
            style={styles.input}
            placeholder="Addis Ababa"
            value={form.city}
            onChangeText={(v) => update('city', v)}
          />
        </View>

        <TouchableOpacity
          style={[styles.publishBtn, saving && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.onAction} />
          ) : (
            <Text style={styles.publishBtnText}>Create Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.action,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  back: { color: colors.onAction, fontSize: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onAction },
  field: { gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.brandTint,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  photoThumb: {
    width: 76, height: 76, borderRadius: 10, overflow: 'hidden',
    backgroundColor: colors.brandTint,
  },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  photoAdd: {
    width: 76, height: 76, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  photoAddText: { fontSize: 12, color: colors.brand, fontWeight: '600', textAlign: 'center' },
  chipText: { fontSize: 12, color: colors.brandDeep, fontWeight: '500' },
  chipTextActive: { color: colors.onBrand },
  publishBtn: {
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  publishBtnText: { color: colors.onAction, fontSize: 15, fontWeight: '700' },
});
