import { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  useWindowDimensions, 
  StatusBar, 
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandingScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const screenSize = Math.min(screenWidth, screenHeight);
  
  const isVerySmallPhone = screenSize < 280;
  const isTinyPhone = screenSize >= 280 && screenSize < 320;
  const isSmallPhone = screenSize >= 320 && screenSize < 375; 
  const isRegularPhone = screenSize >= 375 && screenSize < 414; 
  const isLargePhone = screenSize >= 414 && screenSize < 480;
  const isSmallTablet = screenSize >= 480 && screenSize < 768; 
  const isTablet = screenSize >= 768 && screenSize < 1024; 
  const isLargeTablet = screenSize >= 1024 && screenSize < 1366; 
  const isXLargeTablet = screenSize >= 1366 && screenSize < 1920; 
  const isXXLargeTablet = screenSize >= 1920; 
  
  const isLandscape = screenWidth > screenHeight;
  const aspectRatio = screenWidth / screenHeight;
  const isPhone = screenSize < 768;
  const isAnyTablet = screenSize >= 768;

  const getResponsiveSize = (sizes: {
    verySmall: number;
    tiny: number;
    small: number;
    regular: number;
    large: number;
    smallTablet: number;
    tablet: number;
    largeTablet: number;
    xLargeTablet: number;
    xxLargeTablet: number;
  }) => {
    if (isXXLargeTablet) return sizes.xxLargeTablet;
    if (isXLargeTablet) return sizes.xLargeTablet;
    if (isLargeTablet) return sizes.largeTablet;
    if (isTablet) return sizes.tablet;
    if (isSmallTablet) return sizes.smallTablet;
    if (isLargePhone) return sizes.large;
    if (isRegularPhone) return sizes.regular;
    if (isSmallPhone) return sizes.small;
    if (isTinyPhone) return sizes.tiny;
    return sizes.verySmall;
  };

  const getSimpleResponsiveSize = (small: number, medium: number, large: number, xlarge: number) => {
    if (isXLargeTablet) return xlarge * 1.2;
    if (isLargeTablet) return xlarge;
    if (isTablet) return large;
    if (isSmallTablet) return medium * 1.2;
    if (isLargePhone) return medium;
    if (isRegularPhone) return small * 1.1;
    if (isSmallPhone) return small * 0.9;
    return small * 0.8;
  };

  const getScreenPadding = () => {
    const basePadding = getResponsiveSize({
      verySmall: 8,
      tiny: 12,
      small: 16,
      regular: 20,
      large: 24,
      smallTablet: 30,
      tablet: 40,
      largeTablet: 50,
      xLargeTablet: 60,
      xxLargeTablet: 80,
    });
    
    if (isLandscape && screenSize < 768) {
      return basePadding * 0.6;
    }
    
    return basePadding;
  };

  useEffect(() => {
      const playVideo = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.playAsync();
        } catch (error) {
        }
      }
    };

    const timer = setTimeout(playVideo, 500);
    const animationDelay = screenSize >= 768 ? 300 : screenSize < 320 ? 50 : 100;
    const animationDuration = screenSize >= 1366 ? 1400 : screenSize >= 768 ? 1200 : screenSize < 320 ? 800 : 1000;
    
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: animationDuration * 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: animationDuration * 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    }, animationDelay);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: isAnyTablet ? 1.06 : 1.08,
          duration: isAnyTablet ? 3000 : 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: isAnyTablet ? 3000 : 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: isAnyTablet ? 4500 : 3500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: isAnyTablet ? 4500 : 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isAnyTablet]);

  const handleGetStarted = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('RoleSelection');
    });
  };

  const dynamicStyles = StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      maxWidth: getResponsiveSize({
        verySmall: 280,
        tiny: 320,
        small: 375,
        regular: 414,
        large: 480,
        smallTablet: 600,
        tablet: 750,
        largeTablet: 900,
        xLargeTablet: 1100,
        xxLargeTablet: 1300,
      }),
      paddingHorizontal: getScreenPadding(),
      paddingVertical: getResponsiveSize({
        verySmall: 10,
        tiny: 15,  
        small: 15,
        regular: 20,
        large: 25,
        smallTablet: 30,
        tablet: 40,
        largeTablet: 50,
        xLargeTablet: 60,
        xxLargeTablet: 70,  
      }),
    },
    logoContainer: {
      marginBottom: getResponsiveSize({
        verySmall: 10,
        tiny: 15,
        small: 20,
        regular: 25,
        large: 30,
        smallTablet: 35,
        tablet: 45,
        largeTablet: 55,
        xLargeTablet: 65,
        xxLargeTablet: 80,
      }),
    },
    textContainer: {
      alignItems: 'center',
      marginBottom: getResponsiveSize({
        tiny: 20,
        verySmall: 25,
        small: 30,
        regular: 35,
        large: 40,
        smallTablet: 45,
        tablet: 55,
        largeTablet: 65,
        xLargeTablet: 75,
        xxLargeTablet: 85,
      }),
      paddingHorizontal: isAnyTablet ? 50 : 15,
    },
    logoCircle: {
      backgroundColor: 'rgba(20, 30, 25, 0.6)',  
      width: getResponsiveSize({
        verySmall: 50,
        tiny: 60,
        small: 70,
        regular: 80,
        large: 90,
        smallTablet: 100,
        tablet: 120,
        largeTablet: 140,
        xLargeTablet: 160,
        xxLargeTablet: 180,
      }),
      height: getResponsiveSize({
        verySmall: 60,
        tiny: 70,  
        small: 70,
        regular: 80,
        large: 90,
        smallTablet: 100,
        tablet: 120,
        largeTablet: 140,
        xLargeTablet: 160,
        xxLargeTablet: 180,  
      }),
      borderRadius: getResponsiveSize({
        tiny: 20,
        verySmall: 30,
        small: 35,
        regular: 40,
        large: 45,
        smallTablet: 50,
        tablet: 60,
        largeTablet: 70,
        xLargeTablet: 80,
        xxLargeTablet: 95,
      }),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: getResponsiveSize({
        tiny: 1,
        verySmall: 2,
        small: 2,
        regular: 3,
        large: 3,
        smallTablet: 4,
        tablet: 4,
        largeTablet: 5,
        xLargeTablet: 6,
        xxLargeTablet: 7
      }),
      borderColor: 'rgba(100, 255, 200, 0.3)', 
      shadowColor: 'rgba(100, 255, 200, 0.4)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 15,
      elevation: 12,
    },
    logoImage: {
      width: getResponsiveSize({
        verySmall: 35,
        tiny: 40, 
        small: 40,
        regular: 45,
        large: 50,
        smallTablet: 60,
        tablet: 75,
        largeTablet: 90,
        xLargeTablet: 110,
        xxLargeTablet: 130,  
      }),
      height: getResponsiveSize({
        verySmall: 35,
        tiny: 40,  
        small: 40,
        regular: 45,
        large: 50,
        smallTablet: 60,
        tablet: 75,
        largeTablet: 90,
        xLargeTablet: 110,
        xxLargeTablet: 130, 
      }),
      tintColor: 'rgba(255, 255, 255, 0.9)', 
    },
    title: {
      fontSize: getResponsiveSize({
        verySmall: 16,
        tiny: 20,
        small: 24,
        regular: 28,
        large: 32,
        smallTablet: 36,
        tablet: 42,
        largeTablet: 48,
        xLargeTablet: 56,
        xxLargeTablet: 64,
      }),
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: getResponsiveSize({
        tiny: 6,
        verySmall: 8,
        small: 10,
        regular: 12,
        large: 14,
        smallTablet: 16,
        tablet: 20,
        largeTablet: 24,
        xLargeTablet: 28,
        xxLargeTablet: 30,
      }),
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      lineHeight: getResponsiveSize({
        tiny: 20,
        verySmall: 24,
        small: 28,
        regular: 32,
        large: 36,
        smallTablet: 42,
        tablet: 48,
        largeTablet: 56,
        xLargeTablet: 64,
        xxLargeTablet: 75,
      }),
    },
    description: {
      fontSize: getResponsiveSize({
        tiny: 10,
        verySmall: 14,
        small: 16,
        regular: 18,
        large: 20,
        smallTablet: 22,
        tablet: 24,
        largeTablet: 26,
        xLargeTablet: 28,
        xxLargeTablet: 32,
      }),
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      lineHeight: getResponsiveSize({
        tiny: 16,
        verySmall: 20,
        small: 22,
        regular: 24,
        large: 26,
        smallTablet: 30,
        tablet: 32,
        largeTablet: 36,
        xLargeTablet: 40,
        xxLargeTablet: 50,
      }),
      maxWidth: isAnyTablet ? '85%' : '100%',
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      letterSpacing: 0.5,
    },
    featuresContainer: {
      width: '100%',
      marginBottom: getResponsiveSize({
        verySmall: 30,
        tiny: 35,  
        small: 35,
        regular: 40,
        large: 45,
        smallTablet: 55,
        tablet: 65,
        largeTablet: 75,
        xLargeTablet: 85,
        xxLargeTablet: 95,  
      }),
      paddingHorizontal: getResponsiveSize({
        tiny: 5,
        verySmall: 8,
        small: 12,
        regular: 15,
        large: 18,
        smallTablet: 20,
        tablet: 25,
        largeTablet: 30,
        xLargeTablet: 35,
        xxLargeTablet: 40,
      }),
    },
    featureCard: {
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      borderColor: 'rgba(59, 130, 246, 0.6)', 
      borderRadius: getResponsiveSize({
        tiny: 12,
        verySmall: 16,
        small: 18,
        regular: 20,
        large: 22,
        smallTablet: 24,
        tablet: 26,
        largeTablet: 28,
        xLargeTablet: 30,
        xxLargeTablet: 40,
      }),
      padding: getResponsiveSize({
        tiny: 8,
        verySmall: 12,
        small: 14,
        regular: 16,
        large: 18,
        smallTablet: 20,
        tablet: 22,
        largeTablet: 24,
        xLargeTablet: 26,
        xxLargeTablet: 28,
      }),
      alignItems: 'center',
      marginBottom: getResponsiveSize({
        tiny: 5,
        verySmall: 8,
        small: 10,
        regular: 12,
        large: 14,
        smallTablet: 16,
        tablet: 18,
        largeTablet: 20,
        xLargeTablet: 22,
        xxLargeTablet: 26,
      }),
      borderWidth: 1.5,
      minHeight: getResponsiveSize({
        tiny: 45,
        verySmall: 60,
        small: 70,
        regular: 80,
        large: 90,
        smallTablet: 95,
        tablet: 100,
        largeTablet: 105,
        xLargeTablet: 110,
        xxLargeTablet: 130,
      }),
      justifyContent: 'center',
      shadowColor: 'rgba(59, 130, 246, 0.4)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    featureRow: {
      flexDirection: (isAnyTablet && !isLandscape) || isXLargeTablet ? 'row' : 'column',
      justifyContent: 'space-between',
      marginBottom: getResponsiveSize({
        tiny: 5,
        verySmall: 8,
        small: 10,
        regular: 12,
        large: 15,
        smallTablet: 18,
        tablet: 22,
        largeTablet: 26,
        xLargeTablet: 30,
        xxLargeTablet: 32,
      }),
      gap: getResponsiveSize({
        tiny: 5,
        verySmall: 8,
        small: 10,
        regular: 12,
        large: 15,
        smallTablet: 18,
        tablet: 22,
        largeTablet: 26,
        xLargeTablet: 30,
        xxLargeTablet: 32,
      }),
    },
    featureCardHalf: {
      flex: ((isAnyTablet && !isLandscape) || isXLargeTablet) ? 1 : undefined,
      width: ((isAnyTablet && !isLandscape) || isXLargeTablet) ? undefined : '100%',
      marginBottom: 0,
    },
    featureIcon: {
      fontSize: getResponsiveSize({
        tiny: 12,
        verySmall: 16,
        small: 18,
        regular: 20,
        large: 22,
        smallTablet: 24,
        tablet: 28,
        largeTablet: 32,
        xLargeTablet: 36,
        xxLargeTablet: 40,
      }),
      marginBottom: getResponsiveSize({
        tiny: 2,
        verySmall: 4,
        small: 5,
        regular: 6,
        large: 7,
        smallTablet: 8,
        tablet: 10,
        largeTablet: 12,
        xLargeTablet: 14,
        xxLargeTablet: 18,
      }),
    },
    featureText: {
      fontSize: getResponsiveSize({
        tiny: 8,
        verySmall: 12,
        small: 14,
        regular: 15,
        large: 16,
        smallTablet: 17,
        tablet: 19,
        largeTablet: 21,
        xLargeTablet: 23,
        xxLargeTablet: 28,
      }),
      color: 'rgba(255, 255, 255, 0.95)',
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: getResponsiveSize({
        tiny: 12,
        verySmall: 16,
        small: 18,
        regular: 19,
        large: 20,
        smallTablet: 22,
        tablet: 24,
        largeTablet: 26,
        xLargeTablet: 28,
        xxLargeTablet: 32,
      }),
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
      letterSpacing: 0.3,
    },
    buttonContainer: {
      marginTop: getResponsiveSize({
        verySmall: 15,
        tiny: 20, 
        small: 20,
        regular: 25,
        large: 30,
        smallTablet: 35,
        tablet: 45,
        largeTablet: 55,
        xLargeTablet: 65,
        xxLargeTablet: 75, 
      }),
      width: '100%',
      maxWidth: getResponsiveSize({
        tiny: 200,
        verySmall: 250,
        small: 280,
        regular: 320,
        large: 350,
        smallTablet: 380,
        tablet: 420,
        largeTablet: 460,
        xLargeTablet: 500,
        xxLargeTablet: 600,
      }),
      gap: getResponsiveSize({
        tiny: 6,
        verySmall: 10,
        small: 12,
        regular: 15,
        large: 18,
        smallTablet: 20,
        tablet: 22,
        largeTablet: 24,
        xLargeTablet: 26,
        xxLargeTablet: 28,
      }),
      alignItems: 'center',
    },
    footer: {
      marginTop: getResponsiveSize({
        verySmall: 20,
        tiny: 25,  
        small: 25,
        regular: 30,
        large: 35,
        smallTablet: 45,
        tablet: 55,
        largeTablet: 65,
        xLargeTablet: 75,
        xxLargeTablet: 85, 
      }),
      paddingVertical: getResponsiveSize({
        tiny: 10,
        verySmall: 15,
        small: 18,
        regular: 20,
        large: 25,
        smallTablet: 30,
        tablet: 35,
        largeTablet: 40,
        xLargeTablet: 45,
        xxLargeTablet: 50,
      }),
      paddingHorizontal: getResponsiveSize({
        tiny: 10,
        verySmall: 20,
        small: 25,
        regular: 30,
        large: 35,
        smallTablet: 40,
        tablet: 45,
        largeTablet: 50,
        xLargeTablet: 55,
        xxLargeTablet: 65,
      }),
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.15)',
      width: '100%',
      maxWidth: getResponsiveSize({
        tiny: 250,
        verySmall: 320,
        small: 375,
        regular: 414,
        large: 480,
        smallTablet: 500,
        tablet: 600,
        largeTablet: 700,
        xLargeTablet: 800,
        xxLargeTablet: 900,
      }),
    },
    primaryButton: {
      backgroundColor: 'transparent',
      borderRadius: getResponsiveSize({
        tiny: 20,
        verySmall: 30,
        small: 32,
        regular: 34,
        large: 36,
        smallTablet: 38,
        tablet: 40,
        largeTablet: 42,
        xLargeTablet: 44,
        xxLargeTablet: 50,
      }),
      elevation: 0,
      shadowColor: 'rgba(59, 130, 246, 0.6)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      width: '70%',
      alignSelf: 'center',
      borderWidth: 0, 
      overflow: 'visible',
      position: 'relative',
    },
    buttonContent: {
      minHeight: getResponsiveSize({
        tiny: 40,
        verySmall: 55,
        small: 60,
        regular: 70,
        large: 80,
        smallTablet: 85,
        tablet: 90,
        largeTablet: 95,
        xLargeTablet: 100,
        xxLargeTablet: 120,
      }),
      paddingHorizontal: getResponsiveSize({
        tiny: 20,
        verySmall: 28,
        small: 32,
        regular: 36,
        large: 40,
        smallTablet: 44,
        tablet: 48,
        largeTablet: 52,
        xLargeTablet: 56,
        xxLargeTablet: 62,
      }),
      paddingVertical: getResponsiveSize({
        tiny: 2,
        verySmall: 4,
        small: 4,
        regular: 6,
        large: 8,
        smallTablet: 10,
        tablet: 12,
        largeTablet: 14,
        xLargeTablet: 16,
        xxLargeTablet: 22,
      }),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: getResponsiveSize({
        tiny: 20,
        verySmall: 26,
        small: 28,
        regular: 30,
        large: 32,
        smallTablet: 34,
        tablet: 36,
        largeTablet: 38,
        xLargeTablet: 40,
        xxLargeTablet: 45,
      }),
      backgroundColor: 'transparent',
      overflow: 'visible',
    },
    buttonLabel: {
      fontSize: getResponsiveSize({
        tiny: 10,
        verySmall: 15,
        small: 16,
        regular: 18,
        large: 20,
        smallTablet: 22,
        tablet: 24,
        largeTablet: 26,
        xLargeTablet: 28,
        xxLargeTablet: 32,
      }),
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.98)',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
      letterSpacing: 1.2,
    },
    footerText: {
      fontSize: getResponsiveSize({
        tiny: 6,
        verySmall: 11,
        small: 12,
        regular: 13,
        large: 14,
        smallTablet: 15,
        tablet: 16,
        largeTablet: 17,
        xLargeTablet: 18,
        xxLargeTablet: 25,
      }),
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'center',
      lineHeight: getResponsiveSize({
        tiny: 10,
        verySmall: 15,
        small: 16,
        regular: 17,
        large: 18,
        smallTablet: 20,
        tablet: 22,
        largeTablet: 24,
        xLargeTablet: 26,
        xxLargeTablet: 28,
      }),
      fontStyle: 'italic',
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });

  const renderFloatingElements = () => {
    const elements = [];
    const elementCount = getResponsiveSize({
      verySmall: 2,
      tiny: 3, 
      small: 3,
      regular: 3,
      large: 4,
      smallTablet: 4,
      tablet: 5,
      largeTablet: 6,
      xLargeTablet: 7,
      xxLargeTablet: 8, 
    });
    
    for (let i = 0; i < elementCount; i++) {
      const baseSize = getResponsiveSize({
        verySmall: 40,
        tiny: 50, 
        small: 50,
        regular: 60,
        large: 70,
        smallTablet: 80,
        tablet: 90,
        largeTablet: 100,
        xLargeTablet: 110,
        xxLargeTablet: 120,  
      });
      
      const size = baseSize - (i * 8);
      const opacity = 0.12 - (i * 0.015);
      
      elements.push(
        <Animated.View 
          key={i}
          style={[
            styles.floatingElement,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity,
              top: `${8 + (i * 12)}%`,
              left: i % 2 === 0 ? `${3 + (i * 4)}%` : undefined,
              right: i % 2 === 1 ? `${3 + (i * 4)}%` : undefined,
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (i % 2 === 0 ? -1 : 1) * (12 + i * 4)],
                })
              }]
            }
          ]}
        />
      );
    }
    
    return elements;
  };

  return (
    <LinearGradient
      colors={['#0F1419', '#1B2B36', '#2D4A3A', '#1A2F2A']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
        hidden={isLandscape && isPhone} 
      />

      <Video
        ref={videoRef}
        source={require('../../assets/ame-bg-vid.mp4')}
        style={styles.backgroundVideo}
        shouldPlay={true}
        isLooping={true}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        useNativeControls={false}
        usePoster={false}
        posterSource={undefined}
        onLoad={() => {
          if (videoRef.current) {
            videoRef.current.playAsync();
          }
        }}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && !status.isPlaying) {
            videoRef.current?.playAsync();
          }
        }}
      />

      <View style={styles.overlay} />
      
      {renderFloatingElements()}
      
      <ScrollView 
        contentContainerStyle={[
          styles.scrollWrapper,
          { 
            paddingBottom: getResponsiveSize({
              tiny: 10,
              verySmall: 20,
              small: 25,
              regular: 30,
              large: 35,
              smallTablet: 40,
              tablet: 50,
              largeTablet: 60,
              xLargeTablet: 70,
              xxLargeTablet: 80,
            }),
            paddingTop: getResponsiveSize({
              tiny: 10,
              verySmall: 20,
              small: 25,
              regular: 30,
              large: 35,
              smallTablet: 40,
              tablet: 50,
              largeTablet: 60,
              xLargeTablet: 70,
              xxLargeTablet: 80,
            }),
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={isAnyTablet}
      >
        <Animated.View 
          style={[
            dynamicStyles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Animated.View 
            style={[
              dynamicStyles.logoContainer,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <View style={dynamicStyles.logoCircle}>
              <Image 
                source={require('../../assets/bsf-logo.png')}
                style={dynamicStyles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <View style={dynamicStyles.textContainer}>
            <Text style={dynamicStyles.title}>
              MedTrack Command
            </Text>
            <Text style={dynamicStyles.description}>
              A unified hub for annual medical evaluations and hospital record management — built to track and monitor the performance of every personnel through data-driven healthcare intelligence.
            </Text>
          </View>

          <View style={dynamicStyles.featuresContainer}>
            {((isAnyTablet && !isLandscape) || isXLargeTablet) ? (
              <>
                <View style={dynamicStyles.featureRow}>
                  <Animated.View 
                    style={[
                      dynamicStyles.featureCard,
                      dynamicStyles.featureCardHalf,
                      {
                        transform: [{
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <Text style={dynamicStyles.featureIcon}>📊</Text>
                    <Text style={dynamicStyles.featureText}>Health Analytics</Text>
                  </Animated.View>

                  <Animated.View 
                    style={[
                      dynamicStyles.featureCard,
                      dynamicStyles.featureCardHalf,
                      {
                        transform: [{
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <Text style={dynamicStyles.featureIcon}>🏥</Text>
                    <Text style={dynamicStyles.featureText}>Anthropometric Records</Text>
                  </Animated.View>
                </View>

                <View style={dynamicStyles.featureRow}>
                  <Animated.View 
                    style={[
                      dynamicStyles.featureCard,
                      dynamicStyles.featureCardHalf,
                      {
                        transform: [{
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <Text style={dynamicStyles.featureIcon}>📈</Text>
                    <Text style={dynamicStyles.featureText}>Vitals & Medical History</Text>
                  </Animated.View>

                  <Animated.View 
                    style={[
                      dynamicStyles.featureCard,
                      dynamicStyles.featureCardHalf,
                      {
                        transform: [{
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <Text style={dynamicStyles.featureIcon}>📅</Text>
                    <Text style={dynamicStyles.featureText}>AME Status & Due Dates</Text>
                  </Animated.View>
                </View>
              </>
            ) : (
              <View style={dynamicStyles.featureRow}>
                {[
                  { icon: '📊', text: 'Health Analytics' },
                  { icon: '🏥', text: 'Anthropometric Records' },
                  { icon: '📈', text: 'Vitals & Medical History' },
                  { icon: '📅', text: 'AME Status & Due Dates' },
                ].map((feature, index) => (
                  <Animated.View 
                    key={index}
                    style={[
                      dynamicStyles.featureCard,
                      {
                        transform: [{
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [30, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <Text style={dynamicStyles.featureIcon}>{feature.icon}</Text>
                    <Text style={dynamicStyles.featureText}>{feature.text}</Text>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          <View style={dynamicStyles.buttonContainer}>
            <Animated.View 
              style={[
                dynamicStyles.primaryButton,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(15, 25, 30, 0.95)',  
                  'rgba(30, 45, 50, 0.95)', 
                  'rgba(25, 35, 20, 0.95)'   
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: getResponsiveSize({
                    tiny: 22,
                    verySmall: 28,
                    small: 30,
                    regular: 32,
                    large: 34,
                    smallTablet: 36,
                    tablet: 38,
                    largeTablet: 40,
                    xLargeTablet: 42,
                    xxLargeTablet: 45,
                  }),
                  width: '100%',
                  paddingVertical: getResponsiveSize({
                    tiny: 12,
                    verySmall: 16,
                    small: 18,
                    regular: 20,
                    large: 22,
                    smallTablet: 24,
                    tablet: 26,
                    largeTablet: 28,
                    xLargeTablet: 30,
                    xxLargeTablet: 32,
                  }),
                  paddingHorizontal: getResponsiveSize({
                    tiny: 28,
                    verySmall: 32,
                    small: 36,
                    regular: 40,
                    large: 44,
                    smallTablet: 48,
                    tablet: 52,
                    largeTablet: 56,
                    xLargeTablet: 60,
                    xxLargeTablet: 70,
                  }),
                }}
              >
                <TouchableOpacity
                  onPress={handleGetStarted}
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={dynamicStyles.buttonLabel}>
                    Get Started
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>  
          </View>
          <View style={dynamicStyles.footer}>
            <Text style={dynamicStyles.footerText}>
              Secure • Efficient • Comprehensive
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B3B36', 
    position: 'relative',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 20, 25, 0.65)',
    zIndex: 0,
  },
  scrollWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%', 
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 164, 142, 0.08)', 
    borderRadius: 50,
    zIndex: 0,
  },
});