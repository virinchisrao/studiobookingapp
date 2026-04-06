import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface MapPickerProps {
  initialLocation?: {
    lat: number;
    lng: number;
  };
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ initialLocation, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [region, setRegion] = useState({
    latitude: initialLocation?.lat || 12.9716,
    longitude: initialLocation?.lng || 77.5946,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setSelectedLocation(newLocation);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      onLocationSelect({
        ...newLocation,
        address: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim(),
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
      console.error(error);
    }
  };

  // Handle map press
  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    const newLocation = {
      lat: coordinate.latitude,
      lng: coordinate.longitude,
    };

    setSelectedLocation(newLocation);

    try {
      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      onLocationSelect({
        ...newLocation,
        address: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim(),
      });
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      onLocationSelect(newLocation);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.lat,
              longitude: selectedLocation.lng,
            }}
            title="Studio Location"
            pinColor="red"
          />
        )}
      </MapView>

      {/* Current Location Button */}
      <TouchableOpacity
        style={styles.currentLocationBtn}
        onPress={getCurrentLocation}
      >
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Tap on the map to select studio location
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  currentLocationBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  instructions: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MapPicker;