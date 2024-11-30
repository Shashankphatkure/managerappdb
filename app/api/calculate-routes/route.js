import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { origins, destinations } = await request.json();

    // Validate inputs
    if (!origins || !destinations || !origins.length || !destinations.length) {
      throw new Error("Invalid origins or destinations");
    }

    console.log("Initial store location:", origins[0]);
    console.log("All destinations:", destinations);

    // We'll store all leg results here
    let allLegs = [];
    let currentOrigin = origins[0];
    let remainingDestinations = [...destinations];

    // Calculate each leg of the journey
    while (remainingDestinations.length > 0) {
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

      console.log(`Calculating distances from: ${currentOrigin}`);

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(
          `Google Maps API Error: ${data.status} - ${
            data.error_message || "Unknown error"
          }`
        );
      }

      // Find the closest destination
      const elements = data.rows[0].elements;
      let shortestDuration = Infinity;
      let shortestIndex = 0;

      elements.forEach((element, index) => {
        if (
          element.status === "OK" &&
          element.duration.value < shortestDuration
        ) {
          shortestDuration = element.duration.value;
          shortestIndex = index;
        }
      });

      // Add this leg to our results
      allLegs.push({
        origin: currentOrigin,
        destination: remainingDestinations[shortestIndex],
        distance: elements[shortestIndex].distance.text,
        duration: elements[shortestIndex].duration.text,
        durationValue: elements[shortestIndex].duration.value,
      });

      // Update for next iteration
      currentOrigin = remainingDestinations[shortestIndex];
      remainingDestinations = [
        ...remainingDestinations.slice(0, shortestIndex),
        ...remainingDestinations.slice(shortestIndex + 1),
      ];
    }

    console.log("Optimized route:", allLegs);

    return NextResponse.json({
      success: true,
      legs: allLegs,
    });
  } catch (error) {
    console.error("Error in calculate-routes API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
