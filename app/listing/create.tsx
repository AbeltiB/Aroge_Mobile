import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { X, Plus } from 'lucide-react-native';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import type { Category } from '@arogenpm/sdk';
import { ItemCondition } from '@arogenpm/sdk';
import { ScreenHeader, Card, Input, Chip, Button } from '../../src/components/ui';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="New Listing" tone="surface" bordered />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.section}>
          <Text style={styles.label}>Photos * ({photos.length}/{MAX_PHOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoThumb}>
                  <ExpoImage source={{ uri }} style={styles.photoImage} contentFit="cover" />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(uri)}>
                    <X size={11} color="#fff" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={styles.photoAdd} onPress={pickPhotos}>
                  <Plus size={20} color={Colors.green.primary} strokeWidth={2} />
                  <Text style={styles.photoAddText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Card>

        <Card style={styles.section}>
          <View style={styles.field}>
            <Input label="Title *" placeholder="What are you selling?" value={form.title} onChangeText={(v) => update('title', v)} maxLength={120} />
          </View>

          <View style={styles.field}>
            <Input
              label="Description *"
              placeholder="Describe the item, its condition, any defects…"
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
                  <Chip key={cat.id} label={cat.nameEn} selected={form.categoryId === cat.id} onPress={() => update('categoryId', cat.id)} />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Condition *</Text>
            <View style={styles.chipWrap}>
              {CONDITIONS.map((c) => (
                <Chip key={c} label={c.replace('_', ' ')} selected={form.condition === c} onPress={() => update('condition', c)} />
              ))}
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Price (ETB) *" placeholder="0" value={form.price} onChangeText={(v) => update('price', v)} keyboardType="numeric" />
            </View>
            <View style={styles.negotiableField}>
              <Text style={styles.label}>Negotiable</Text>
              <Switch
                value={form.negotiable}
                onValueChange={(v) => update('negotiable', v)}
                trackColor={{ true: Colors.green.primary }}
                style={{ marginTop: 14 }}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Input label="City" placeholder="Addis Ababa" value={form.city} onChangeText={(v) => update('city', v)} />
          </View>
        </Card>

        <Button label="Create Listing" variant="primary" loading={saving} onPress={handleCreate} style={{ marginTop: 4 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing[4], gap: Spacing[3] },
  section: { gap: Spacing[3] },
  field: { gap: 4 },
  row: { flexDirection: 'row', gap: Spacing[3] },
  negotiableField: { gap: 4 },
  label: { fontFamily: FontFamily.interSemibold, fontSize: 13, color: Colors.ink },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  photoThumb: {
    width: 76, height: 76, borderRadius: BorderRadius.md, overflow: 'hidden',
    backgroundColor: Colors.green.tint,
  },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: 76, height: 76, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.line, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  photoAddText: { fontFamily: FontFamily.interSemibold, fontSize: 11, color: Colors.green.primary },
});
