// app/(tabs)/partners.tsx

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function PartnersScreen() {
  const router = useRouter();

  const partners = [
    { 
      id: 'edu1', 
      name: 'Strategy First University', 
      city: 'Yangon', 
      discount: '10% Off', 
      bgImage: 'https://images.unsplash.com/photo-1541339907198-e08756defefe?q=80&w=600&auto=format&fit=crop',
      address: 'No.45, Pyay Road, Kamayut Township, Yangon',
      phone: '09-123456789',
      category: 'education'
    },
    { 
      id: 'edu2', 
      name: 'Wall Street English', 
      city: 'Mandalay', 
      discount: '15% Off', 
      bgImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop',
      address: '73rd Street, Between 26th & 27th Street, Mandalay',
      phone: '09-987654321',
      category: 'education'
    },
    { 
      id: 'heal1', 
      name: 'Pun Hlaing Hospital', 
      city: 'Yangon', 
      discount: '20% Off', 
      bgImage: 'https://images.unsplash.com/photo-1586773860418-d3b978b8c657?q=80&w=600&auto=format&fit=crop',
      address: 'Pun Hlaing Golf Estate Avenue, Hlaing Tharyar Township, Yangon',
      phone: '09-444555666',
      category: 'health'
    },
    { 
      id: 'heal2', 
      name: 'Grand Hantha International', 
      city: 'Yangon', 
      discount: '12% Off', 
      bgImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop',
      address: 'Corner of Pyay Road and Nar Nat Taw Street, Kamayut, Yangon',
      phone: '09-777888999',
      category: 'health'
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>🤝 Our Partners</Text>
      <Text style={styles.headerSub}>Exclusive deals and discounts for you</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎓 Education Partners</Text>
        {partners.filter(p => p.category === 'education').map((partner) => (
          <TouchableOpacity key={partner.id} style={styles.partnerCard} onPress={() => router.push({ pathname: '/partner-detail', params: partner })}>
            <ImageBackground source={{ uri: partner.bgImage }} style={styles.partnerImage} imageStyle={{ borderRadius: 12 }}>
              <View style={styles.partnerOverlay}>
                <Text style={styles.partnerName}>{partner.name}</Text>
                <Text style={styles.partnerCity}>{partner.city}</Text>
                <Text style={styles.partnerDiscount}>✨ {partner.discount}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏥 Health Partners</Text>
        {partners.filter(p => p.category === 'health').map((partner) => (
          <TouchableOpacity key={partner.id} style={styles.partnerCard} onPress={() => router.push({ pathname: '/partner-detail', params: partner })}>
            <ImageBackground source={{ uri: partner.bgImage }} style={styles.partnerImage} imageStyle={{ borderRadius: 12 }}>
              <View style={styles.partnerOverlay}>
                <Text style={styles.partnerName}>{partner.name}</Text>
                <Text style={styles.partnerCity}>{partner.city}</Text>
                <Text style={styles.partnerDiscount}>✨ {partner.discount}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSub: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  partnerCard: { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
  partnerImage: { height: 140, justifyContent: 'flex-end' },
  partnerOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 12 },
  partnerName: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  partnerCity: { color: '#cbd5e1', fontSize: 13, marginTop: 2 },
  partnerDiscount: { color: '#fbbf24', fontSize: 14, fontWeight: '600', marginTop: 4 },
});