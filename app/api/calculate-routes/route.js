import { NextResponse } from "next/server";

// Function to normalize address format for better Google Maps API compatibility
function normalizeAddress(address) {
  if (!address) return "";
  
  // Remove parentheses and their contents, as they often contain non-standard information
  let normalized = address.replace(/\([^)]*\)/g, " ");
  
  // Remove special characters that might cause issues
  normalized = normalized.replace(/[^\w\s,./-]/g, " ");
  
  // Replace sequences like "Sector-20" with "Sector 20" as Google prefers spaces
  normalized = normalized.replace(/(\w+)-(\d+)/g, "$1 $2");
  
  // Remove prefixes like "B-103" and "B-2" which can confuse the API
  // If it looks like an apartment/house number followed by a comma, keep it
  if (!normalized.match(/^[A-Z]-\d+,/)) {
    normalized = normalized.replace(/^[A-Z]-\d+,?\s*/, "");
  }
  
  // Remove abbreviations like "Oppt-" which Maps doesn't recognize
  normalized = normalized.replace(/\bOppt-\b/gi, "Opposite ");
  
  // Replace (W) with West, (E) with East, etc.
  normalized = normalized.replace(/\bW\b/gi, "West");
  normalized = normalized.replace(/\bE\b/gi, "East");
  normalized = normalized.replace(/\bN\b/gi, "North");
  normalized = normalized.replace(/\bS\b/gi, "South");
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  // Extract key components: try to get city, state, pin code
  let components = [];
  
  // Extract PIN code (Indian postal code is 6 digits)
  const pinMatch = normalized.match(/\b(\d{6})\b/);
  const pinCode = pinMatch ? pinMatch[1] : "";
  
  // Try to extract major cities
  const cityMatch = normalized.match(/\b(Mumbai|Delhi|Kolkata|Chennai|Bangalore|Hyderabad|Pune|Ahmedabad|Navi Mumbai|Panvel|Nerul)\b/i);
  const city = cityMatch ? cityMatch[0] : "";
  
  // Try to extract state
  const stateMatch = normalized.match(/\b(Maharashtra|Gujarat|Karnataka|Tamil Nadu|Telangana|West Bengal|Uttar Pradesh|Rajasthan|Bihar|Assam)\b/i);
  const state = stateMatch ? stateMatch[0] : "";
  
  // Build a simplified address
  if (city) components.push(city);
  if (state) components.push(state);
  if (pinCode) components.push(pinCode);
  components.push("India");
  
  // Simplified version as fallback
  const simplifiedAddress = components.join(", ");
  
  console.log(`API - Normalized address: "${address}" to "${normalized}"`);
  console.log(`API - Simplified version: "${simplifiedAddress}"`);
  
  // Use the simplified version if the original normalized address is very long
  // This can help with addresses that have too many specific details
  return normalized.length > 100 ? simplifiedAddress : normalized + ", India";
}

// Function to geocode an address to coordinates
async function geocodeAddress(address, region = "in") {
  try {
    console.log(`API - Attempting to geocode address: ${address}`);
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", address);
    url.searchParams.append("key", process.env.GOOGLE_MAPS_API_KEY);
    
    // Add region biasing for India
    url.searchParams.append("region", region);
    
    // Add a component filter to constrain results to India 
    url.searchParams.append("components", "country:IN");
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log(`API - Geocoded "${address}" to ${location.lat},${location.lng}`);
      console.log(`API - Geocoding result details:`, {
        formatted_address: data.results[0].formatted_address,
        place_id: data.results[0].place_id,
        types: data.results[0].types
      });
      return {
        coords: `${location.lat},${location.lng}`,
        formatted_address: data.results[0].formatted_address,
        place_id: data.results[0].place_id
      };
    }
    
    console.error(`API - Failed to geocode address: ${address}`, data);
    return null;
  } catch (error) {
    console.error(`API - Error geocoding address: ${address}`, error);
    return null;
  }
}

// Function to check if locations are in same area by comparing district/city components
function areLocationsInSameArea(originAddress, destAddress) {
  // Check if they share the same city/district name
  const locationRegex = /\b(Mumbai|Delhi|Kolkata|Chennai|Bangalore|Hyderabad|Pune|Ahmedabad|Panvel|Navi Mumbai|Nerul)\b/ig;
  
  const originMatches = originAddress.match(locationRegex) || [];
  const destMatches = destAddress.match(locationRegex) || [];
  
  // Check if they have at least one location in common
  return originMatches.some(place => 
    destMatches.some(destPlace => 
      destPlace.toLowerCase() === place.toLowerCase()
    )
  );
}

