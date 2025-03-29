"use client";
import React, { useState, useEffect, Fragment } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../../components/DashboardLayout";
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 19.033, // Navi Mumbai coordinates
  lng: 73.0297,
};

// Custom marker icons
const driverIcon = {
  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  scaledSize: { width: 32, height: 32 },
};

const destinationIcon = {
  url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  scaledSize: { width: 32, height: 32 },
};

const polylineOptions = {
  strokeColor: "#2563eb", // blue color
  strokeOpacity: 0.8,
  strokeWeight: 3,
};

export default function OrdersMapPage() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [geocodedDestinations, setGeocodedDestinations] = useState({});
  const supabase = createClientComponentClient();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Fetch active orders
      const { data: activeOrders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          destination,
          status,
          drivername,
          customername,
          driverid,
          customerid
        `
        )
        .not("status", "eq", "completed");

      if (ordersError) throw ordersError;
      setOrders(activeOrders || []);

      // Fetch drivers' locations
      const driverIds = activeOrders
        .map((order) => order.driverid)
        .filter(Boolean);
      if (driverIds.length > 0) {
        const { data: driversData, error: driversError } = await supabase
          .from("users")
          .select("id, location, full_name, phone, vehicle_number")
          .in("id", driverIds);

        if (driversError) throw driversError;

        const driversMap = {};
        driversData.forEach((driver) => {
          if (driver.location) {
            const [lat, lng] = driver.location.split(",").map(Number);
            driversMap[driver.id] = {
              position: { lat, lng },
              ...driver,
            };
          }
        });
        setDrivers(driversMap);
      }

      // Geocode destinations
      activeOrders?.forEach((order) => {
        if (order.destination) {
          geocodeAddress(order.destination, order.id);
        }
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = (address, orderId) => {
    if (!isLoaded) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK") {
        const { lat, lng } = results[0].geometry.location;
        setGeocodedDestinations((prev) => ({
          ...prev,
          [orderId]: {
            lat: lat(),
            lng: lng(),
            formattedAddress: results[0].formatted_address,
          },
        }));
      } else {
        console.error(`Geocoding failed for address: ${address}`);
      }
    });
  };

  useEffect(() => {
    if (isLoaded) {
      loadOrders();
    }
  }, [isLoaded]);

  const calculateMapCenter = () => {
    const locations = Object.values(geocodedDestinations);
    if (locations.length === 0) return defaultCenter;

    const sumLat = locations.reduce((sum, pos) => sum + pos.lat, 0);
    const sumLng = locations.reduce((sum, pos) => sum + pos.lng, 0);

    return {
      lat: sumLat / locations.length,
      lng: sumLng / locations.length,
    };
  };

  const refreshOrders = () => {
    setGeocodedDestinations({});
    loadOrders();
  };

  return (
    <DashboardLayout
      title="Active Orders Map"
      subtitle={`${orders.length} Active Orders`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={refreshOrders}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Orders
          </Link>
        </div>
      }
    >
      <div className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Driver Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Delivery Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-blue-500"></div>
            <span>Delivery Route</span>
          </div>
        </div>

        {loading || !isLoaded ? (
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
              {orders.map((order) => {
                const driver = drivers[order.driverid];
                const destinationLocation = geocodedDestinations[order.id];

                return (
                  <Fragment key={`order_${order.id}`}>
                    {driver?.position && destinationLocation && (
                      <Polyline
                        key={`route_${order.id}`}
                        path={[driver.position, destinationLocation]}
                        options={polylineOptions}
                      />
                    )}
                    {driver?.position && (
                      <Marker
                        key={`driver_${order.id}`}
                        position={driver.position}
                        icon={driverIcon}
                        title={driver.full_name}
                        onClick={() =>
                          setSelectedMarker({
                            type: "driver",
                            data: { ...order, driver },
                            location: driver.position,
                          })
                        }
                      />
                    )}
                    {destinationLocation && (
                      <Marker
                        key={`dest_${order.id}`}
                        position={destinationLocation}
                        icon={destinationIcon}
                        title={order.customername}
                        onClick={() =>
                          setSelectedMarker({
                            type: "destination",
                            data: order,
                            location: destinationLocation,
                          })
                        }
                      />
                    )}
                  </Fragment>
                );
              })}

              {selectedMarker && (
                <InfoWindow
                  position={selectedMarker.location}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2">
                    <h2 className="font-semibold text-lg">
                      {selectedMarker.type === "driver"
                        ? "Driver Location"
                        : "Delivery Destination"}
                    </h2>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Order ID:</span>{" "}
                      {selectedMarker.data.id}
                    </p>
                    {selectedMarker.type === "driver" ? (
                      <>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Driver:</span>{" "}
                          {selectedMarker.data.driver.full_name}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Phone:</span>{" "}
                          {selectedMarker.data.driver.phone}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Vehicle:</span>{" "}
                          {selectedMarker.data.driver.vehicle_number}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Customer:</span>{" "}
                          {selectedMarker.data.customername}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Address:</span>
                          <br />
                          {selectedMarker.location.formattedAddress}
                        </p>
                      </>
                    )}
                    <p className="text-sm mt-1">
                      <span className="font-medium">Status:</span>{" "}
                      {selectedMarker.data.status}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
