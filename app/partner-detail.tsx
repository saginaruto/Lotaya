import React, { useState, useEffect } from 'react';
import { View, Text, ImageBackground, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PartnerDetailScreen() {
  const params = useLocalSearchParams<{ 
    id: string; 
    name: string; 
    city: string; 
    discount: string; 
    bgImage: string; 
    address: string; 
    phone: string; 
    category: string;
  }>();

  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  // ==================== LOAD RATING ====================
  useEffect(() => {
    loadRating();
  }, [params.id]);

  const loadRating = async () => {
    try {
      // Partner rating ကိုဖတ်ပါ
      const ratingKey = `partner_rating_${params.id}`;
      const data = await AsyncStorage.getItem(ratingKey);
      if (data) {
        const parsed = JSON.parse(data);
        setRating(parsed.average || 0);
        setRatingCount(parsed.count || 0);
      }

      // User ရဲ့ rating ကိုဖတ်ပါ
      const userKey = `user_rating_${params.id}`;
      const userData = await AsyncStorage.getItem(userKey);
      if (userData) {
        setUserRating(parseInt(userData));
        setHasRated(true);
      }
    } catch (error) {
      console.log('Error loading rating:', error);
    }
  };

  // ==================== SAVE RATING ====================
  const saveRating = async (newRating: number) => {
    try {
      const ratingKey = `partner_rating_${params.id}`;
      const data = await AsyncStorage.getItem(ratingKey);
      let current = { average: 0, count: 0 };
      
      if (data) {
        current = JSON.parse(data);
      }

      // User က rating အသစ်ပေးရင် အဟောင်းကိုဖယ်ပြီး အသစ်ထည့်ပါ
      if (hasRated) {
        // အဟောင်းကိုဖယ်ပါ
        const total = current.average * current.count;
        current.count -= 1;
        current.average = current.count > 0 ? (total - userRating) / current.count : 0;
      }

      // အသစ်ထည့်ပါ
      const newTotal = current.average * current.count + newRating;
      current.count += 1;
      current.average = newTotal / current.count;

      await AsyncStorage.setItem(ratingKey, JSON.stringify(current));
      
      // User ရဲ့ rating ကိုသိမ်းပါ
      await AsyncStorage.setItem(`user_rating_${params.id}`, String(newRating));

      setRating(current.average);
      setRatingCount(current.count);
      setUserRating(newRating);
      setHasRated(true);

      Alert.alert('✅ Thank You!', `You rated ${params.name} ${newRating} stars!`);
    } catch (error) {
      console.log('Error saving rating:', error);
      Alert.alert('Error', 'Failed to save rating.');
    }
  };

  // ==================== RATING STARS ====================
  const renderStars = (ratingValue: number, interactive: boolean = false) => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      let starName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
      
      if (i <= fullStars) {
        starName = 'star';
      } else if (i === fullStars + 1 && hasHalfStar) {
        starName = 'star-half';
      }

      stars.push(
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && saveRating(i)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={starName}
            size={interactive ? 34 : 20}
            color={interactive ? (i <= userRating || i <= ratingValue ? '#fbbf24' : '#d1d5db') : '#fbbf24'}
            style={interactive && styles.interactiveStar}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  // ==================== PARTNER LOCATIONS ====================
  const partnerLocations: { [key: string]: { lat: number; lng: number } } = {
    'edu1': { lat: 16.8239, lng: 96.1296 },
    'edu2': { lat: 21.9588, lng: 96.0891 },
    'heal1': { lat: 16.8588, lng: 96.1087 },
    'heal2': { lat: 16.8300, lng: 96.1402 },
  };

  const handleCall = () => { 
    if (params.phone) {
      Linking.openURL(`tel:${params.phone}`).catch(() => {});
    }
  };

  const handleMap = () => {
    if (!params.id) return;

    const location = partnerLocations[params.id];
    let query = '';
    
    if (location) {
      query = `${location.lat},${location.lng}`;
    } else if (params.address) {
      query = encodeURIComponent(params.address);
    } else {
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  const getCategoryIcon = () => { 
    if (params.category === 'education') return '🎓'; 
    if (params.category === 'health') return '🏥'; 
    return '🏢'; 
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground source={{ uri: params.bgImage }} style={styles.heroImage} imageStyle={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={styles.heroOverlay}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{getCategoryIcon()} {params.category}</Text>
          </View>
          <Text style={styles.heroName}>{params.name}</Text>
          <Text style={styles.heroCity}>{params.city}</Text>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        {/* Rating Section */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingTitle}>⭐ Rating</Text>
            <View style={styles.ratingStats}>
              <Text style={styles.ratingAverage}>{rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({ratingCount} reviews)</Text>
            </View>
          </View>
          
          <View style={styles.starsContainer}>
            {renderStars(rating)}
          </View>

          <View style={styles.divider} />

          <Text style={styles.rateLabel}>Your Rating</Text>
          <View style={styles.userStarsContainer}>
            {renderStars(userRating || 0, true)}
          </View>
          {hasRated && (
            <Text style={styles.ratedText}>✅ You rated {userRating} stars</Text>
          )}
        </View>

        <View style={styles.discountCard}>
          <FontAwesome5 name="gift" size={24} color="#fbbf24" />
          <View style={styles.discountContent}>
            <Text style={styles.discountLabel}>Exclusive Offer</Text>
            <Text style={styles.discountValue}>✨ {params.discount}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>📍 Address</Text>
          <Text style={styles.infoText}>{params.address || 'No address provided'}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>📞 Contact</Text>
          <Text style={styles.infoText}>{params.phone || 'No phone provided'}</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
            <Ionicons name="call" size={22} color="#ffffff" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.mapButton]} onPress={handleMap}>
            <Ionicons name="map" size={22} color="#ffffff" />
            <Text style={styles.actionButtonText}>Map</Text>
          </TouchableOpacity>
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
  
  // Rating Styles
  ratingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  ratingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingAverage: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
  },
  ratingCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  userStarsContainer: {
    flexDirection: 'row',
  },
  interactiveStar: {
    marginRight: 4,
  },
  ratedText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 6,
    fontWeight: '500',
  },

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