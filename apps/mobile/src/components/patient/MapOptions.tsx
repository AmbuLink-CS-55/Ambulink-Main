import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { BookingStatus, User, Hospital } from "@ambulink/types";

interface MapOptionsProps {
  bookingAssigned: boolean;
  status: BookingStatus;
  booking: { patient: User; pickedDriver: User; hospital: Hospital } | null;
  onHelpRequest: () => void;
  cancelRequest: () => void;
  isCancelling?: boolean;
}

export default function MapOptions({
  bookingAssigned,
  status,
  booking,
  onHelpRequest,
  cancelRequest,
  isCancelling = false,
}: MapOptionsProps) {

  // if (status === "COMPLETED") {
  //   return (
  //     <View className="bg-white p-4 w-full rounded-2xl shadow-lg items-center">
  //       <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
  //       <Text className="text-green-600 font-bold text-xl mt-2">
  //         Ride Completed
  //       </Text>
  //       <Text className="text-gray-500 mt-1">
  //         You have arrived at {booking?.hospital.name}
  //       </Text>
  //     </View>
  //   );
  // }

  if (status === "ARRIVED" && booking) {
    return (
      <View className="bg-white p-4 w-full rounded-2xl shadow-lg">
        <View className="items-center mb-3">
          <Ionicons name="car" size={32} color="#f59e0b" />
          <Text className="text-amber-600 font-bold text-lg mt-1">Ambulance Arrived!</Text>
        </View>
        <View className="border-t border-gray-100 pt-3">
          <Text className="text-gray-500 text-sm">Provider</Text>
          <Text className="font-semibold">{booking?.pickedDriver.providerId}</Text>
        </View>
        <View className="mt-2">
          <Text className="text-gray-500 text-sm">Destination</Text>
          <Text className="font-semibold">{booking?.hospital.name}</Text>
        </View>
      </View>
    );
  }

  if (status === "ASSIGNED" && booking) {
    return (
      <View className="bg-white p-4 w-full rounded-2xl shadow-lg">
        <View className="flex-row items-center mb-3">
          <View className="bg-green-100 p-2 rounded-full mr-3">
            <Ionicons name="car" size={24} color="#22c55e" />
          </View>
          <View className="flex-1">
            <Text className="text-green-600 font-bold">Ambulance Assigned</Text>
            <Text className="text-gray-500 text-sm">On the way to you</Text>
          </View>
        </View>

        <View className="border-t border-gray-100 pt-3">
          <Text className="text-gray-500 text-sm">Provider</Text>
          <Text className="font-semibold">{booking.pickedDriver.providerId}</Text>
        </View>

        <View className="mt-2">
          <Text className="text-gray-500 text-sm">Destination Hospital</Text>
          <Text className="font-semibold">{booking.hospital.name}</Text>
        </View>

        <TouchableOpacity
          className={`justify-center items-center p-3 mt-4 rounded-xl ${isCancelling ? "bg-red-300" : "bg-red-500"}`}
          activeOpacity={0.8}
          onPress={cancelRequest}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-bold uppercase ml-2">Cancelling...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold uppercase">Cancel</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // idle state
  return (
    <TouchableOpacity
      className="bg-white justify-center items-center p-4 w-full rounded-2xl shadow-lg"
      activeOpacity={0.9}
      onPress={onHelpRequest}
    >
      <Text className="text-black font-bold text-xl uppercase">Book</Text>
    </TouchableOpacity>
  );
}
