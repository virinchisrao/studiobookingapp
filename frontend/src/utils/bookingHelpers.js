// frontend/src/utils/bookingHelpers.js

import { studioAPI, resourceAPI, authAPI } from '../services/api';

/**
 * Enrich bookings with studio, resource, and user names
 */
export const enrichBookingsWithNames = async (bookings) => {
  if (!bookings || bookings.length === 0) return [];

  try {
    // Get unique IDs
    const studioIds = [...new Set(bookings.map(b => b.studio_id))];
    const resourceIds = [...new Set(bookings.map(b => b.resource_id))];
    
    // Fetch all studios and resources in parallel
    const [studios, resources] = await Promise.all([
      Promise.all(studioIds.map(id => 
        studioAPI.getStudio(id).catch(() => null)
      )),
      Promise.all(resourceIds.map(id => 
        resourceAPI.getResource(id).catch(() => null)
      ))
    ]);

    // Create lookup maps
    const studioMap = {};
    studios.forEach(studio => {
      if (studio) studioMap[studio.studio_id] = studio;
    });

    const resourceMap = {};
    resources.forEach(resource => {
      if (resource) resourceMap[resource.resource_id] = resource;
    });

    // Enrich bookings
    return bookings.map(booking => ({
      ...booking,
      studio_name: studioMap[booking.studio_id]?.name || `Studio #${booking.studio_id}`,
      resource_name: resourceMap[booking.resource_id]?.name || `Resource #${booking.resource_id}`,
      resource_type: resourceMap[booking.resource_id]?.resource_type,
    }));
  } catch (error) {
    console.error('Error enriching bookings:', error);
    return bookings;
  }
};

/**
 * Get resource icon by type
 */
export const getResourceIcon = (type) => {
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