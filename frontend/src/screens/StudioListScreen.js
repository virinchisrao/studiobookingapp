// frontend/src/screens/StudioListScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { studioAPI, resourceAPI } from '../services/api';

export default function StudioListScreen({ navigation }) {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load studios when screen opens
  useEffect(() => {
    loadStudios();
  }, []);

  const loadStudios = async () => {
    try {
      setLoading(true);
      const data = await studioAPI.getAllStudios();
      setStudios(data);
    } catch (error) {
      console.error('Error loading studios:', error);
      Alert.alert(
        'Error',
        'Failed to load studios. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudios();
    setRefreshing(false);
  };

  const handleStudioPress = (studio) => {
    navigation.navigate('StudioDetails', { studio });
  };

  const renderStudioItem = ({ item }) => (
    <TouchableOpacity
      style={styles.studioCard}
      onPress={() => handleStudioPress(item)}
      activeOpacity={0.7}
    >
      {/* Studio Name */}
      <Text style={styles.studioName}>{item.name}</Text>

      {/* Location */}
      <View style={styles.locationContainer}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>
          {item.city || 'Location'}{item.state ? `, ${item.state}` : ''}
        </Text>
      </View>

      {/* Address */}
      {item.address && (
        <Text style={styles.addressText} numberOfLines={1}>
          {item.address}
        </Text>
      )}

      {/* Phone */}
      {item.phone && (
        <View style={styles.phoneContainer}>
          <Text style={styles.phoneIcon}>📞</Text>
          <Text style={styles.phoneText}>{item.phone}</Text>
        </View>
      )}

      {/* Description */}
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* View Details Button */}
      <View style={styles.viewDetailsButton}>
        <Text style={styles.viewDetailsText}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏢</Text>
      <Text style={styles.emptyTitle}>No Studios Available</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for new studios
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={loadStudios}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading studios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏢 Browse Studios</Text>
        <Text style={styles.headerSubtitle}>
          {studios.length} {studios.length === 1 ? 'studio' : 'studios'} available
        </Text>
      </View>

      {/* Studio List */}
      <FlatList
        data={studios}
        renderItem={renderStudioItem}
        keyExtractor={(item) => item.studio_id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  studioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studioName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  phoneText: {
    fontSize: 13,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  viewDetailsButton: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});