// Function to calculate straight-line distance between coordinates
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
    console.log("API - Received request with data:", { origins, destinations });

    // Validate inputs
    if (!origins || !destinations || !origins.length || !destinations.length) {
      console.error("API - Invalid request data: Missing origins or destinations");
      throw new Error("Invalid origins or destinations");
    }

    // Normalize addresses for better geocoding
    const normalizedOrigins = origins.map(normalizeAddress);
    const normalizedDestinations = destinations.map(normalizeAddress);

    console.log("API - Initial store location:", origins[0]);
    console.log("API - Normalized store location:", normalizedOrigins[0]);
    console.log("API - Destination address:", destinations[0]);
    console.log("API - Normalized destination address:", normalizedDestinations[0]);

    // Check if locations appear to be in the same area
    const sameArea = areLocationsInSameArea(origins[0], destinations[0]);
    console.log(`API - Locations appear to be in the same area: ${sameArea}`);

    // If we suspect they're in the same area, let's try the address geocoding approach
    const originGeocode = await geocodeAddress(normalizedOrigins[0]);
    if (!originGeocode) {
      return NextResponse.json({
        success: false,
        error: "Could not geocode origin address. Please check the address and try again."
      }, { status: 400 });
    }
    
    const destGeocode = await geocodeAddress(normalizedDestinations[0]);
    if (!destGeocode) {
      return NextResponse.json({
        success: false,
        error: "Could not geocode destination address. Please check the address and try again."
      }, { status: 400 });
    }
    
    // Extract coordinates for distance validation
    const [originLat, originLng] = originGeocode.coords.split(',').map(parseFloat);
    const [destLat, destLng] = destGeocode.coords.split(',').map(parseFloat);
    
    // Calculate straight-line distance to validate
    const straightLineDistance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
    console.log(`API - Straight-line distance between points: ${straightLineDistance.toFixed(2)} km`);
    
    // Check if the straight-line distance is suspicious (too large for same area)
    const suspiciousDistance = sameArea && straightLineDistance > 50;
    if (suspiciousDistance) {
      console.log(`API - Warning: Suspicious distance for locations in same area: ${straightLineDistance.toFixed(2)} km`);
      
      // Try more specific address with neighborhood context
      let alternateResults = null;
      
      // If we're dealing with Panvel specifically
      if (origins[0].toLowerCase().includes('panvel') && destinations[0].toLowerCase().includes('panvel')) {
        console.log("API - Trying Panvel-specific geocoding with neighborhood context");
        
        // Try direct estimated distance for Panvel area
        const estimatedDistance = Math.min(straightLineDistance * 1.3, 15); // Cap at 15km for Panvel area
        const estimatedDuration = Math.round(estimatedDistance * 3 * 60); // Rough estimate: 20 km/h average speed
        
        // Return a reasonable estimate
        return NextResponse.json({
          success: true,
          legs: [{
            origin: origins[0],
            destination: destinations[0],
            distance: `${estimatedDistance.toFixed(1)} km`,
            duration: `${Math.floor(estimatedDuration/60)} mins`,
            durationValue: estimatedDuration,
            estimated: true
          }]
        });
      }
    }

    // We'll store all leg results here
    let allLegs = [];
    let currentOrigin = normalizedOrigins[0];
    let remainingDestinations = [...normalizedDestinations];
    console.log("API - Starting route calculation from origin to destinations");

    // Calculate each leg of the journey
    while (remainingDestinations.length > 0) {
      console.log(`API - ${remainingDestinations.length} destination(s) remaining to process`);
      const url = new URL(
        "https://maps.googleapis.com/maps/api/distancematrix/json"
      );

      // For each API call, we use the current location as origin
      // and all remaining destinations to find the closest one
      url.searchParams.append("origins", encodeURIComponent(currentOrigin));
      url.searchParams.append(
        "destinations",
        remainingDestinations.map((dest) => encodeURIComponent(dest)).join("|")
      );
      url.searchParams.append("key", process.env.GOOGLE_MAPS_API_KEY);

      console.log(`API - Calling Google Maps API for current location: ${currentOrigin}`);
      console.log(`API - Destinations being queried:`, remainingDestinations);

      const response = await fetch(url);
      const data = await response.json();
      
      console.log("API - Google Maps API response status:", data.status);
      if (data.status !== "OK") {
        console.error("API - Google Maps API error:", {
          status: data.status,
          error_message: data.error_message || "Unknown error",
          data: data
        });
        throw new Error(
          `Google Maps API Error: ${data.status} - ${
            data.error_message || "Unknown error"
          }`
        );
      }

      // Find the closest destination
      const elements = data.rows[0].elements;
      console.log("API - Distance matrix elements:", elements);
      
      // Check if we have valid results
      const validElements = elements.filter(element => element.status === "OK");
      if (validElements.length === 0) {
        console.log("API - No valid routes found, trying geocoding as fallback");
        
        // Try geocoding approach instead
        const originCoords = originGeocode.coords;
        
        // Use the destination geocode we already performed
        const destCoords = [{ 
          address: remainingDestinations[0], 
          coords: destGeocode.coords 
        }];
        
        // Try distance matrix with coordinates
        const coordUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
        coordUrl.searchParams.append("origins", originCoords);
        coordUrl.searchParams.append(
          "destinations", 
          destCoords.map(d => d.coords).join("|")
        );
        coordUrl.searchParams.append("key", process.env.GOOGLE_MAPS_API_KEY);
        
        console.log("API - Retrying with geocoded coordinates", {
          origin: originCoords,
          destinations: destCoords.map(d => d.coords)
        });
        
        const coordResponse = await fetch(coordUrl);
        const coordData = await coordResponse.json();
        
        if (coordData.status !== "OK") {
          return NextResponse.json({
            success: false,
            error: "Route calculation failed even with geocoded coordinates."
          }, { status: 400 });
        }
        
        const coordElements = coordData.rows[0].elements;
        console.log("API - Distance matrix with coordinates:", coordElements);
        
        const validCoordElements = coordElements.filter(element => element.status === "OK");
        if (validCoordElements.length === 0) {
          // If still no valid routes, use haversine distance as fallback
          if (sameArea) {
            // Calculate straight-line distance and apply a multiplier for road distance
            const roadDistance = straightLineDistance * 1.3; // Assume roads are 30% longer than straight line
            const estimatedDuration = Math.round(roadDistance * 3 * 60); // Rough estimate: 20 km/h average speed
            
            const fallbackLeg = {
              origin: origins[0],
              destination: destinations[0],
              distance: `${roadDistance.toFixed(1)} km`,
              duration: `${Math.floor(estimatedDuration/60)} mins`,
              durationValue: estimatedDuration,
              estimated: true
            };
            
            console.log("API - Using estimated distance as fallback:", fallbackLeg);
            allLegs.push(fallbackLeg);
            
            return NextResponse.json({
              success: true,
              legs: allLegs,
              estimated: true
            });
          }
          
          return NextResponse.json({
            success: false,
            error: "No valid routes found even with geocoded coordinates."
          }, { status: 400 });
        }
        
        let shortestDuration = Infinity;
        let shortestIndex = 0;
        
        coordElements.forEach((element, index) => {
          if (element.status === "OK" && element.duration.value < shortestDuration) {
            shortestDuration = element.duration.value;
            shortestIndex = index;
          }
        });
        
        const currentLeg = {
          origin: currentOrigin,
          destination: destCoords[shortestIndex].address,
          distance: coordElements[shortestIndex].distance?.text || "Unknown",
          duration: coordElements[shortestIndex].duration?.text || "Unknown",
          durationValue: coordElements[shortestIndex].duration?.value || 0,
        };
        
        console.log("API - Adding leg to route from geocoded coordinates:", currentLeg);
        allLegs.push(currentLeg);
        
        // Update for next iteration
        currentOrigin = destCoords[shortestIndex].address;
        remainingDestinations = [
          ...remainingDestinations.slice(0, remainingDestinations.indexOf(destCoords[shortestIndex].address)),
          ...remainingDestinations.slice(remainingDestinations.indexOf(destCoords[shortestIndex].address) + 1)
        ];
        
        continue;
      }
      
      let shortestDuration = Infinity;
      let shortestIndex = 0;

      elements.forEach((element, index) => {
        console.log(`API - Checking element ${index}:`, element);
        if (
          element.status === "OK" &&
          element.duration.value < shortestDuration
        ) {
          shortestDuration = element.duration.value;
          shortestIndex = index;
          console.log(`API - New closest destination found: ${remainingDestinations[index]} with duration ${element.duration.text}`);
        }
      });

      // Add this leg to our results
      const currentLeg = {
        origin: currentOrigin,
        destination: remainingDestinations[shortestIndex],
        distance: elements[shortestIndex].distance?.text || "Unknown",
        duration: elements[shortestIndex].duration?.text || "Unknown",
        durationValue: elements[shortestIndex].duration?.value || 0,
      };
      
      console.log("API - Adding leg to route:", currentLeg);
      allLegs.push(currentLeg);

      // Update for next iteration
      currentOrigin = remainingDestinations[shortestIndex];
      remainingDestinations = [
        ...remainingDestinations.slice(0, shortestIndex),
        ...remainingDestinations.slice(shortestIndex + 1),
      ];
    }

    console.log("API - Optimized route calculation complete:", allLegs);

    return NextResponse.json({
      success: true,
      legs: allLegs,
    });
  } catch (error) {
    console.error("API - Error in calculate-routes API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
