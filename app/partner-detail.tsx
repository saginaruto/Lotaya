import React from 'react';
import { View, Text, ImageBackground, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function PartnerDetailScreen() {
  const params = useLocalSearchParams<{ id: string; name: string; city: string; discount: string; bgImage: string; address: string; phone: string; category: string; }>();

  const handleCall = () => { if (params.phone) Linking.openURL(`tel:${params.phone}`); };
  const handleMap = () => { if (params.address) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(params.address)}`); };

  const getCategoryIcon = () => { if (params.category === 'education') return '🎓'; if (params.category === 'health') return '🏥'; return '🏢'; };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground source={{ uri: params.bgImage }} style={styles.heroImage} imageStyle={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={styles.heroOverlay}>
          <View style={styles.categoryBadge}><Text style={styles.categoryText}>{getCategoryIcon()} {params.category}</Text></View>
          <Text style={styles.heroName}>{params.name}</Text>
          <Text style={styles.heroCity}>{params.city}</Text>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.discountCard}>
          <FontAwesome5 name="gift" size={24} color="#fbbf24" />
          <View style={styles.discountContent}><Text style={styles.discountLabel}>Exclusive Offer</Text><Text style={styles.discountValue}>✨ {params.discount}</Text></View>
        </View>

        <View style={styles.infoSection}><Text style={styles.sectionTitle}>📍 Address</Text><Text style={styles.infoText}>{params.address || 'No address provided'}</Text></View>
        <View style={styles.infoSection}><Text style={styles.sectionTitle}>📞 Contact</Text><Text style={styles.infoText}>{params.phone || 'No phone provided'}</Text></View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}><Ionicons name="call" size={22} color="#ffffff" /><Text style={styles.actionButtonText}>Call</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.mapButton]} onPress={handleMap}><Ionicons name="map" size={22} color="#ffffff" /><Text style={styles.actionButtonText}>Map</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heroImage: { height: 260 },
  heroOverlay: { flex: 1, padding: 24, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8 },
  categoryText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  heroName: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  heroCity: { color: '#cbd5e1', fontSize: 16, fontWeight: '500', marginTop: 4 },
  content: { padding: 20 },
  discountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 16, gap: 14, marginBottom: 20 },
  discountContent: { flex: 1 },
  discountLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  discountValue: { color: '#fbbf24', fontSize: 20, fontWeight: '900' },
  infoSection: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  sectionTitle: { color: '#6b7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoText: { color: '#111827', fontSize: 15, fontWeight: '500' },
  actionContainer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  callButton: { backgroundColor: '#22c55e' },
  mapButton: { backgroundColor: '#0284c7' },
  actionButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});