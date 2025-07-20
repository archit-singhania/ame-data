import { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

export default function RoleSelection({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const cardAnim1 = useRef(new Animated.Value(0)).current;
  const cardAnim2 = useRef(new Animated.Value(0)).current;
  const cardAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const { width, height } = useWindowDimensions();
  
  const isVerySmallPhone = width < 350;
  const isSmallPhone = width < 380;
  const isPhone = width < 768;
  const isSmallTablet = width >= 768 && width < 900;
  const isTablet = width >= 900 && width < 1024;
  const isLargeTablet = width >= 1024 && width < 1200;
  const isVeryLargeTablet = width >= 1200;
  const isLandscape = width > height;
  
  const estimatedContentHeight = isVerySmallPhone ? 800 : isSmallPhone ? 900 : isPhone ? 1000 : 1100;
  const needsScroll = contentHeight > containerHeight;

  const styles = createStyles(
    isVerySmallPhone,
    isSmallPhone,
    isPhone,
    isSmallTablet,
    isTablet,
    isLargeTablet,
    isVeryLargeTablet,
    isLandscape,
    height,
    width,
    needsScroll
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.timing(cardAnim1, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 300);

    setTimeout(() => {
      Animated.timing(cardAnim2, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 500);

    setTimeout(() => {
      Animated.timing(cardAnim3, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 700);

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacityAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowOpacityAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    particleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 500),
          Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const handleRoleSelect = (role: string) => {
    let screenName = '';
    if (role === 'admin') {
      screenName = 'LoginAdmin';
    } else if (role === 'doctor') {
      screenName = 'LoginDoctor';
    } 

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (screenName) {
        navigation.navigate(screenName);
      }
    });
  };

  const handleCardPressIn = (cardIndex: number) => {
    const cardAnim = cardIndex === 0 ? cardAnim1 : cardIndex === 1 ? cardAnim2 : cardAnim3;
    Animated.spring(cardAnim, {
      toValue: 1.08,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  const handleCardPressOut = (cardIndex: number) => {
    const cardAnim = cardIndex === 0 ? cardAnim1 : cardIndex === 1 ? cardAnim2 : cardAnim3;
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  type RoleCardProps = {
    role: string;
    icon: string;
    title: string;
    features: string[];
    cardIndex: number;
    cardAnim: Animated.Value;
  };

  const RoleCard = ({
    role,
    icon,
    title,
    features,
    cardIndex,
    cardAnim,
  }: RoleCardProps) => (
    <Animated.View
      style={[
        styles.glowWrapper,
        {
          opacity: cardAnim,
          transform: [
            { scale: pulseAnim },
            {
              scale: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: glowOpacityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['transparent', 'rgba(76, 175, 80, 0.08)'],
            }),
            borderRadius: styles.roleCard.borderRadius,
          },
        ]}
      />
      <BlurView intensity={60} tint="dark" style={[styles.roleCard, styles.enhancedCard]}>
        <TouchableOpacity
          style={styles.roleCardTouchable}
          onPress={() => handleRoleSelect(role)}
          onPressIn={() => handleCardPressIn(cardIndex)}
          onPressOut={() => handleCardPressOut(cardIndex)}
          activeOpacity={0.8}
        >
          <View style={styles.roleIconContainer}>
            <Text style={styles.roleIcon}>{icon}</Text>
          </View>
          <Text style={styles.roleTitle}>{title}</Text>
          <View style={styles.roleFeatures}>
            {features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>• {feature}</Text>
            ))}
          </View>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Video
        source={{ uri: 'https://storage.googleapis.com/medtrack-media/ame-bg-vid.mp4' }}
        style={styles.backgroundVideo}
        shouldPlay={true}
        isLooping={true}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
      />

      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.85)',
          'rgba(20, 25, 20, 0.9)',
          'rgba(35, 45, 30, 0.8)',
          'rgba(55, 45, 30, 0.85)',
          'rgba(25, 35, 25, 0.9)',
          'rgba(8, 8, 8, 0.95)'
        ]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                })
              }]
            }
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                })
              }]
            }
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                })
              }]
            }
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element4,
            {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                })
              }]
            }
          ]}
        />

        {particleAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, -100],
                    }),
                  },
                  {
                    translateX: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Math.sin(index) * 50, Math.cos(index) * 50],
                    }),
                  },
                ],
                left: `${15 + (index * 15)}%`,
                top: `${20 + (index * 10)}%`,
              },
            ]}
          />
        ))}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true} 
          bounces={true}
          onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        >
          <View
            style={styles.contentWrapper}
            onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <View style={styles.titleContainer}>
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <MaskedView
                    maskElement={
                      <Text style={[styles.title, styles.titleMask]}>
                        Choose Your Role
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFC107', '#FF9800']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: '100%',
                        height: styles.title.fontSize * 1.3, 
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={[styles.title, { opacity: 0 }]}>
                        Choose Your Role
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                </View>
                <Text style={styles.subtitle}>
                  Select how you'll be using MedTrack
                </Text>
                <View style={styles.titleUnderline} />
              </View>

              <View style={styles.rolesContainer}>
                <RoleCard
                  role="admin"
                  icon="🛡️"
                  title="Administrator"
                  features={[
                    "Manage AME Details and Health Records",
                    "Configure Health Analytics",
                    "Oversee Anthropometric Records",
                    "Reports & Logs"
                  ]}
                  cardIndex={0}
                  cardAnim={cardAnim1}
                />

                <RoleCard
                  role="doctor"
                  icon="👨‍⚕️"
                  title="Doctor"
                  features={[
                    "AME Details",
                    "Personnel Health Records and Analytics",
                    "Personnel Anthropometric Records",
                    "Reports & Logs",
                    "Prescription Handling"
                  ]}
                  cardIndex={1}
                  cardAnim={cardAnim2}
                />
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        <View style={styles.topBackButtonContainer}>
          <IconButton
            icon="arrow-left"
            size={isVerySmallPhone ? 24 : isSmallPhone ? 26 : 28}
            iconColor="white"
            onPress={() => navigation.navigate('Landing')}
            style={styles.topBackButton}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const createStyles = (
  isVerySmallPhone: boolean,
  isSmallPhone: boolean,
  isPhone: boolean,
  isSmallTablet: boolean,
  isTablet: boolean,
  isLargeTablet: boolean,
  isVeryLargeTablet: boolean,
  isLandscape: boolean,
  height: number,
  width: number,
  needsScroll: boolean
) => StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: needsScroll ? 'flex-start' : 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: isVerySmallPhone ? 30 : isSmallPhone ? 40 : 50,
    paddingTop: isVerySmallPhone ? 80 : isSmallPhone ? 90 : 100,
    width: '100%',
    minHeight: height, 
  },
  contentWrapper: {
    alignItems: 'center',
    width: '100%',
    flex: 0, 
    justifyContent: 'flex-start', 
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: isVeryLargeTablet ? 1200 : isLargeTablet ? 1000 : isTablet ? 800 : isSmallTablet ? 700 : '100%',
    paddingHorizontal: isVerySmallPhone ? 16 : isSmallPhone ? 20 : isPhone ? 24 : isSmallTablet ? 32 : isTablet ? 40 : 50,
    paddingVertical: isVerySmallPhone ? 20 : isSmallPhone ? 25 : isPhone ? 30 : 35,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: isVerySmallPhone ? 30 : isSmallPhone ? 35 : isPhone ? 45 : isSmallTablet ? 50 : isTablet ? 55 : 60,
    position: 'relative',
  },
  maskedView: {
    height: isVerySmallPhone ? 40 : isSmallPhone ? 45 : 50,
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  title: {
    fontSize: isVerySmallPhone ? 26 : isSmallPhone ? 30 : isPhone ? 38 : isSmallTablet ? 44 : isTablet ? 50 : isLargeTablet ? 54 : 58,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleMask: {
    backgroundColor: 'transparent',
    color: '#000',
  },
  gradientFill: {
    flex: 1,
    height: '100%',
  },
  subtitle: {
    fontSize: isVerySmallPhone ? 13 : isSmallPhone ? 15 : isPhone ? 18 : isSmallTablet ? 20 : isTablet ? 22 : 24,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
    paddingHorizontal: isVerySmallPhone ? 20 : isSmallPhone ? 15 : 0,
  },
  titleUnderline: {
    width: isVerySmallPhone ? 60 : isSmallPhone ? 70 : 80,
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginTop: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  rolesContainer: {
    width: '100%',
    gap: isVerySmallPhone ? 16 : isSmallPhone ? 20 : isPhone ? 24 : 28,
    alignItems: 'center',
    flexDirection: isVeryLargeTablet ? 'row' : 
                  isLargeTablet ? 'row' : 
                  isTablet && isLandscape ? 'row' : 
                  isSmallTablet && isLandscape ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: isTablet || isLargeTablet || isVeryLargeTablet ? 'space-evenly' : 'center',
    paddingBottom: isVeryLargeTablet || isLargeTablet ? 20 : 0, 
  },
  glowWrapper: {
    width: isVeryLargeTablet ? '30%' : 
           isLargeTablet ? '30%' : 
           isTablet ? '45%' : 
           isSmallTablet ? '45%' : '100%',
    maxWidth: isVerySmallPhone ? 300 : isSmallPhone ? 340 : isPhone ? 380 : isSmallTablet ? 360 : isTablet ? 380 : 400,
    minWidth: isVeryLargeTablet ? 320 : isLargeTablet ? 300 : isTablet ? 260 : isSmallTablet ? 240 : undefined,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
  },
  roleCard: {
    borderRadius: isVerySmallPhone ? 18 : isSmallPhone ? 22 : isPhone ? 28 : isSmallTablet ? 30 : 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  enhancedCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.35)',
    position: 'relative',
  },
  roleCardTouchable: {
    paddingVertical: isVerySmallPhone ? 20 : isSmallPhone ? 24 : isPhone ? 30 : isSmallTablet ? 32 : isTablet ? 34 : 36,
    paddingHorizontal: isVerySmallPhone ? 16 : isSmallPhone ? 20 : isPhone ? 26 : isSmallTablet ? 28 : isTablet ? 30 : 32,
    alignItems: 'center',
    width: '100%',
  },
  roleIconContainer: {
    width: isVerySmallPhone ? 65 : isSmallPhone ? 75 : isPhone ? 90 : isSmallTablet ? 95 : isTablet ? 100 : isLargeTablet ? 105 : 110,
    height: isVerySmallPhone ? 65 : isSmallPhone ? 75 : isPhone ? 90 : isSmallTablet ? 95 : isTablet ? 100 : isLargeTablet ? 105 : 110,
    borderRadius: isVerySmallPhone ? 32.5 : isSmallPhone ? 37.5 : isPhone ? 45 : isSmallTablet ? 47.5 : isTablet ? 50 : isLargeTablet ? 52.5 : 55,
    backgroundColor: 'rgba(76, 175, 80, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isVerySmallPhone ? 12 : isSmallPhone ? 15 : isPhone ? 20 : 24,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  roleIcon: {
    fontSize: isVerySmallPhone ? 30 : isSmallPhone ? 34 : isPhone ? 42 : isSmallTablet ? 44 : isTablet ? 47 : isLargeTablet ? 49 : 52,
  },
  roleTitle: {
    fontSize: isVerySmallPhone ? 20 : isSmallPhone ? 22 : isPhone ? 26 : isSmallTablet ? 28 : isTablet ? 30 : isLargeTablet ? 32 : 34,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: isVerySmallPhone ? 8 : isSmallPhone ? 10 : isPhone ? 14 : 18,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  roleFeatures: {
    alignItems: 'flex-start',
    width: '100%',
  },
  featureItem: {
    fontSize: isVerySmallPhone ? 12 : isSmallPhone ? 13 : isPhone ? 15 : isSmallTablet ? 16 : isTablet ? 17 : isLargeTablet ? 18 : 19,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: isVerySmallPhone ? 4 : isSmallPhone ? 5 : isPhone ? 7 : 9,
    fontWeight: '600',
    paddingLeft: 8,
    textShadowColor: 'rgba(76, 175, 80, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  element1: {
    width: isVerySmallPhone ? 45 : isSmallPhone ? 55 : isPhone ? 85 : isSmallTablet ? 95 : isTablet ? 105 : 115,
    height: isVerySmallPhone ? 45 : isSmallPhone ? 55 : isPhone ? 85 : isSmallTablet ? 95 : isTablet ? 105 : 115,
    top: '15%',
    left: isVerySmallPhone ? '5%' : isSmallPhone ? '8%' : '10%',
  },
  element2: {
    width: isVerySmallPhone ? 40 : isSmallPhone ? 50 : isPhone ? 65 : 85,
    height: isVerySmallPhone ? 40 : isSmallPhone ? 50 : isPhone ? 65 : 85,
    top: '8%',
    right: isVerySmallPhone ? '8%' : isSmallPhone ? '10%' : '12%',
  },
  element3: {
    width: isVerySmallPhone ? 50 : isSmallPhone ? 60 : isPhone ? 75 : 95,
    height: isVerySmallPhone ? 50 : isSmallPhone ? 60 : isPhone ? 75 : 95,
    bottom: '25%',
    left: '5%',
    opacity: 0.5,
  },
  element4: {
    width: isVerySmallPhone ? 45 : isSmallPhone ? 55 : isPhone ? 65 : 85,
    height: isVerySmallPhone ? 45 : isSmallPhone ? 55 : isPhone ? 65 : 85,
    bottom: '20%',
    right: isVerySmallPhone ? '5%' : isSmallPhone ? '8%' : '10%',
    opacity: 0.7,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  topBackButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios'
      ? (height > 800 ? (isVeryLargeTablet ? 80 : 60) : (isVerySmallPhone ? 45 : 55))
      : (StatusBar.currentHeight ? StatusBar.currentHeight + (isVerySmallPhone ? 10 : 15) : (isVerySmallPhone ? 45 : 55)),
    left: isVerySmallPhone ? 5 : isSmallPhone ? 8 : 12,
    zIndex: 10,
  },
  topBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 30,
  },
});