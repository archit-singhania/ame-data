import { useEffect, useRef } from 'react';
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

  const { width, height } = useWindowDimensions();
  const isVerySmallPhone = width < 350;  
  const isSmallPhone = width < 380;      
  const isPhone = width < 768;        
  const isSmallTablet = width >= 768 && width < 900;  
  const isTablet = width >= 900 && width < 1024;    
  const isLargeTablet = width >= 1024 && width < 1200; 
  const isVeryLargeTablet = width >= 1200;            
  const isLandscape = width > height;
  const screenDiagonal = Math.sqrt(width * width + height * height);

  const styles = createStyles(
    isVerySmallPhone, 
    isSmallPhone, 
    isPhone, 
    isSmallTablet, 
    isTablet, 
    isLargeTablet, 
    isVeryLargeTablet, 
    isLandscape, 
    height
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
    } else if (role === 'personnel') {
      screenName = 'LoginPersonnel';
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
      toValue: 1.05,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const handleCardPressOut = (cardIndex: number) => {
    const cardAnim = cardIndex === 0 ? cardAnim1 : cardIndex === 1 ? cardAnim2 : cardAnim3;
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Video
        source={require('../../assets/ame-bg-vid.mp4')}
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
          <View style={{ alignItems: 'center', width: '100%' }}>
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
              <MaskedView
                style={styles.maskedView}
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
                  style={styles.gradientFill}
                />
              </MaskedView>

              <Text style={styles.subtitle}>
                Select how you'll be using MedTrack 
              </Text>

              <View style={styles.titleUnderline} />
            </View>
            <View
              style={[
                styles.rolesContainer,
                { flexDirection: isTablet ? 'row' : 'column', flexWrap: 'wrap' },
              ]}
            >
              <Animated.View
                style={[
                  styles.glowWrapper,
                  {
                    opacity: cardAnim1,
                    transform: [
                      { scale: pulseAnim },
                      {
                        scale: cardAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                      {
                        translateX: cardAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 0],
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
                        outputRange: ['transparent', 'rgba(76, 175, 80, 0.1)'],
                      }),
                      borderRadius: 28,
                    },
                  ]}
                />
                <BlurView intensity={60} tint="dark" style={[styles.roleCard, styles.enhancedCard]}>
                  <TouchableOpacity
                    style={styles.roleCard}
                    onPress={() => handleRoleSelect('admin')}
                    onPressIn={() => handleCardPressIn(0)} 
                    onPressOut={() => handleCardPressOut(0)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleIconContainer}>
                      <Text style={styles.roleIcon}>🛡️</Text>
                    </View>
                    <Text style={styles.roleTitle}>Admin</Text>
                    <View style={styles.roleFeatures}>
                      <Text style={styles.featureItem}>• Administer AME Details</Text>
                      <Text style={styles.featureItem}>• Manage Health Records</Text>
                      <Text style={styles.featureItem}>• Configure Health Analytics</Text>
                      <Text style={styles.featureItem}>• Oversee Anthropometric Records</Text>
                      <Text style={styles.featureItem}>• Reports & Logs</Text>
                    </View>
                  </TouchableOpacity>
                </BlurView>
              </Animated.View>
              <Animated.View
                style={[
                  styles.glowWrapper,
                  {
                    opacity: cardAnim2,
                    transform: [
                      { scale: pulseAnim },
                      {
                        scale: cardAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                      {
                        translateX: cardAnim2.interpolate({
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
                        outputRange: ['transparent', 'rgba(76, 175, 80, 0.1)'],
                      }),
                      borderRadius: 28,
                    },
                  ]}
                />
                <BlurView intensity={60} tint="dark" style={[styles.roleCard, styles.enhancedCard]}>
                  <TouchableOpacity
                    style={styles.roleCard}
                    onPress={() => handleRoleSelect('doctor')}
                    onPressIn={() => handleCardPressIn(1)}
                    onPressOut={() => handleCardPressOut(1)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleIconContainer}>
                      <Text style={styles.roleIcon}>👨‍⚕️</Text>
                    </View>
                    <Text style={styles.roleTitle}>Doctor</Text>
                    <View style={styles.roleFeatures}>
                      <Text style={styles.featureItem}>• AME Details</Text>
                      <Text style={styles.featureItem}>• Personnel Health Records</Text>
                      <Text style={styles.featureItem}>• Personnel Health Analytics</Text>
                      <Text style={styles.featureItem}>• Personnel Anthropometric Records</Text>
                      <Text style={styles.featureItem}>• Reports & Logs</Text>
                    </View>
                  </TouchableOpacity>
                </BlurView>
              </Animated.View>
              <Animated.View
                style={[
                  styles.glowWrapper,
                  {
                    opacity: cardAnim3,
                    transform: [
                      { scale: pulseAnim },
                      {
                        scale: cardAnim3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                      {
                        translateY: cardAnim3.interpolate({
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
                        outputRange: ['transparent', 'rgba(76, 175, 80, 0.1)'],
                      }),
                      borderRadius: 28,
                    },
                  ]}
                />
                <BlurView intensity={60} tint="dark" style={[styles.roleCard, styles.enhancedCard]}>
                  <TouchableOpacity
                    style={styles.roleCard}
                    onPress={() => handleRoleSelect('personnel')} 
                    onPressIn={() => handleCardPressIn(2)}
                    onPressOut={() => handleCardPressOut(2)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleIconContainer}>
                      <Text style={styles.roleIcon}>👤</Text>
                    </View>
                    <Text style={styles.roleTitle}>Personnel</Text>
                    <View style={styles.roleFeatures}>
                      <Text style={styles.featureItem}>• Personal Details</Text>
                      <Text style={styles.featureItem}>• AME Status</Text>
                      <Text style={styles.featureItem}>• Medical Records</Text>
                      <Text style={styles.featureItem}>• Health Analytics</Text>
                      <Text style={styles.featureItem}>• Anthropometric Records</Text>
                    </View>
                  </TouchableOpacity>
                </BlurView>
              </Animated.View>
            </View>

            <View style={styles.topBackButtonContainer}>
              <IconButton
                icon="arrow-left"
                size={28}
                iconColor="white"
                onPress={() => navigation.navigate('Landing')}
                style={styles.topBackButton}
              />
            </View>
            </Animated.View>
          </View>
        </ScrollView>
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
    height: number
  ) => StyleSheet.create({
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      maxWidth: isVeryLargeTablet ? 1200 : isLargeTablet ? 1000 : isTablet ? 800 : isSmallTablet ? 700 : '100%',
      paddingHorizontal: isVerySmallPhone ? 12 : isSmallPhone ? 16 : isPhone ? 20 : isSmallTablet ? 30 : isTablet ? 40 : 50,
      paddingVertical: isVerySmallPhone ? 15 : isSmallPhone ? 20 : isPhone ? 25 : 30,
    },
    title: {
      fontSize: isVerySmallPhone ? 24 : isSmallPhone ? 28 : isPhone ? 36 : isSmallTablet ? 42 : isTablet ? 48 : isLargeTablet ? 52 : 56,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.4)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    subtitle: {
      fontSize: isVerySmallPhone ? 12 : isSmallPhone ? 14 : isPhone ? 17 : isSmallTablet ? 19 : isTablet ? 21 : 23,
      color: 'rgba(255, 255, 255, 0.85)',
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 0.5,
      marginTop: 4,
      paddingHorizontal: isVerySmallPhone ? 15 : isSmallPhone ? 10 : 0,
    },
    titleContainer: {
      alignItems: 'center',
      marginBottom: isVerySmallPhone ? 25 : isSmallPhone ? 30 : isPhone ? 40 : isSmallTablet ? 45 : isTablet ? 50 : 60,
      position: 'relative',
    },
    rolesContainer: {
      width: '100%',
      marginBottom: 30,
      gap: isVerySmallPhone ? 12 : isSmallPhone ? 15 : isPhone ? 20 : 25,
      alignItems: 'center',
      flexDirection: isVeryLargeTablet ? 'row' : isLargeTablet ? 'row' : isTablet && isLandscape ? 'row' : isSmallTablet && isLandscape ? 'row' : 'column',
      flexWrap: isSmallTablet ? 'wrap' : 'nowrap',
      justifyContent: isTablet || isLargeTablet || isVeryLargeTablet ? 'space-evenly' : 'center',
    },
    roleCard: {
      borderRadius: isVerySmallPhone ? 16 : isSmallPhone ? 20 : isPhone ? 28 : isSmallTablet ? 30 : 32,
      paddingVertical: isVerySmallPhone ? 16 : isSmallPhone ? 20 : isPhone ? 28 : isSmallTablet ? 30 : isTablet ? 32 : 36,
      paddingHorizontal: isVerySmallPhone ? 14 : isSmallPhone ? 16 : isPhone ? 24 : isSmallTablet ? 26 : isTablet ? 28 : 32,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 10,
      width: isVeryLargeTablet ? '30%' : isLargeTablet ? '30%' : isTablet ? '45%' : isSmallTablet ? '45%' : '100%',
      minWidth: isVeryLargeTablet ? 350 : isLargeTablet ? 320 : isTablet ? 280 : isSmallTablet ? 260 : '100%',
      maxWidth: isVerySmallPhone ? 320 : isSmallPhone ? 360 : isPhone ? 400 : isSmallTablet ? 380 : isTablet ? 400 : 420,
      overflow: 'hidden',
    },
    roleIconContainer: {
      width: isVerySmallPhone ? 60 : isSmallPhone ? 70 : isPhone ? 90 : isSmallTablet ? 95 : isTablet ? 100 : isLargeTablet ? 105 : 110,
      height: isVerySmallPhone ? 60 : isSmallPhone ? 70 : isPhone ? 90 : isSmallTablet ? 95 : isTablet ? 100 : isLargeTablet ? 105 : 110,
      borderRadius: isVerySmallPhone ? 30 : isSmallPhone ? 35 : isPhone ? 45 : isSmallTablet ? 47.5 : isTablet ? 50 : isLargeTablet ? 52.5 : 55,
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isVerySmallPhone ? 10 : isSmallPhone ? 12 : isPhone ? 18 : 22,
      borderWidth: 2,
      borderColor: 'rgba(76, 175, 80, 0.5)',
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 8,
    },
    roleIcon: {
      fontSize: isVerySmallPhone ? 28 : isSmallPhone ? 32 : isPhone ? 40 : isSmallTablet ? 42 : isTablet ? 45 : isLargeTablet ? 47 : 50,
    },
    roleTitle: {
      fontSize: isVerySmallPhone ? 18 : isSmallPhone ? 20 : isPhone ? 24 : isSmallTablet ? 26 : isTablet ? 28 : isLargeTablet ? 30 : 32,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: isVerySmallPhone ? 6 : isSmallPhone ? 8 : isPhone ? 12 : 16,
      textShadowColor: 'rgba(0,0,0,0.4)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    },
    featureItem: {
      fontSize: isVerySmallPhone ? 11 : isSmallPhone ? 12 : isPhone ? 14 : isSmallTablet ? 15 : isTablet ? 16 : isLargeTablet ? 17 : 18,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: isVerySmallPhone ? 3 : isSmallPhone ? 4 : isPhone ? 6 : 8,
      fontWeight: '600',
      paddingLeft: 6,
      textShadowColor: 'rgba(76, 175, 80, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    glowWrapper: {
      width: isVeryLargeTablet ? '30%' : isLargeTablet ? '30%' : isTablet ? '45%' : isSmallTablet ? '45%' : '100%',
      maxWidth: isVerySmallPhone ? 320 : isSmallPhone ? 360 : isPhone ? 400 : isSmallTablet ? 380 : isTablet ? 400 : 420,
      minWidth: isVeryLargeTablet ? 350 : isLargeTablet ? 320 : isTablet ? 280 : isSmallTablet ? 260 : undefined,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      elevation: 15,
      position: 'relative',
    },
    scrollContent: {
      paddingBottom: isVerySmallPhone ? 25 : isSmallPhone ? 30 : 40,
      width: '100%',
      minHeight: height,
      paddingTop: isVerySmallPhone ? 10 : isSmallPhone ? 15 : 20,
    },
    gradientOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: isVerySmallPhone ? 8 : isSmallPhone ? 10 : isPhone ? 20 : 30,
      backgroundColor: 'transparent',
    },
    element1: {
      width: isVerySmallPhone ? 50 : isSmallPhone ? 60 : isPhone ? 90 : isSmallTablet ? 100 : isTablet ? 110 : 120,
      height: isVerySmallPhone ? 50 : isSmallPhone ? 60 : isPhone ? 90 : isSmallTablet ? 100 : isTablet ? 110 : 120,
      top: '15%',
      left: isVerySmallPhone ? '3%' : isSmallPhone ? '5%' : '8%',
    },
    element2: {
      width: isSmallPhone ? 50 : isPhone ? 70 : 90,
      height: isSmallPhone ? 50 : isPhone ? 70 : 90,
      top: '8%',
      right: isSmallPhone ? '8%' : '12%',
    },
    element3: {
      width: isSmallPhone ? 55 : isPhone ? 80 : 100,
      height: isSmallPhone ? 55 : isPhone ? 80 : 100,
      bottom: '25%',
      left: '5%',
      opacity: 0.5,
    },
    element4: {
      width: isSmallPhone ? 50 : isPhone ? 70 : 90,
      height: isSmallPhone ? 50 : isPhone ? 70 : 90,
      bottom: '20%',
      right: isSmallPhone ? '5%' : '8%',
      opacity: 0.7,
    },
    maskedView: {
      height: 50, 
      flexDirection: 'row',
    },
    gradientFill: {
      flex: 1,
      height: '100%',
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
    enhancedCard: {
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderWidth: 2,
      borderColor: 'rgba(76, 175, 80, 0.3)',
      position: 'relative',
      overflow: 'hidden',
    },
    gradientTitle: {
      color: '#4CAF50', 
      textShadowColor: 'rgba(76, 175, 80, 0.5)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    titleUnderline: {
      width: 80,
      height: 3,
      backgroundColor: '#4CAF50',
      borderRadius: 2,
      marginTop: 8,
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
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
    container: {
      flex: 1,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    roleCardContainer: {
      width: '100%',
      maxWidth: 600,
    },
    roleFeatures: {
      alignItems: 'flex-start',
      width: '100%',
    },
    titleMask: {
      backgroundColor: 'transparent',
      color: '#000', 
    },
    topBackButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 30,
    },
    buttonContent: {
      height: 45,
    },
    buttonLabel: {
      fontSize: 16,
      fontWeight: 'bold',
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
    topBackButtonContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' 
        ? (height > 800 ? (isVeryLargeTablet ? 80 : 60) : (isVerySmallPhone ? 40 : 50))
        : (StatusBar.currentHeight ? StatusBar.currentHeight + (isVerySmallPhone ? 5 : 10) : (isVerySmallPhone ? 40 : 50)),
      left: isVerySmallPhone ? 3 : isSmallPhone ? 5 : 10,
      zIndex: 10,
    },
});