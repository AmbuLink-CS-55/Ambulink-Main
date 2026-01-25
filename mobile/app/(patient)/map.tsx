import UserMap from "@/components/UserMap";
import * as Location from "expo-location";
import { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "@/src/languages/i18n";
import { useLocation } from "@/src/hooks/useLocation";
import { SocketClientCreator } from "@/src/socket";
import MapOptions from "../../components/patient/MapOptions";
import { Text } from "react-native";

type LatLng = {
  lat: number;
  lng: number;
};

type PickupRequest = {
  patientId: string;
  lat: number;
  lng: number;
};

type BookingState = {
  ambulance: {
    providerName: string
  }
  driver: {
    name: string
    lat: number
    lng: number
  }
}

const socket = SocketClientCreator.createSocket("PATIENT")

export default function Map() {
  const drivers: LatLng[] = [
    { lat: 6.898356108714619, lng: 79.85389578706928 },
    { lat: 6.895353174577009, lng: 79.85387845284518 },
    { lat: 6.893795771439718, lng: 79.85671259848431 },
  ];

  const locationState = useLocation();
  const [bookingState, setBookingState] = useState<BookingState>({
    ambulance: {
          providerName: "",
        },
    driver: {
      name: "",
      lat: 0,
      lng: 0,
    },
  });
  const [onRide, setOnRide] = useState<boolean>(false)

  console.log("user location:",locationState.location)

  useEffect(() => {
    socket.on("connect", () => { console.log("ws Connected") })
    socket.on("message", (msg: string) => { console.log(msg) })
    socket.on("driver:assigned", (data: BookingState) => {

      updateBookingSatus(data)
    })
    socket.on("driver:location", (data: LatLng) => { updateDriverLocation(data) })
  }, [])

  const handleHelpRequest = () => {
    if (!locationState) {
      console.log("could not get user location")
      return
    }
    const pickupRequest: PickupRequest = {
      patientId: "1",
      lat: locationState!.location!.latitude,
      lng: locationState!.location!.longitude,
    };
    console.log("patient:help", pickupRequest)
    socket.emit("patient:help", pickupRequest);
  }

  const updateBookingSatus = (data: BookingState) => {
    setBookingState((prev) => ({
      ambulance: {
        providerName: data.ambulance.providerName
      },
      driver: {
        name: data.driver.name,
        lat: data.driver.lat,
        lng: data.driver.lng,
      }
    }))
  }

  const updateDriverLocation = (data: LatLng) => {
    setBookingState((prev) => ({
      ...prev,
      driver: {
        ...prev.driver,
        lat: data.lat,
        lng: data.lng
      }
    }))
  }

  // comment this out this if map takes long to load, but the map will use the hard coded values.
  // getting user location on cold start is slow, for a bunch of reasons, we should find a better way after mvp
  // if (loading) return <Text>Loading location...</Text>;

  if (!locationState?.location?.latitude){
    return (
      <Text>Loading</Text>
    )
  }

  return (
    <>
      <UserMap
        driverLocations={drivers}
        userLocation={{
            lat: locationState.location!.latitude,
            lng: locationState.location!.longitude,
          }}
      >
        <MapOptions
          ambulanceFound={onRide}
          onHelpRequest={handleHelpRequest}
          cancelRequest={() => {}}
        />
      </UserMap>
    </>
  );
}
