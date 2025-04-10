import { NextResponse } from "next/server";
import fetch from "node-fetch";

// Function to normalize address format
function normalizeAddress(address) {
  if (!address) return "";
  
  // Remove extra spaces and standardize formatting
  let normalized = address.trim().replace(/\s+/g, " ");
  
  // Only add "India" if it's not already there and we're dealing with an Indian address
  if (!normalized.toLowerCase().includes("india") && 
      (normalized.toLowerCase().includes("mumbai") || 
       normalized.toLowerCase().includes("navi mumbai") ||
       normalized.toLowerCase().includes("maharashtra"))) {
    return `${normalized}, India`;
  }
  
  return normalized;
}

// Function to calculate route using Google Maps Routes API with TWO_WHEELER mode
async function calculateRoute(origin, destination) {
  try {
    console.log(`API - Calculating TWO_WHEELER route from "${origin}" to "${destination}"`);
    
    // First, geocode addresses to get precise location data
    const originGeo = await geocodeAddress(origin);
    const destinationGeo = await geocodeAddress(destination);
    
    if (!originGeo || !destinationGeo) {
      throw new Error("Failed to geocode one or both addresses");
    }
    
    console.log(`API - Using geocoded addresses:
      Origin: ${originGeo.formatted_address}
      Destination: ${destinationGeo.formatted_address}`);
    
    // Use Routes API with TWO_WHEELER travel mode
    // This is a direct REST API call according to the Routes API documentation
    const routesUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";
    
    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: originGeo.lat,
            longitude: originGeo.lng
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: destinationGeo.lat,
            longitude: destinationGeo.lng
          }
        }
      },
      travelMode: "TWO_WHEELER",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: true,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false
      },
      languageCode: "en-US",
      units: "METRIC"
    };
    
    const response = await fetch(routesUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API - Routes API error: ${response.status} ${errorText}`);
      throw new Error(`Routes API returned status: ${response.status}`);
    }
    
    const routesData = await response.json();
    
    if (!routesData.routes || routesData.routes.length === 0) {
      throw new Error("Routes API returned no routes");
    }
    
    console.log(`API - Found ${routesData.routes.length} route options`);
    
    // Use the primary route (Google's recommended route)
    const selectedRoute = routesData.routes[0];
    
    // Extract distance and duration information
    const distanceMeters = selectedRoute.distanceMeters;
    const distance = `${(distanceMeters / 1000).toFixed(1)} km`;
    
    const durationSeconds = parseInt(selectedRoute.duration.replace('s', ''));
    const durationMinutes = Math.round(durationSeconds / 60);
    const duration = durationMinutes < 60 
      ? `${durationMinutes} mins`
      : `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} mins`;
    
    // Extract route information
    const routeSummary = selectedRoute.description || "Route via Google Maps";
    
    console.log(`API - Selected route: ${routeSummary}`);
    console.log(`API - Route details: ${distance}, ${duration}`);
    
    return {
      distance,
      duration,
      durationValue: durationSeconds,
      distanceValue: distanceMeters,
      estimated: false,
      via: routeSummary,
      resolvedStartAddress: originGeo.formatted_address,
      resolvedEndAddress: destinationGeo.formatted_address,
      googleMapsQuery: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originGeo.formatted_address)}&destination=${encodeURIComponent(destinationGeo.formatted_address)}&travelmode=driving`
    };
  } catch (error) {
    console.error("API - Error with Routes API:", error);
    
    // Try Directions API as fallback
    return fallbackToDirectionsAPI(origin, destination);
  }
}

