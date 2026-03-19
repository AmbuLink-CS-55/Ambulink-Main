import React, { useEffect, useMemo } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

// Get device screen dimensions to ensure animations scale correctly on any phone size
const { width, height } = Dimensions.get("window");

// --- Dynamic Measurements ---
// Centralized configuration for all layout sizing so it's easily adjustable and responsive
const DYNAMIC = {
  orb1Size: width * 1.4, // Massive background orbs
  orb2Size: width * 1.2,
  pulseSize: width * 0.6, // Radar rings behind the logo
  glowSize: width * 0.45, // Refined branding badge size
  logoSize: width * 0.35, // Balanced icon size
};

// ==============================================================================
// SUB-COMPONENTS
// Breaking complex animations into separate components keeps the main component clean
// ==============================================================================

/**
 * FloatingOrbs Component
 * Creates large, semi-transparent gradient circles in the background corners 
 * that infinitely drift around to create a dynamic, fluid atmosphere.
 */
function FloatingOrbs() {
  // Shared values are Reanimated's way to drive native UI styles without crossing the React Native bridge
  const orb1Y = useSharedValue(0);
  const orb1X = useSharedValue(0);
  const orb1Scale = useSharedValue(1);

  const orb2Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Scale = useSharedValue(1);

  useEffect(() => {
    // Top-Left Orb Animations
    // withRepeat loops the animation infinitely. withSequence chains animations together (up, then back down).
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-60, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // -1 means loop infinitely
      true // true means animate back to the start smoothly
    );
    orb1X.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Bottom-Right Orb Animations (Different durations create desynchronized, organic movement)
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(60, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 9000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2X.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 10000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // useAnimatedStyle connects our shared values to actual styling properties 
  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: orb1Y.value },
      { translateX: orb1X.value },
      { scale: orb1Scale.value },
    ],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: orb2Y.value },
      { translateX: orb2X.value },
      { scale: orb2Scale.value },
    ],
  }));

  return (
    <>
      {/* Top Left Gradient Orb */}
      <Animated.View
        className="absolute overflow-hidden opacity-80"
        style={[
          {
            top: -height * 0.15,
            left: -width * 0.4,
            width: DYNAMIC.orb1Size,
            height: DYNAMIC.orb1Size,
            borderRadius: DYNAMIC.orb1Size / 2,
          },
          orb1Style,
        ]}
      >
        <LinearGradient
          colors={["rgba(59, 130, 246, 0.25)", "rgba(59, 130, 246, 0.0)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Bottom Right Gradient Orb */}
      <Animated.View
        className="absolute overflow-hidden opacity-80"
        style={[
          {
            bottom: -height * 0.1,
            right: -width * 0.4,
            width: DYNAMIC.orb2Size,
            height: DYNAMIC.orb2Size,
            borderRadius: DYNAMIC.orb2Size / 2,
          },
          orb2Style,
        ]}
      >
        <LinearGradient
          colors={["rgba(14, 165, 233, 0.2)", "rgba(59, 130, 246, 0.0)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </Animated.View>
    </>
  );
}

/**
 * FloatingParticles Component
 * Generates an array of tiny 'medical sparks' that slowly drift upward.
 * We use useMemo to only generate random positions once across renders.
 */
function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * width, // Random horizontal start position
      size: Math.random() * 6 + 3, // Random size between 3 and 9px
      delay: Math.random() * 2000, // Random start delay
      duration: Math.random() * 3000 + 4000, // Random speed
    }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
    </View>
  );
}

// Singular particle implementation logic
function Particle({ left, size, delay, duration }: { left: number; size: number; delay: number; duration: number }) {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // We use setTimeout here so the animations don't all start perfectly in sync
    const timeout = setTimeout(() => {
      // Fade in, hold, fade out
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration * 0.2 }),
          withTiming(0.6, { duration: duration * 0.6 }),
          withTiming(0, { duration: duration * 0.2 })
        ),
        -1,
        false
      );

      // Float upward across the entire screen
      translateY.value = withRepeat(
        withSequence(
          withTiming(-height * 0.2, { duration: duration, easing: Easing.linear }),
          withTiming(height, { duration: 0 }) // Instant reset to bottom when done
        ),
        -1,
        false
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      className="absolute bg-blue-400 rounded-full"
      style={[
        {
          left,
          width: size,
          height: size,
          shadowColor: "#3b82f6",
          shadowOpacity: 0.8,
          shadowRadius: 5,
          elevation: 3,
        },
        style,
      ]}
    />
  );
}

