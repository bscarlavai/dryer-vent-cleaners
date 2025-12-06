"use client";
import React from "react";
import dynamic from "next/dynamic";

const NearbyLocationsSection = dynamic(() => import("./NearbyLocationsSection"), { ssr: false });

interface Props {
  cityLat: number;
  cityLng: number;
  cityName: string;
  state: string;
  cityLocationIds: string[];
}

export default function NearbySectionWrapper({ cityLat, cityLng, cityName, state, cityLocationIds }: Props) {
  const [hasNearby, setHasNearby] = React.useState(false);
  React.useEffect(() => {
    import("@/lib/locationUtils").then(({ searchLocationsByLatLng }) => {
      searchLocationsByLatLng(cityLat, cityLng, 25).then((locations: any[]) => {
        const filtered = (locations || []).filter(loc => !cityLocationIds.includes(loc.id));
        setHasNearby(filtered.length > 0);
      });
    });
  }, [cityLat, cityLng, cityLocationIds]);
  if (!hasNearby) return null;
  return (
    <section className="bg-primary/5 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NearbyLocationsSection
          latitude={cityLat}
          longitude={cityLng}
          currentLocationId={''}
          city={cityName}
          state={state}
          excludeIds={cityLocationIds}
        />
      </div>
    </section>
  );
} 