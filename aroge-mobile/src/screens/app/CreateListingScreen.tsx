import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../constants';
import { api } from '../../services/api';

export default function CreateListingScreen() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const submit = async () => {
    await api.sendHeartbeat();
    Alert.alert('Listing submitted', `${title} - ETB ${price}`);
  };
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Create Listing</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder='Product title' style={styles.input} />
      <TextInput value={price} onChangeText={setPrice} placeholder='Price' keyboardType='number-pad' style={styles.input} />
      <Pressable style={styles.btn} onPress={submit}><Text style={styles.btnText}>Publish</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 }, title: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, marginBottom: 10 }, input: { backgroundColor: Colors.cream.surface, borderRadius: 12, padding: 12, marginBottom: 10 }, btn: { backgroundColor: Colors.green.primary, borderRadius: 12, padding: 14, alignItems: 'center' }, btnText: { color: Colors.text.onGreen, fontWeight: '700' } });
