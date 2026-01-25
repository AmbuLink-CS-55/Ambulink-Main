import { View, TouchableOpacity, Text } from "react-native";
import React from "react";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

interface MapOptionsProps {
  ambulanceFound: boolean;
  onHelpRequest: () => void;
  cancelRequest: () => void;
}

export default function MapOptions({ ambulanceFound, onHelpRequest, cancelRequest }: MapOptionsProps) {
  if (ambulanceFound) {
    return (
      <View className="items-center">
        <TouchableOpacity
          className="bg-red-500 justify-center items-center p-4 w-[90%] rounded-2xl shadow-lg"
          activeOpacity={0.8}
          onPress={cancelRequest}
        >
          <Text className="text-white font-bold text-xl uppercase">Cancel Booking</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
      <TouchableOpacity
        className="bg-white justify-center items-center p-4 w-[100%] rounded-2xl shadow-lg"
        activeOpacity={0.9}
        onPress={onHelpRequest}
      >
        <Text className="text-black font-bold text-xl uppercase">Book</Text>
      </TouchableOpacity>
  );
}
