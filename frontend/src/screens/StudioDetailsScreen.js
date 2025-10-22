// frontend/src/screens/StudioDetailsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { resourceAPI } from '../services/api';
import MapView, { Marker } from 'react-native-maps';
import { Linking, Platform } from 'react-native';

export default function StudioDetailsScreen({ route, navigation }) {
  const { studio } = route.params;
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

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
      Alert.alert('Error', 'Failed to load studio resources');
    } finally {
      setLoading(false);
    }
  };

  const handleBookResource = (resource) => {
    navigation.navigate('Booking', { resource, studio });
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
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
        <Text style={styles.headerTitle}>Studio Details</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Studio Info Card */}
        <View style={styles.studioCard}>
          <Text style={styles.studioName}>{studio.name}</Text>

          {studio.description && (
            <Text style={styles.description}>{studio.description}</Text>
          )}

          {/* Location */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoText}>
                {studio.address}
                {studio.city && `\n${studio.city}`}
                {studio.state && `, ${studio.state}`}
                {studio.postal_code && ` - ${studio.postal_code}`}
              </Text>
            </View>
          </View>

          {/* Phone */}
          {studio.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoText}>{studio.phone}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Location Map */}
{studio.lat && studio.lng && (
  <View style={styles.mapSection}>
    <Text style={styles.sectionTitle}>Location</Text>
    <MapView
      style={styles.miniMap}
      initialRegion={{
        latitude: parseFloat(studio.lat),
        longitude: parseFloat(studio.lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Marker
        coordinate={{
          latitude: parseFloat(studio.lat),
          longitude: parseFloat(studio.lng),
        }}
        title={studio.name}
      />
    </MapView>
    
    {/* Get Directions Button */}
    <TouchableOpacity
      style={styles.directionsButton}
      onPress={() => {
        const lat = parseFloat(studio.lat);
        const lng = parseFloat(studio.lng);
        const scheme = Platform.select({
          ios: 'maps:0,0?q=',
          android: 'geo:0,0?q=',
        });
        const latLng = `${lat},${lng}`;
        const label = studio.name;
        const url = Platform.select({
          ios: `${scheme}${label}@${latLng}`,
          android: `${scheme}${latLng}(${label})`,
        });
        Linking.openURL(url);
      }}
    >
      <Text style={styles.directionsButtonText}>📍 Get Directions</Text>
    </TouchableOpacity>
  </View>
)}

        {/* Resources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Spaces ({resources.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading spaces...</Text>
            </View>
          ) : resources.length === 0 ? (
            <View style={styles.emptyResources}>
              <Text style={styles.emptyResourcesText}>
                No spaces available at this studio
              </Text>
            </View>
          ) : (
            resources.map((resource) => (
              <View key={resource.resource_id} style={styles.resourceCard}>
                {/* Resource Header */}
                <View style={styles.resourceHeader}>
                  <View style={styles.resourceTitleContainer}>
                    <Text style={styles.resourceIcon}>
                      {getResourceIcon(resource.resource_type)}
                    </Text>
                    <View>
                      <Text style={styles.resourceName}>{resource.name}</Text>
                      {resource.resource_type && (
                        <Text style={styles.resourceType}>
                          {getResourceTypeName(resource.resource_type)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceAmount}>
                      {formatPrice(resource.base_price_per_hour)}
                    </Text>
                    <Text style={styles.priceUnit}>/hour</Text>
                  </View>
                </View>

                {/* Resource Description */}
                {resource.description && (
                  <Text style={styles.resourceDescription}>
                    {resource.description}
                  </Text>
                )}

                {/* Capacity */}
                {resource.max_occupancy && (
                  <View style={styles.capacityContainer}>
                    <Text style={styles.capacityIcon}>👥</Text>
                    <Text style={styles.capacityText}>
                      Max {resource.max_occupancy} people
                    </Text>
                  </View>
                )}

                {/* Book Button */}
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => handleBookResource(resource)}
                >
                  <Text style={styles.bookButtonText}>Book This Space</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  studioCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  studioName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
mapSection: {
  marginBottom: 20,
},
sectionTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 15,
  paddingHorizontal: 20,
},
miniMap: {
  height: 200,
  borderRadius: 12,
  marginHorizontal: 20,
  overflow: 'hidden',
},
directionsButton: {
  backgroundColor: '#007AFF',
  marginHorizontal: 20,
  marginTop: 15,
  padding: 15,
  borderRadius: 8,
  alignItems: 'center',
},
directionsButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},

  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyResources: {
    padding: 30,
    alignItems: 'center',
  },
  emptyResourcesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  resourceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    marginBottom: 12,
  },
  capacityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  capacityText: {
    fontSize: 13,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});