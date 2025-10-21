// frontend/src/screens/StudioResourcesScreen.js

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
import { resourceAPI } from '../services/api';

export default function StudioResourcesScreen({ route, navigation }) {
  const { studio } = route.params;
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await resourceAPI.getStudioResources(studio.studio_id);
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
      Alert.alert('Error', 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'live_room':
        return '🎸';
      case 'control_room':
        return '🎛️';
      case 'booth':
        return '🎤';
      case 'rehearsal':
        return '🥁';
      default:
        return '🎵';
    }
  };

  const getResourceTypeName = (type) => {
    switch (type) {
      case 'live_room':
        return 'Live Room';
      case 'control_room':
        return 'Control Room';
      case 'booth':
        return 'Booth';
      case 'rehearsal':
        return 'Rehearsal Space';
      default:
        return type;
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
  };

  const renderResourceItem = ({ item }) => (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceTitleContainer}>
          <Text style={styles.resourceIcon}>{getResourceIcon(item.resource_type)}</Text>
          <View>
            <Text style={styles.resourceName}>{item.name}</Text>
            {item.resource_type && (
              <Text style={styles.resourceType}>
                {getResourceTypeName(item.resource_type)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceAmount}>
            {formatPrice(item.base_price_per_hour)}
          </Text>
          <Text style={styles.priceUnit}>/hour</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.resourceDescription}>{item.description}</Text>
      )}

      {item.max_occupancy && (
        <View style={styles.capacityContainer}>
          <Text style={styles.capacityIcon}>👥</Text>
          <Text style={styles.capacityText}>Max {item.max_occupancy} people</Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.activeBadge,
            item.is_active ? styles.activeBadgeTrue : styles.activeBadgeFalse,
          ]}
        >
          <Text style={styles.activeBadgeText}>
            {item.is_active ? '✓ Active' : '✗ Inactive'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎵</Text>
      <Text style={styles.emptyTitle}>No Resources Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add resources (rooms/spaces) to this studio
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddResource', { studio })}
      >
        <Text style={styles.addButtonText}>➕ Add Resource</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading resources...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Resources</Text>
          <Text style={styles.headerSubtitle}>{studio.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={() => navigation.navigate('AddResource', { studio })}
        >
          <Text style={styles.headerAddButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Resources List */}
      <FlatList
        data={resources}
        renderItem={renderResourceItem}
        keyExtractor={(item) => item.resource_id.toString()}
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  headerAddButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  headerAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  resourceCard: {
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
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resourceType: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceUnit: {
    fontSize: 12,
    color: '#666',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  capacityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  capacityText: {
    fontSize: 13,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeBadgeTrue: {
    backgroundColor: '#E8F5E9',
  },
  activeBadgeFalse: {
    backgroundColor: '#FFEBEE',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
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
    marginBottom: 30,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});