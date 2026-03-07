import { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocation } from "@/common/hooks/useLocation";
import { UserMap } from "@/features/patient/components";
import { BookingPickerList, EmtBottomActions, EmtSearchBar } from "@/features/emt/components";
import { useEmtBookingState } from "@/features/emt/hooks/useEmtBookingState";

export default function EmtMapScreen() {
  const router = useRouter();
  const { location, loading, error } = useLocation();

  const activeBooking = useEmtBookingState((state) => state.activeBooking);
  const bookingStatus = useEmtBookingState((state) => state.bookingStatus);
  const searchTerm = useEmtBookingState((state) => state.searchTerm);
  const bookingOptions = useEmtBookingState((state) => state.bookingOptions);
  const isLoadingOptions = useEmtBookingState((state) => state.isLoadingOptions);
  const isRefreshingOptions = useEmtBookingState((state) => state.isRefreshingOptions);
  const isSubscribing = useEmtBookingState((state) => state.isSubscribing);
  const errorMessage = useEmtBookingState((state) => state.errorMessage);
  const setSearchTerm = useEmtBookingState((state) => state.setSearchTerm);
  const clearTransientErrors = useEmtBookingState((state) => state.clearTransientErrors);
  const loadOptions = useEmtBookingState((state) => state.loadOptions);
  const hydrateCurrentBooking = useEmtBookingState((state) => state.hydrateCurrentBooking);
  const selectAndSubscribe = useEmtBookingState((state) => state.selectAndSubscribe);

  const [isPickerVisible, setPickerVisible] = useState(false);
  const shouldShowPicker = isPickerVisible || (!activeBooking?.bookingId && searchTerm.length > 0);

  useEffect(() => {
    loadOptions();
    hydrateCurrentBooking();
  }, [hydrateCurrentBooking, loadOptions]);

  useEffect(() => {
    if (!errorMessage) return;
    Alert.alert("EMT", errorMessage, [{ text: "OK", onPress: clearTransientErrors }]);
  }, [clearTransientErrors, errorMessage]);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return bookingOptions;
    return bookingOptions.filter(
      (option) =>
        option.bookingId.toLowerCase().includes(query) ||
        option.shortId.toLowerCase().includes(query) ||
        option.status.toLowerCase().includes(query)
    );
  }, [bookingOptions, searchTerm]);

  const handleSelectBooking = async (bookingId: string) => {
    const didSubscribe = await selectAndSubscribe(bookingId);
    if (!didSubscribe) return;

    setSearchTerm(bookingId.slice(0, 8));
    setPickerVisible(false);
  };

  if (loading && !location) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="mt-3 text-muted-foreground">Getting EMT location...</Text>
      </SafeAreaView>
    );
  }

  if (error || !location) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6">
        <Text className="text-red-500 font-semibold">Location Unavailable</Text>
        <Text className="mt-2 text-center text-muted-foreground">
          {error ?? "Could not resolve location."}
        </Text>
      </SafeAreaView>
    );
  }

  const userLocation = activeBooking?.patient.location ?? location;
  const driverLocations = activeBooking?.driver.location ? [activeBooking.driver.location] : [];
  const hospitalLocation = activeBooking?.hospital.location ?? undefined;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <UserMap
        userLocation={userLocation}
        driverLocations={driverLocations}
        hospitalLocation={hospitalLocation}
        bookingStatus={bookingStatus}
        topOverlay={
          <SafeAreaView edges={["top", "left", "right"]} className="px-1.5 pt-2">
            <EmtSearchBar
              value={searchTerm}
              onFocus={() => setPickerVisible(true)}
              onBlur={() => {
                if (!searchTerm.trim()) {
                  setPickerVisible(false);
                }
              }}
              onChangeText={(value) => {
                setSearchTerm(value);
                setPickerVisible(true);
              }}
              onClear={() => {
                setSearchTerm("");
                setPickerVisible(false);
              }}
            />

            {shouldShowPicker && (
              <BookingPickerList
                data={filteredOptions}
                onSelect={handleSelectBooking}
                refreshing={isRefreshingOptions}
                onRefresh={() => loadOptions({ refresh: true })}
                isSubscribing={isSubscribing || isLoadingOptions}
              />
            )}
          </SafeAreaView>
        }
      >
        {activeBooking?.bookingId ? (
          <View style={{ marginHorizontal: -12 }}>
            <EmtBottomActions
              bookingId={activeBooking.bookingId}
              status={bookingStatus}
              onViewPatientInfo={() => router.push("../patient-info")}
              onOpenNotes={() => router.push("../notes")}
            />
          </View>
        ) : (
          <View className="bg-card p-4 w-full rounded-2xl border border-border">
            <Text className="text-sm text-muted-foreground">No booking selected</Text>
            <Text className="text-base text-foreground mt-1">
              Search and select an active booking ID to subscribe.
            </Text>
          </View>
        )}
      </UserMap>
    </SafeAreaView>
  );
}
