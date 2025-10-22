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
  TextInput,
  Modal,
} from 'react-native';
import { studioAPI, resourceAPI } from '../services/api';

export default function StudioListScreen({ navigation }) {
  const [studios, setStudios] = useState([]);
  const [filteredStudios, setFilteredStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cities, setCities] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // name, price_low, price_high

  useEffect(() => {
    loadStudios();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [studios, searchQuery, selectedCity, selectedPriceRange, sortBy]);

  const loadStudios = async () => {
    try {
      setLoading(true);
      const data = await studioAPI.getAllStudios();
      
      // Load minimum price for each studio
      const studiosWithPrices = await Promise.all(
        data.map(async (studio) => {
          try {
            const resources = await resourceAPI.getStudioResources(studio.studio_id);
            const minPrice = resources.length > 0
              ? Math.min(...resources.map(r => parseFloat(r.base_price_per_hour)))
              : 0;
            return { ...studio, minPrice, resourceCount: resources.length };
          } catch (error) {
            return { ...studio, minPrice: 0, resourceCount: 0 };
          }
        })
      );
      
      setStudios(studiosWithPrices);
      
      // Extract unique cities
      const uniqueCities = [...new Set(
        studiosWithPrices
          .map(s => s.city)
          .filter(c => c && c.trim() !== '')
      )].sort();
      setCities(uniqueCities);
      
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

  const applyFilters = () => {
    let filtered = [...studios];

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (studio) =>
          studio.name.toLowerCase().includes(query) ||
          studio.city?.toLowerCase().includes(query) ||
          studio.state?.toLowerCase().includes(query) ||
          studio.address?.toLowerCase().includes(query)
      );
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter((studio) => studio.city === selectedCity);
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      filtered = filtered.filter((studio) => {
        const price = studio.minPrice;
        switch (selectedPriceRange) {
          case 'under_1000':
            return price < 1000;
          case '1000_2000':
            return price >= 1000 && price < 2000;
          case '2000_3000':
            return price >= 2000 && price < 3000;
          case 'above_3000':
            return price >= 3000;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price_low':
          return a.minPrice - b.minPrice;
        case 'price_high':
          return b.minPrice - a.minPrice;
        default:
          return 0;
      }
    });

    setFilteredStudios(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedPriceRange('all');
    setSortBy('name');
    setShowFilterModal(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCity !== 'all') count++;
    if (selectedPriceRange !== 'all') count++;
    if (sortBy !== 'name') count++;
    return count;
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

      {/* Price & Resources */}
      <View style={styles.priceResourceRow}>
        {item.minPrice > 0 && (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              From ₹{item.minPrice.toLocaleString('en-IN')}/hr
            </Text>
          </View>
        )}
        {item.resourceCount > 0 && (
          <View style={styles.resourceTag}>
            <Text style={styles.resourceText}>
              {item.resourceCount} {item.resourceCount === 1 ? 'space' : 'spaces'}
            </Text>
          </View>
        )}
      </View>

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
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedCity !== 'all' || selectedPriceRange !== 'all'
          ? 'No Studios Found'
          : 'No Studios Available'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedCity !== 'all' || selectedPriceRange !== 'all'
          ? 'Try adjusting your filters or search query'
          : 'Check back later for new studios'}
      </Text>
      {(searchQuery || selectedCity !== 'all' || selectedPriceRange !== 'all') && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
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

  const activeFilters = getActiveFilterCount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏢 Browse Studios</Text>
        <Text style={styles.headerSubtitle}>
          {filteredStudios.length} {filteredStudios.length === 1 ? 'studio' : 'studios'}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search studios, city, location..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFilters > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Pills */}
      {activeFilters > 0 && (
        <View style={styles.activFiltersContainer}>
          {selectedCity !== 'all' && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>📍 {selectedCity}</Text>
              <TouchableOpacity onPress={() => setSelectedCity('all')}>
                <Text style={styles.filterPillClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedPriceRange !== 'all' && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>
                💰 {selectedPriceRange.replace('_', '-')}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPriceRange('all')}>
                <Text style={styles.filterPillClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {sortBy !== 'name' && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>
                🔄 {sortBy === 'price_low' ? 'Price: Low-High' : 'Price: High-Low'}
              </Text>
              <TouchableOpacity onPress={() => setSortBy('name')}>
                <Text style={styles.filterPillClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.clearAllPill} onPress={clearFilters}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Studio List */}
      <FlatList
        data={filteredStudios}
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* City Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Filter by City</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedCity === 'all' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedCity('all')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCity === 'all' && styles.optionTextActive,
                    ]}
                  >
                    All Cities
                  </Text>
                </TouchableOpacity>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.optionButton,
                      selectedCity === city && styles.optionButtonActive,
                    ]}
                    onPress={() => setSelectedCity(city)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedCity === city && styles.optionTextActive,
                      ]}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range (per hour)</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedPriceRange === 'all' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedPriceRange('all')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPriceRange === 'all' && styles.optionTextActive,
                    ]}
                  >
                    All Prices
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedPriceRange === 'under_1000' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedPriceRange('under_1000')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPriceRange === 'under_1000' && styles.optionTextActive,
                    ]}
                  >
                    Under ₹1,000
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedPriceRange === '1000_2000' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedPriceRange('1000_2000')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPriceRange === '1000_2000' && styles.optionTextActive,
                    ]}
                  >
                    ₹1,000 - ₹2,000
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedPriceRange === '2000_3000' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedPriceRange('2000_3000')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPriceRange === '2000_3000' && styles.optionTextActive,
                    ]}
                  >
                    ₹2,000 - ₹3,000
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedPriceRange === 'above_3000' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedPriceRange('above_3000')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPriceRange === 'above_3000' && styles.optionTextActive,
                    ]}
                  >
                    Above ₹3,000
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    sortBy === 'name' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSortBy('name')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === 'name' && styles.optionTextActive,
                    ]}
                  >
                    Name (A-Z)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    sortBy === 'price_low' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSortBy('price_low')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === 'price_low' && styles.optionTextActive,
                    ]}
                  >
                    Price: Low to High
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    sortBy === 'price_high' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSortBy('price_high')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === 'price_high' && styles.optionTextActive,
                    ]}
                  >
                    Price: High to Low
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalClearButton}
                onPress={clearFilters}
              >
                <Text style={styles.modalClearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalApplyButtonText}>
                  Show {filteredStudios.length} Studios
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    padding: 5,
  },
  filterButton: {
    width: 45,
    height: 45,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 20,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterPillText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  filterPillClose: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  clearAllPill: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearAllText: {
    fontSize: 13,
    color: '#fff',
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
    marginBottom: 10,
  },
  priceResourceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  priceTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  resourceTag: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  resourceText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
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
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clearButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
    padding: 5,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 10,
  },
  modalClearButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalClearButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalApplyButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});