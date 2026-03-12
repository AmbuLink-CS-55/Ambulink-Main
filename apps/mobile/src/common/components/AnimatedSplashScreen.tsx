import React, { useEffect, useMemo } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
  interpolate,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

// --- Sub-components to keep the main component clean ---

function FloatingOrbs() {
  const orb1Y = useSharedValue(0);
  const orb1X = useSharedValue(0);
  const orb1Scale = useSharedValue(1);

  const orb2Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Scale = useSharedValue(1);

  useEffect(() => {
    // Orb 1 Animation
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-60, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
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

    // Orb 2 Animation
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
      <Animated.View style={[styles.orb1, orb1Style]}>
        <LinearGradient
          colors={["rgba(59, 130, 246, 0.25)", "rgba(59, 130, 246, 0.0)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Animated.View style={[styles.orb2, orb2Style]}>
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

function FloatingParticles() {
  // Generate 12 random particles
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * width,
      size: Math.random() * 6 + 3, // 3px to 9px
      delay: Math.random() * 2000,
      duration: Math.random() * 3000 + 4000, // 4s to 7s
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

function Particle({ left, size, delay, duration }: { left: number; size: number; delay: number; duration: number }) {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Staggered start via setTimeout to keep hooks clean
    const timeout = setTimeout(() => {
      // Fade in slowly, fade out at end
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration * 0.2 }),
          withTiming(0.6, { duration: duration * 0.6 }),
          withTiming(0, { duration: duration * 0.2 })
        ),
        -1,
        false
      );

      // Float upwards infinitely
      translateY.value = withRepeat(
        withSequence(
          withTiming(-height * 0.2, { duration: duration, easing: Easing.linear }),
          withTiming(height, { duration: 0 }) // Instant reset to bottom
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
      style={[
        {
          position: "absolute",
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#60a5fa",
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

function RadarRing({ delay, sizeObj }: { delay: number; sizeObj: number }) {
  const pulseScale = useSharedValue(0.3);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 0 }),
          withTiming(sizeObj, { duration: 4000, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );

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

  return <Animated.View style={[styles.pulseRing, style]} />;
}

function BouncingDots() {
  const dot1Y = useSharedValue(0);
  const dot2Y = useSharedValue(0);
  const dot3Y = useSharedValue(0);

  useEffect(() => {
    const dotAnimConf = { duration: 450, easing: Easing.inOut(Easing.ease) };
    const bounceHeight = -14;

    const createBounceSequence = () =>
      withRepeat(
        withSequence(
          withTiming(bounceHeight, dotAnimConf),
          withTiming(0, dotAnimConf),
          withDelay(900, withTiming(0, { duration: 0 }))
        ),
        -1
      );

    dot1Y.value = createBounceSequence();
    dot2Y.value = withDelay(150, createBounceSequence());
    dot3Y.value = withDelay(300, createBounceSequence());
  }, []);

  return (
    <View style={styles.loadingWrapper}>
      {/* Frosted Glass Pill using BlurView */}
      <BlurView intensity={30} tint="light" style={styles.frostedPill}>
        <View style={styles.loadingDotsContainer}>
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot1Y }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot2Y }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot3Y }] }]} />
        </View>
      </BlurView>
    </View>
  );
}

// --- Main Animated Splash Screen Component ---

export function AnimatedSplashScreen({ onAnimationDone }: { onAnimationDone: () => void }) {
  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(0.2);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);
  const textScale = useSharedValue(0.95);
  
  // Levitation Effect for Logo
  const logoLevitateY = useSharedValue(0);

  useEffect(() => {
    // 1. Initial Logo Pop
    logoScale.value = withSpring(1, { damping: 14, stiffness: 80 }, () => {
      // 2. Text slide up and fade in
      contentOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
      contentTranslateY.value = withSpring(0, { damping: 15 });
      
      // Majestic slow zoom on text
      textScale.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) });

      // Start Logo Levitation
      logoLevitateY.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    });

    // 3. Final exit animation
    opacity.value = withDelay(
      2000, // Reduced to 2 seconds
      withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }, (isFinished) => {
        if (isFinished) {
          runOnJS(onAnimationDone)();
        }
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { translateY: logoLevitateY.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }, { scale: textScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Dynamic Background */}
      <LinearGradient
        colors={["#f0fdfa", "#e0f2fe", "#bfdbfe"]} // Slightly richer medical twilight
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Blobs overlay */}
      <FloatingOrbs />

      {/* Magical Floating Medical Particles */}
      <FloatingParticles />

      <View style={styles.contentContainer}>
        {/* Deep Cascading Radar Pulses */}
        <RadarRing delay={0} sizeObj={2.5} />
        <RadarRing delay={1200} sizeObj={2.5} />
        <RadarRing delay={2400} sizeObj={2.5} />

        <Animated.View style={[styles.logoGlow, logoStyle]} />
        <Animated.Image
          source={require("../../../assets/images/ambulink_splash.png")}
          style={[styles.image, logoStyle]}
          resizeMode="contain"
        />
        
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Animated.Text style={styles.text}>
            AMBULINK
          </Animated.Text>
          <Animated.Text style={styles.subtitle}>
            Emergency Medical Services
          </Animated.Text>
        </Animated.View>
      </View>

      <BouncingDots />
    </Animated.View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 9999,
    elevation: 9999,
    overflow: "hidden",
  },
  orb1: {
    position: "absolute",
    top: -height * 0.15,
    left: -width * 0.4,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: (width * 1.4) / 2,
    overflow: "hidden",
    opacity: 0.8,
  },
  orb2: {
    position: "absolute",
    bottom: -height * 0.1,
    right: -width * 0.4,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    overflow: "hidden",
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  pulseRing: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.4)", // Deeper blue stroke
    backgroundColor: "rgba(59, 130, 246, 0.08)", // Slight fill
  },
  logoGlow: {
    position: "absolute",
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 25,
    zIndex: 5,
  },
  image: {
    width: width * 0.65,
    height: width * 0.65,
    zIndex: 10,
    marginBottom: 0,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 25,
    zIndex: 15,
  },
  text: {
    fontSize: 48, // Slightly bigger
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 2.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2563eb", // Deeper vibrant blue
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 10,
  },
  loadingWrapper: {
    paddingBottom: height * 0.08,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  frostedPill: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    overflow: "hidden", // Required for blur view on iOS to keep rounded edges
    backgroundColor: "rgba(255, 255, 255, 0.3)", // Tint fallback
  },
  loadingDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1d4ed8", // Tailwind Blue 700 (High contrast)
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
});
