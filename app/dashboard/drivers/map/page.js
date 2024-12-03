"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../../components/DashboardLayout";
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { GoogleMap, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 14.6669568,
  lng: 74.30144,
};

export default function DriversMapPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const loadActiveDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          full_name,
          location,
          status,
          is_active
        `
        )
        .eq("is_active", true)
        .not("location", "is", null);

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveDrivers();
  }, [supabase]);

  const getDriverPosition = (location) => {
    try {
      if (!location) return null;

      const [lat, lng] = location
        .split(",")
        .map((coord) => parseFloat(coord.trim()));

      if (isNaN(lat) || isNaN(lng)) return null;

      return {
        lat,
        lng,
      };
    } catch (error) {
      console.error("Error parsing location:", error);
      return null;
    }
  };

  const calculateMapCenter = () => {
    if (drivers.length === 0) return defaultCenter;

    const validPositions = drivers
      .map((driver) => getDriverPosition(driver.location))
      .filter((pos) => pos !== null);

    if (validPositions.length === 0) return defaultCenter;

    const sumLat = validPositions.reduce((sum, pos) => sum + pos.lat, 0);
    const sumLng = validPositions.reduce((sum, pos) => sum + pos.lng, 0);

    const center = {
      lat: sumLat / validPositions.length,
      lng: sumLng / validPositions.length,
    };

    if (isNaN(center.lat) || isNaN(center.lng)) return defaultCenter;

    return center;
  };

  const refreshDrivers = () => {
    loadActiveDrivers();
  };

  return (
    <DashboardLayout
      title="Active Drivers Map"
      subtitle={`${drivers.length} Active Drivers`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={refreshDrivers}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
          <Link
            href="/dashboard/drivers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Drivers
          </Link>
        </div>
      }
    >
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm h-[600px]">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={calculateMapCenter()}
              zoom={12}
              options={{
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }],
                  },
                ],
                fullscreenControl: false,
                streetViewControl: false,
              }}
            >
              {drivers.map((driver) => {
                const position = getDriverPosition(driver.location);
                if (!position) return null;

                return (
                  <Marker
                    key={driver.id}
                    position={position}
                    title={driver.full_name}
                  />
                );
              })}
            </GoogleMap>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
