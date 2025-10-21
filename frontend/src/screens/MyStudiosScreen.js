// frontend/src/screens/MyStudiosScreen.js

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

export default function MyStudiosScreen({ navigation }) {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStudios();
  }, []);

  // Reload when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStudios();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStudios = async () => {
    try {
      setLoading(true);
      const data = await studioAPI.getMyStudios();
      
      // Load resource count for each studio
      const studiosWithResources = await Promise.all(
        data.map(async (studio) => {
          try {
            const resources = await resourceAPI.getStudioResources(studio.studio_id);
            return { ...studio, resourceCount: resources.length };
          } catch (error) {
            return { ...studio, resourceCount: 0 };
          }
        })
      );
      
      setStudios(studiosWithResources);
    } catch (error) {
      console.error('Error loading studios:', error);
      Alert.alert('Error', 'Failed to load studios');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudios();
    setRefreshing(false);
  };

  const handleTogglePublish = async (studio) => {
    const newStatus = !studio.is_published;
    const action = newStatus ? 'publish' : 'unpublish';

    if (newStatus && (!studio.resourceCount || studio.resourceCount === 0)) {
      Alert.alert(
        'Cannot Publish',
        'Please add at least one resource (room) to your studio before publishing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Resource',
            onPress: () => navigation.navigate('AddResource', { studio }),
          },
        ]
      );
      return;
    }

    Alert.alert(
      `${newStatus ? 'Publish' : 'Unpublish'} Studio`,
      `Are you sure you want to ${action} "${studio.name}"?\n\n` +
      (newStatus
        ? 'Customers will be able to see and book this studio.'
        : 'This studio will be hidden from customers.'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus ? 'Publish' : 'Unpublish',
          onPress: () => updatePublishStatus(studio, newStatus),
        },
      ]
    );
  };

  const updatePublishStatus = async (studio, isPublished) => {
    try {
      await studioAPI.updateStudio(studio.studio_id, {
        is_published: isPublished,
      });

      Alert.alert(
        'Success!',
        `${studio.name} has been ${isPublished ? 'published' : 'unpublished'} successfully.`
      );

      loadStudios();
    } catch (error) {
      console.error('Error updating studio:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to update studio status'
      );
    }
  };

  const handleViewResources = (studio) => {
    // Navigate to a resources list screen (we'll create a simple version)
    navigation.navigate('StudioResources', { studio });
  };

  const handleAddResource = (studio) => {
    navigation.navigate('AddResource', { studio });
  };

  const renderStudioItem = ({ item }) => (
    <View style={styles.studioCard}>
      {/* Header with Status Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.studioInfo}>
          <Text style={styles.studioName}>{item.name}</Text>
          <Text style={styles.studioLocation}>
            {item.city || 'Location'}{item.state ? `, ${item.state}` : ''}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.is_published ? styles.statusPublished : styles.statusDraft,
          ]}
        >
          <Text style={styles.statusText}>
            {item.is_published ? '🟢 Published' : '🟡 Draft'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🏢</Text>
          <Text style={styles.statText}>
            {item.resourceCount || 0} {item.resourceCount === 1 ? 'Resource' : 'Resources'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewResources(item)}
        >
          <Text style={styles.actionButtonText}>📋 Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAddResource(item)}
        >
          <Text style={styles.actionButtonText}>➕ Add Room</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.publishButton,
            item.is_published ? styles.unpublishButton : styles.publishButtonActive,
          ]}
          onPress={() => handleTogglePublish(item)}
        >
          <Text style={styles.publishButtonText}>
            {item.is_published ? 'Unpublish' : 'Publish'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warning if no resources */}
      {(!item.resourceCount || item.resourceCount === 0) && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Add at least one resource to publish this studio
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏢</Text>
      <Text style={styles.emptyTitle}>No Studios Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first studio to start accepting bookings
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateStudio')}
      >
        <Text style={styles.createButtonText}>➕ Create Studio</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your studios...</Text>
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
        <Text style={styles.headerTitle}>My Studios</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateStudio')}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Studios List */}
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studioInfo: {
    flex: 1,
    marginRight: 10,
  },
  studioName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studioLocation: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPublished: {
    backgroundColor: '#E8F5E9',
  },
  statusDraft: {
    backgroundColor: '#FFF3CD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  publishButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  publishButtonActive: {
    backgroundColor: '#34C759',
  },
  unpublishButton: {
    backgroundColor: '#FF9500',
  },
  publishButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
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
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});