/**
 * RadarRing Component
 * Simulates a 'heartbeat' or 'radar ping' expanding outward from the center logo.
 * Takes a `delay` prop so we can spawn multiple rings perfectly delayed after one another.
 */
function RadarRing({ delay, sizeObj }: { delay: number; sizeObj: number }) {
  const pulseScale = useSharedValue(0.3);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      // Ring expands outward
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 0 }),
          withTiming(sizeObj, { duration: 4000, easing: Easing.out(Easing.ease) }) // Sizeobj defines how large the ring gets
        ),
        -1,
        false
      );

      // Ring fades as it expands
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 0 }),
          withTiming(0, { duration: 4000, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    }, delay);
  }, [delay, sizeObj]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      className="absolute border-2 border-blue-500/40 bg-blue-500/10"
      style={[
        {
          width: DYNAMIC.pulseSize,
          height: DYNAMIC.pulseSize,
          borderRadius: DYNAMIC.pulseSize / 2,
        },
        style
      ]}
    />
  );
}

/**
 * BouncingDots Component
 * Classic 3-dot loading indicator housed inside a premium Frosted Glass container
 */
function BouncingDots() {
  const dot1Y = useSharedValue(0);
  const dot2Y = useSharedValue(0);
  const dot3Y = useSharedValue(0);

  useEffect(() => {
    const dotAnimConf = { duration: 450, easing: Easing.inOut(Easing.ease) };
    const bounceHeight = -14;

    // Helper function so we don't have to write this sequence 3 times
    const createBounceSequence = () =>
      withRepeat(
        withSequence(
          withTiming(bounceHeight, dotAnimConf), // Jump up
          withTiming(0, dotAnimConf), // Fall down
          withDelay(900, withTiming(0, { duration: 0 })) // Hold at bottom before looping
        ),
        -1
      );

    // Stagger the starts of the 3 dots to create a 'wave' motion
    dot1Y.value = createBounceSequence();
    dot2Y.value = withDelay(150, createBounceSequence());
    dot3Y.value = withDelay(300, createBounceSequence());
  }, []);

  return (
    <View className="items-center justify-center z-20" style={{ paddingBottom: height * 0.08 }}>
      {/* BlurView utilizes iOS/Android native blur filters for ultra-premium Glassmorphism UI */}
      <BlurView intensity={30} tint="light" className="px-10 py-5 rounded-full border-[1.5px] border-white/60 overflow-hidden bg-white/30">
        <View className="flex-row items-center justify-center gap-[14px]">
          {/* Dot 1 */}
          <Animated.View
            className="w-4 h-4 rounded-full bg-blue-700"
            style={[
              { shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 3 },
              { transform: [{ translateY: dot1Y }] }
            ]}
          />
          {/* Dot 2 */}
          <Animated.View
            className="w-4 h-4 rounded-full bg-blue-700"
            style={[
              { shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 3 },
              { transform: [{ translateY: dot2Y }] }
            ]}
          />
          {/* Dot 3 */}
          <Animated.View
            className="w-4 h-4 rounded-full bg-blue-700"
            style={[
              { shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 3 },
              { transform: [{ translateY: dot3Y }] }
            ]}
          />
        </View>
      </BlurView>
    </View>
  );
}

