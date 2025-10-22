// frontend/src/screens/MapViewScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { studioAPI } from '../services/api';

export default function MapViewScreen({ navigation }) {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 19.0760, // Default: Mumbai
    longitude: 72.8777,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  useEffect(() => {
    loadUserLocation();
    loadStudios();
  }, []);

  const loadUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to show nearby studios'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadStudios = async () => {
    try {
      setLoading(true);
      const data = await studioAPI.getAllStudios();
      
      // Filter studios with valid coordinates
      const studiosWithCoords = data.filter(
        (s) => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng)
      );
      
      setStudios(studiosWithCoords);

      // If we have studios, adjust map to show them
      if (studiosWithCoords.length > 0 && !userLocation) {
        const firstStudio = studiosWithCoords[0];
        setRegion({
          latitude: parseFloat(firstStudio.lat),
          longitude: parseFloat(firstStudio.lng),
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        });
      }
    } catch (error) {
      console.error('Error loading studios:', error);
      Alert.alert('Error', 'Failed to load studios');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (studio) => {
    // Already handled by Callout
  };

  const handleViewDetails = (studio) => {
    navigation.navigate('StudioDetails', { studio });
  };

  const handleGetDirections = (studio) => {
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
  };

  const goToMyLocation = () => {
    if (userLocation) {
      setRegion({
        ...userLocation,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } else {
      loadUserLocation();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading map...</Text>
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
        <Text style={styles.headerTitle}>Studios Map</Text>
        <View style={styles.headerRight}>
          <Text style={styles.studioCount}>{studios.length} studios</Text>
        </View>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Studio Markers */}
        {studios.map((studio) => (
          <Marker
            key={studio.studio_id}
            coordinate={{
              latitude: parseFloat(studio.lat),
              longitude: parseFloat(studio.lng),
            }}
            title={studio.name}
            description={studio.city}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Text style={styles.markerText}>🏢</Text>
              </View>
            </View>

            <Callout
              onPress={() => handleViewDetails(studio)}
              style={styles.callout}
            >
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle}>{studio.name}</Text>
                <Text style={styles.calloutSubtitle}>
                  {studio.city}, {studio.state}
                </Text>
                {studio.address && (
                  <Text style={styles.calloutAddress} numberOfLines={2}>
                    {studio.address}
                  </Text>
                )}
                <View style={styles.calloutActions}>
                  <TouchableOpacity
                    style={styles.calloutButton}
                    onPress={() => handleGetDirections(studio)}
                  >
                    <Text style={styles.calloutButtonText}>📍 Directions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.calloutButton, styles.calloutButtonPrimary]}
                    onPress={() => handleViewDetails(studio)}
                  >
                    <Text style={[styles.calloutButtonText, styles.calloutButtonTextPrimary]}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}
      </MapView>

      {/* My Location Button */}
      {userLocation && (
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={goToMyLocation}
        >
          <Text style={styles.myLocationIcon}>📍</Text>
        </TouchableOpacity>
      )}

      {/* Switch to List View Button */}
      <TouchableOpacity
        style={styles.listViewButton}
        onPress={() => navigation.navigate('StudioList')}
      >
        <Text style={styles.listViewIcon}>📋</Text>
        <Text style={styles.listViewText}>List View</Text>
      </TouchableOpacity>

      {/* Info Banner */}
      {studios.length === 0 && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            No studios with location data found
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    zIndex: 10,
  },
  backButton: {
    width: 70,
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
    textAlign: 'center',
  },
  headerRight: {
    width: 70,
    alignItems: 'flex-end',
  },
  studioCount: {
    fontSize: 12,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    fontSize: 20,
  },
  callout: {
    width: 250,
  },
  calloutContent: {
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  calloutSubtitle: {
    fontSize: 13,
    color: '#007AFF',
    marginBottom: 5,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  calloutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  calloutButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  calloutButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  calloutButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  calloutButtonTextPrimary: {
    color: '#fff',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  myLocationIcon: {
    fontSize: 24,
  },
  listViewButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  listViewIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  listViewText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  infoBanner: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
});