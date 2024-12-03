"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../../components/DashboardLayout";
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  GoogleMap,
  Marker,
  InfoWindow,
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

export default function CustomersMapPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [geocodedAddresses, setGeocodedAddresses] = useState({});
  const supabase = createClientComponentClient();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          id,
          full_name,
          phone,
          homeaddress,
          city,
          status
        `
        )
        .not("homeaddress", "is", null);

      if (error) throw error;
      setCustomers(data || []);

      // Geocode homeaddresses
      data?.forEach((customer) => {
        if (customer.homeaddress) {
          geocodeAddress(customer.homeaddress, customer.id);
        }
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = (address, customerId) => {
    if (!isLoaded) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK") {
        const { lat, lng } = results[0].geometry.location;
        setGeocodedAddresses((prev) => ({
          ...prev,
          [customerId]: {
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
      loadCustomers();
    }
  }, [isLoaded]);

  const calculateMapCenter = () => {
    const addresses = Object.values(geocodedAddresses);
    if (addresses.length === 0) return defaultCenter;

    const sumLat = addresses.reduce((sum, pos) => sum + pos.lat, 0);
    const sumLng = addresses.reduce((sum, pos) => sum + pos.lng, 0);

    return {
      lat: sumLat / addresses.length,
      lng: sumLng / addresses.length,
    };
  };

  const refreshCustomers = () => {
    setGeocodedAddresses({});
    loadCustomers();
  };

  // Add this for debugging
  useEffect(() => {
    console.log("Customers:", customers);
    console.log("Geocoded Addresses:", geocodedAddresses);
  }, [customers, geocodedAddresses]);

  return (
    <DashboardLayout
      title="Customers Map"
      subtitle={`${customers.length} Customers with Home Addresses`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={refreshCustomers}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Customers
          </Link>
        </div>
      }
    >
      <div className="p-6">
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
              {customers.map((customer) => {
                const position = geocodedAddresses[customer.id];
                if (!position) return null;

                return (
                  <Marker
                    key={customer.id}
                    position={position}
                    title={customer.full_name}
                    onClick={() => setSelectedCustomer(customer)}
                  />
                );
              })}

              {selectedCustomer && geocodedAddresses[selectedCustomer.id] && (
                <InfoWindow
                  position={geocodedAddresses[selectedCustomer.id]}
                  onCloseClick={() => setSelectedCustomer(null)}
                >
                  <div className="p-2">
                    <h2 className="font-semibold text-lg">
                      {selectedCustomer.full_name}
                    </h2>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Home Address:</span>
                      <br />
                      {selectedCustomer.homeaddress}
                    </p>
                    {selectedCustomer.phone && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Phone:</span>{" "}
                        {selectedCustomer.phone}
                      </p>
                    )}
                    {selectedCustomer.status && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Status:</span>{" "}
                        {selectedCustomer.status}
                      </p>
                    )}
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
