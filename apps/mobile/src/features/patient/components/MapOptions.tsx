import { View, Text, Alert, Linking } from "react-native";
import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { BookingStatus, User, Hospital } from "@ambulink/types";
import { AppCard } from "@/common/components/ui/AppCard";
import { AppButton } from "@/common/components/ui/AppButton";
import { StatusPill } from "@/common/components/ui/StatusPill";

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
  onOpenUploads?: () => void;
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
  onOpenUploads,
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
      <AppCard accessibilityRole="summary" className="w-full items-center" variant="sheet">
        <Ionicons name="checkmark-circle" size={42} color="#16a34a" />
        <Text className="text-success font-bold text-xl mt-2">Trip Completed</Text>
        <Text className="text-muted-foreground mt-1">
          {booking?.hospital?.name
            ? `You have arrived at ${booking.hospital.name}`
            : "You have arrived at your destination"}
        </Text>
      </AppCard>
    );
  }

  if (status === "ARRIVED" && booking) {
    return (
      <AppCard accessibilityRole="summary" className="w-full" variant="sheet">
        <View className="items-start gap-2 mb-2">
          <StatusPill label="Arrived" tone="warning" />
          <Text className="text-foreground font-bold text-lg">Ambulance has arrived</Text>
        </View>
        <View className="border-t border-border pt-3 gap-2">
          <View>
            <Text className="text-muted-foreground text-sm">Provider</Text>
            <Text className="font-semibold text-foreground">{booking.provider?.name ?? "Provider"}</Text>
          </View>
          <View>
            <Text className="text-muted-foreground text-sm">Destination</Text>
            <Text className="font-semibold text-foreground">{booking.hospital.name}</Text>
          </View>
        </View>
        {onOpenUploads ? (
          <AppButton
            accessibilityLabel="Open booking chat"
            variant="secondary"
            className="mt-4"
            label="Open Chat"
            onPress={onOpenUploads}
          />
        ) : null}
      </AppCard>
    );
  }

  if (status === "ASSIGNED" && booking) {
    const driverPhone = booking.pickedDriver.phoneNumber;
    const providerPhone = booking.provider?.hotlineNumber;
    const providerName = booking.provider?.name ?? "Provider";
    return (
      <AppCard className="w-full" variant="sheet">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 gap-1">
            <StatusPill label="Assigned" tone="success" />
            <Text className="text-foreground font-bold text-lg">Driver is on the way</Text>
            <Text className="text-muted-foreground text-sm">Provider: {providerName}</Text>
          </View>
        </View>

        <View className="mt-3 border-t border-border pt-3 gap-2">
          <View>
            <Text className="text-muted-foreground text-sm">Destination Hospital</Text>
            <Text className="font-semibold text-foreground">{booking.hospital.name}</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mt-4">
          <AppButton
            accessibilityLabel="Call assigned driver"
            accessibilityHint="Calls the assigned driver for this booking."
            className="flex-1"
            variant="success"
            label="Call Driver"
            onPress={() => handleCall(driverPhone)}
            disabled={!driverPhone}
          />
          <AppButton
            accessibilityLabel="Call provider hotline"
            accessibilityHint="Calls the ambulance provider emergency hotline."
            className="flex-1"
            variant="secondary"
            label="Call Provider"
            onPress={() => handleCall(providerPhone)}
            disabled={!providerPhone}
          />
        </View>

        <AppButton
          accessibilityLabel="Cancel booking"
          accessibilityHint="Cancels the currently assigned booking."
          className="mt-3"
          variant="danger"
          label={isCancelling ? "Cancelling..." : "Cancel Booking"}
          onPress={cancelRequest}
          disabled={isCancelling}
        />

        {onOpenUploads ? (
          <AppButton
            accessibilityLabel="Open booking chat"
            variant="ghost"
            className="mt-3"
            label="Open Chat"
            onPress={onOpenUploads}
          />
        ) : null}
      </AppCard>
    );
  }

  // idle state
  return (
    <View className="w-full gap-4 items-center">
      <AppButton
        accessibilityLabel="Request ambulance"
        accessibilityHint="Sends a new emergency pickup request."
        className="w-full h-16 rounded-2xl shadow-md"
        textClassName="text-lg"
        variant="primary"
        label={isBooking ? "Requesting..." : "Request Ambulance"}
        onPress={onHelpRequest}
        loading={isBooking}
        renderIcon={() => <MaterialCommunityIcons name="ambulance" size={24} color="white" />}
      />

      {isBooking && (
        <AppButton
          accessibilityLabel="Cancel search"
          variant="danger"
          className="w-full"
          label={isCancelling ? "Cancelling..." : "Cancel Search"}
          onPress={cancelRequest}
          disabled={isCancelling}
        />
      )}

      {isBooking && onOpenUploads ? (
        <AppButton
          accessibilityLabel="Open booking chat"
          variant="ghost"
          label="Open Chat"
          onPress={onOpenUploads}
        />
      ) : null}
    </View>
  );
}