// ==============================================================================
// MAIN ROOT COMPONENT
// Maps together all the sub-components and handles the mounting/unmounting sequence.
// ==============================================================================
export function AnimatedSplashScreen({ onAnimationDone }: { onAnimationDone: () => void }) {
  // Screen Level Opacity control
  const opacity = useSharedValue(1);
  // Main Logo Scale (starts at 0.2 zoomed out)
  const logoScale = useSharedValue(0.2);
  // Text visibility controls
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);
  const textScale = useSharedValue(0.95);
  // Levitation physics for the Logo
  const logoLevitateY = useSharedValue(0);

  useEffect(() => {
    /** 
     * MOUNT SEQUENCE:
     * 1. Spring-scale the Ambulink logo onto the screen.
     * 2. Slide-up the text block while fading it in.
     * 3. Begin levitating the logo up and down indefinitely.
     */
    logoScale.value = withSpring(1, { damping: 25, stiffness: 30 });

    // Start text animations with a slight delay so they feel connected to the logo entrance
    contentOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.exp) })
    );
    contentTranslateY.value = withDelay(1000, withSpring(0, { damping: 20, stiffness: 30 }));

    // Majestic slow zoom on text (much calmer, slower drift)
    textScale.value = withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) });

    // Start Logo Levitation (very slow, calm float up and down)
    logoLevitateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    /**
     * UNMOUNT SEQUENCE:
     * After 2.0 full seconds of displaying the splash screen animations, 
     * fade out the entire screen container over 0.8 seconds.
     * Once fully faded (invisible), invoke the `onAnimationDone` callback to tell 
     * the root layout router to destroy this component permanently.
     */
    opacity.value = withDelay(
      3200,
      withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }, (isFinished) => {
        if (isFinished) {
          // runOnJS is absolutely REQUIRED here, because reanimated runs callbacks on the UI Thread
          // but our React State setter inside `onAnimationDone` needs to be triggered on the JS Thread!
          runOnJS(onAnimationDone)();
        }
      })
    );
  }, []);

  // Hook up our ReAnimated SharedValues to standard React Native styling objects
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value }, 
      { translateY: logoLevitateY.value },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }, { scale: textScale.value }],
  }));

  return (
    <Animated.View
      className="absolute inset-0 items-center justify-between overflow-hidden bg-white z-[9999]"
      style={[containerStyle, { elevation: 9999 }]}
      pointerEvents="none" // Ensures this screen never intercepts touches, just visually overlays
    >
      {/* 1. Underlying Base Gradient */}
      <LinearGradient
        colors={["#f0fdfa", "#e0f2fe", "#bfdbfe"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 2. Background Decorators */}
      <FloatingOrbs />
      <FloatingParticles />

      {/* 3. Main Center Branding Focus - nudged down per user request */}
      <View className="flex-1 items-center justify-center w-full mt-[40px]">
        {/* Render 3 Radar Rings with exactly a 1.2s delay between each spawn */}
        <RadarRing delay={0} sizeObj={2.5} />
        <RadarRing delay={1200} sizeObj={2.5} />
        <RadarRing delay={2400} sizeObj={2.5} />

        {/* The new creative glowing Ambulink logo asset */}
        <Animated.Image
          source={require("../../../assets/images/ambulink_splash.png")}
          className="z-10 absolute"
          style={[
            {
              width: DYNAMIC.glowSize,
              height: DYNAMIC.glowSize,
            },
            logoStyle
          ]}
          resizeMode="contain"
        />

        {/* Typographies - Absolute positioning at bottom ensures visibility on all screen sizes */}
        <Animated.View 
          className="absolute items-center z-20" 
          style={[
            textStyle,
            { bottom: height * 0.22 }
          ]}
        >
          <View className="flex-row items-center">
            <Animated.Text className="text-[48px] font-black tracking-[1.5px] text-[#1e3a8a]">
              AMBU
            </Animated.Text>
            <Animated.Text className="text-[48px] font-black tracking-[1.5px] text-[#ef4444]">
              LINK
            </Animated.Text>
          </View>
          <Animated.Text className="text-[15px] font-extrabold tracking-[3px] text-blue-600 uppercase mt-2.5">
            FAST • SECURE • CARE
          </Animated.Text>
        </Animated.View>
      </View>

      {/* 4. Loader */}
      <BouncingDots />
    </Animated.View>
  );
}