// Fallback to Directions API if Routes API fails
async function fallbackToDirectionsAPI(origin, destination) {
  try {
    console.log("API - Falling back to Directions API");
    
    // First, geocode addresses for consistency
    const originGeo = await geocodeAddress(origin);
    const destinationGeo = await geocodeAddress(destination);
    
    if (!originGeo || !destinationGeo) {
      throw new Error("Failed to geocode one or both addresses in fallback");
    }
    
    // Prepare Directions API URL
    const directionsUrl = new URL("https://maps.googleapis.com/maps/api/directions/json");
    
    // Add required parameters
    directionsUrl.searchParams.append("origin", `${originGeo.lat},${originGeo.lng}`);
    directionsUrl.searchParams.append("destination", `${destinationGeo.lat},${destinationGeo.lng}`);
    directionsUrl.searchParams.append("mode", "driving"); // Closest to motorcycle
    directionsUrl.searchParams.append("departure_time", "now");
    directionsUrl.searchParams.append("traffic_model", "best_guess");
    directionsUrl.searchParams.append("alternatives", "true");
    directionsUrl.searchParams.append("key", process.env.GOOGLE_MAPS_API_KEY);
    
    const response = await fetch(directionsUrl);
    const data = await response.json();
    
    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      throw new Error(`Directions API returned status: ${data.status}`);
    }
    
    // Use the first route
    const route = data.routes[0];
    const leg = route.legs[0];
    
    // Apply a slight time adjustment for two-wheelers (typically 5-10% faster than cars)
    const durationSeconds = leg.duration_in_traffic?.value || leg.duration.value;
    const adjustedDurationSeconds = Math.round(durationSeconds * 0.95); // 5% faster
    
    // Format duration similar to Google Maps
    const durationMinutes = Math.round(adjustedDurationSeconds / 60);
    const duration = durationMinutes < 60 
      ? `${durationMinutes} mins`
      : `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} mins`;
    
    const routeSummary = `via ${route.summary}`;
    
    return {
      distance: leg.distance.text,
      duration,
      durationValue: adjustedDurationSeconds,
      distanceValue: leg.distance.value,
      estimated: false,
      via: routeSummary,
      resolvedStartAddress: leg.start_address,
      resolvedEndAddress: leg.end_address,
      googleMapsQuery: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(leg.start_address)}&destination=${encodeURIComponent(leg.end_address)}&travelmode=driving`
    };
  } catch (fallbackError) {
    console.error("API - Error with fallback Directions API:", fallbackError);
    
    // As a last resort, use Distance Matrix API
    return fallbackToDistanceMatrix(origin, destination);
  }
}

// Second fallback to Distance Matrix API
async function fallbackToDistanceMatrix(origin, destination) {
  try {
    console.log("API - Falling back to Distance Matrix API");
    
    // Try to geocode addresses first
    const originGeo = await geocodeAddress(origin);
    const destinationGeo = await geocodeAddress(destination);
    
    if (!originGeo || !destinationGeo) {
      throw new Error("Failed to geocode one or both addresses in Distance Matrix fallback");
    }
    
    // Prepare Distance Matrix API URL
    const matrixUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    
    // Add required parameters
    matrixUrl.searchParams.append("origins", `${originGeo.lat},${originGeo.lng}`);
    matrixUrl.searchParams.append("destinations", `${destinationGeo.lat},${destinationGeo.lng}`);
    matrixUrl.searchParams.append("mode", "driving");
    matrixUrl.searchParams.append("departure_time", "now");
    matrixUrl.searchParams.append("traffic_model", "best_guess");
    matrixUrl.searchParams.append("key", process.env.GOOGLE_MAPS_API_KEY);
    
    const response = await fetch(matrixUrl);
    const data = await response.json();
    
    if (data.status !== "OK") {
      throw new Error(`Distance Matrix API returned status: ${data.status}`);
    }
    
    const elements = data.rows[0]?.elements;
    
    if (!elements || elements.length === 0 || elements[0].status !== "OK") {
      throw new Error(`Could not find route: ${elements?.[0]?.status || "Unknown error"}`);
    }
    
    const result = elements[0];
    
    // Apply slight adjustment for motorcycle times (5% faster)
    const durationSeconds = result.duration_in_traffic?.value || result.duration.value;
    const adjustedDurationSeconds = Math.round(durationSeconds * 0.95);
    
    // Format duration similar to Google Maps
    const durationMinutes = Math.round(adjustedDurationSeconds / 60);
    const duration = durationMinutes < 60 
      ? `${durationMinutes} mins`
      : `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} mins`;
    
    return {
      distance: result.distance.text,
      duration,
      durationValue: adjustedDurationSeconds,
      distanceValue: result.distance.value,
      estimated: false,
      via: "via best route",
      resolvedStartAddress: originGeo.formatted_address,
      resolvedEndAddress: destinationGeo.formatted_address,
      googleMapsQuery: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originGeo.formatted_address)}&destination=${encodeURIComponent(destinationGeo.formatted_address)}&travelmode=driving`
    };
  } catch (matrixError) {
    console.error("API - Error with Distance Matrix API:", matrixError);
    
    // Final fallback - estimate distance using straight-line calculation
    return estimateRoute(origin, destination);
  }
}

