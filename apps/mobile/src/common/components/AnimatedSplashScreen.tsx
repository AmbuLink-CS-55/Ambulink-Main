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

// --- Dynamic Measurements ---
const DYNAMIC = {
  orb1Size: width * 1.4,
  orb2Size: width * 1.2,
  pulseSize: width * 0.6,
  glowSize: width * 0.5,
  logoSize: width * 0.65,
};

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

function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * width,
      size: Math.random() * 6 + 3,
      delay: Math.random() * 2000,
      duration: Math.random() * 3000 + 4000,
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
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration * 0.2 }),
          withTiming(0.6, { duration: duration * 0.6 }),
          withTiming(0, { duration: duration * 0.2 })
        ),
        -1,
        false
      );

      translateY.value = withRepeat(
        withSequence(
          withTiming(-height * 0.2, { duration: duration, easing: Easing.linear }),
          withTiming(height, { duration: 0 })
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
    <View className="items-center justify-center z-20" style={{ paddingBottom: height * 0.08 }}>
      <BlurView intensity={30} tint="light" className="px-10 py-5 rounded-full border-[1.5px] border-white/60 overflow-hidden bg-white/30">
        <View className="flex-row items-center justify-center gap-[14px]">
          <Animated.View 
            className="w-4 h-4 rounded-full bg-blue-700"
            style={[
              { shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 3 },
              { transform: [{ translateY: dot1Y }] }
            ]} 
          />
          <Animated.View 
            className="w-4 h-4 rounded-full bg-blue-700"
            style={[
              { shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 3 },
              { transform: [{ translateY: dot2Y }] }
            ]} 
          />
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

// --- Main Animated Splash Screen Component ---

export function AnimatedSplashScreen({ onAnimationDone }: { onAnimationDone: () => void }) {
  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(0.2);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);
  const textScale = useSharedValue(0.95);
  
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

    // 3. Final exit animation (Reduced to 2 seconds display time)
    opacity.value = withDelay(
      2000,
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
    <Animated.View 
      className="absolute inset-0 items-center justify-between overflow-hidden bg-white z-[9999]" 
      style={[containerStyle, { elevation: 9999 }]} 
      pointerEvents="none"
    >
      <LinearGradient
        colors={["#f0fdfa", "#e0f2fe", "#bfdbfe"]}
        style={StyleSheet.absoluteFillObject}
      />

      <FloatingOrbs />
      <FloatingParticles />

      <View className="flex-1 items-center justify-center w-full">
        <RadarRing delay={0} sizeObj={2.5} />
        <RadarRing delay={1200} sizeObj={2.5} />
        <RadarRing delay={2400} sizeObj={2.5} />

        <Animated.View 
          className="absolute bg-white/90 z-5"
          style={[
            {
              width: DYNAMIC.glowSize,
              height: DYNAMIC.glowSize,
              borderRadius: DYNAMIC.glowSize / 2,
              shadowColor: "#2563eb",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 60,
              elevation: 25,
            },
            logoStyle
          ]} 
        />
        
        <Animated.Image
          source={require("../../../assets/images/ambulink_splash.png")}
          className="z-10"
          style={[
            {
              width: DYNAMIC.logoSize,
              height: DYNAMIC.logoSize,
            },
            logoStyle
          ]}
          resizeMode="contain"
        />
        
        <Animated.View className="items-center mt-[25px] z-15" style={textStyle}>
          <Animated.Text className="text-[48px] font-black tracking-[2.5px] text-slate-900">
            AMBULINK
          </Animated.Text>
          <Animated.Text className="text-[15px] font-extrabold tracking-[3px] text-blue-600 uppercase mt-2.5">
            Emergency Medical Services
          </Animated.Text>
        </Animated.View>
      </View>

      <BouncingDots />
    </Animated.View>
  );
}
