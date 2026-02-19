import { View, TouchableOpacity, Text, ActivityIndicator, Alert, Linking } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { BookingStatus, User, Hospital } from "@ambulink/types";

interface MapOptionsProps {
  bookingAssigned: boolean;
  status: BookingStatus;
  booking: {
    patient: User;
    pickedDriver: User;
    hospital: Hospital;
    provider?: { id: string; name: string; hotlineNumber?: string } | null;
  } | null;
  onHelpRequest: () => void;
  cancelRequest: () => void;
  isCancelling?: boolean;
  isBooking?: boolean;
  completedAt?: number | null;
}

export default function MapOptions({
  bookingAssigned,
  status,
  booking,
  onHelpRequest,
  cancelRequest,
  isCancelling = false,
  isBooking = false,
  completedAt = null,
}: MapOptionsProps) {
  const handleCall = (phone?: string) => {
    if (!phone) return Alert.alert("Error", "No phone number available");
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Error", "Could not open phone dialer")
    );
  };
  const shouldShowCompleted =
    status === "COMPLETED" && completedAt !== null && Date.now() - completedAt < 8000;

  if (shouldShowCompleted) {
    return (
      <View className="bg-white p-4 w-full rounded-2xl shadow-lg items-center">
        <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
        <Text className="text-green-600 font-bold text-xl mt-2">Trip Completed</Text>
        <Text className="text-gray-500 mt-1">
          {booking?.hospital?.name
            ? `You have arrived at ${booking.hospital.name}`
            : "You have arrived at your destination"}
        </Text>
      </View>
    );
  }

  if (status === "ARRIVED" && booking) {
    return (
      <View className="bg-white p-4 w-full rounded-2xl shadow-lg">
        <View className="items-center mb-3">
          <Ionicons name="car" size={32} color="#f59e0b" />
          <Text className="text-amber-600 font-bold text-lg mt-1">Ambulance Arrived!</Text>
        </View>
        <View className="border-t border-gray-100 pt-3">
          <Text className="text-gray-500 text-sm">Provider</Text>
          <Text className="font-semibold">{booking?.pickedDriver.providerId ?? ""}</Text>
        </View>
        <View className="mt-2">
          <Text className="text-gray-500 text-sm">Destination</Text>
          <Text className="font-semibold">{booking?.hospital.name}</Text>
        </View>
      </View>
    );
  }

  if (status === "ASSIGNED" && booking) {
    console.log(booking);
    const driverPhone = booking.pickedDriver.phoneNumber;
    const providerPhone = booking.provider?.hotlineNumber;
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
          <Text className="font-semibold">{booking.pickedDriver.providerId ?? ""}</Text>
        </View>

        <View className="mt-2">
          <Text className="text-gray-500 text-sm">Destination Hospital</Text>
          <Text className="font-semibold">{booking.hospital.name}</Text>
        </View>

        <View className="flex-row gap-2 mt-4">
          <TouchableOpacity
            className={`flex-1 items-center justify-center p-3 rounded-xl ${driverPhone ? "bg-emerald-500" : "bg-emerald-200"}`}
            activeOpacity={0.8}
            onPress={() => handleCall(driverPhone)}
            disabled={!driverPhone}
          >
            <Text className="text-white font-bold">Call Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center justify-center p-3 rounded-xl ${providerPhone ? "bg-blue-500" : "bg-blue-200"}`}
            activeOpacity={0.8}
            onPress={() => handleCall(providerPhone)}
            disabled={!providerPhone}
          >
            <Text className="text-white font-bold">Call Provider</Text>
          </TouchableOpacity>
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
      className={`justify-center items-center p-4 w-full rounded-2xl shadow-lg ${isBooking ? "bg-gray-100" : "bg-white"}`}
      activeOpacity={0.9}
      onPress={onHelpRequest}
      disabled={isBooking}
    >
      {isBooking ? (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#ef4444" />
          <Text className="text-gray-700 font-semibold ml-2">Requesting ambulance...</Text>
        </View>
      ) : (
        <Text className="text-black font-bold text-xl uppercase">Book</Text>
      )}
    </TouchableOpacity>
  );
}