// Function to estimate route when all APIs fail
async function estimateRoute(origin, destination) {
  console.log(`API - Estimating route between "${origin}" and "${destination}"`);
  
  // Try to geocode both addresses
  const originGeo = await geocodeAddress(origin);
  const destinationGeo = await geocodeAddress(destination);
  
  if (!originGeo || !destinationGeo) {
    throw new Error("Could not geocode addresses for estimation");
  }
  
  // Calculate straight-line distance
  const straightLineDistance = calculateHaversineDistance(
    originGeo.lat, originGeo.lng, 
    destinationGeo.lat, destinationGeo.lng
  );
  
  // Apply multiplier to account for road travel (1.4 times straight line)
  const roadDistance = straightLineDistance * 1.4;
  
  // Estimate time based on average speed of 30 km/h
  const timeMinutes = Math.round(roadDistance * 60 / 30);
  
  console.log(`API - Estimated route: ${roadDistance.toFixed(1)} km, ${timeMinutes} mins`);
  
  return {
    distance: `${roadDistance.toFixed(1)} km`,
    duration: `${timeMinutes} mins`,
    durationValue: timeMinutes * 60,
    distanceValue: roadDistance * 1000, // Convert to meters
    estimated: true,
    via: "estimated route",
    resolvedStartAddress: originGeo.formatted_address,
    resolvedEndAddress: destinationGeo.formatted_address,
    googleMapsQuery: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originGeo.formatted_address)}&destination=${encodeURIComponent(destinationGeo.formatted_address)}&travelmode=driving`
  };
}

// Function to geocode address to coordinates
async function geocodeAddress(address) {
  try {
    console.log(`API - Geocoding address: ${address}`);
    
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", address);
    url.searchParams.append("key", process.env.GOOGLE_MAPS_API_KEY);
    url.searchParams.append("region", "in"); // Bias to India
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== "OK" || !data.results || !data.results[0]) {
      console.error(`API - Geocoding failed for: ${address}`, data);
      return null;
    }
    
    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: data.results[0].formatted_address
    };
  } catch (error) {
    console.error(`API - Error geocoding address: ${address}`, error);
    return null;
  }
}

// Function to calculate straight-line distance between coordinates (Haversine formula)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

export async function POST(request) {
  try {
    const { origins, destinations } = await request.json();
    console.log("API - Received request:", { origins, destinations });
    
    // Validate inputs
    if (!origins?.length || !destinations?.length) {
      return NextResponse.json({
        success: false,
        error: "Missing origin or destination addresses"
      }, { status: 400 });
    }
    
    // Normalize addresses
    const normalizedOrigin = normalizeAddress(origins[0]);
    const normalizedDestination = normalizeAddress(destinations[0]);
    
    console.log("API - Using normalized addresses:", {
      origin: normalizedOrigin,
      destination: normalizedDestination
    });
    
    // Calculate route
    const routeResult = await calculateRoute(normalizedOrigin, normalizedDestination);
    
    // Display warning for two-wheeler routes as required by Google
    const twoWheelerWarning = "Routes for two-wheeled vehicles are in beta and might sometimes be missing clear paths. Use caution when following these directions.";
    
    // Return result
    return NextResponse.json({
      success: true,
      estimated: routeResult.estimated,
      via: routeResult.via,
      resolvedStartAddress: routeResult.resolvedStartAddress,
      resolvedEndAddress: routeResult.resolvedEndAddress,
      twoWheelerWarning,
      googleMapsLink: routeResult.googleMapsQuery,
      legs: [{
        origin: origins[0],
        destination: destinations[0],
        resolvedStartAddress: routeResult.resolvedStartAddress,
        resolvedEndAddress: routeResult.resolvedEndAddress,
        distance: routeResult.distance,
        duration: routeResult.duration,
        durationValue: routeResult.durationValue,
        distanceValue: routeResult.distanceValue,
        estimated: routeResult.estimated,
        via: routeResult.via
      }]
    });
  } catch (error) {
    console.error("API - Error processing request:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message || "An error occurred calculating the route"
    }, { status: 500 });
  }
} 