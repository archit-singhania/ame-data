import { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

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

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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
      <LinearGradient
            colors={[
                '#000000',   
                '#1f291f',  
                '#3c4d36',   
                '#5c4931',  
                '#2e3d2e',  
                '#0d0d0d'   
            ]}
            style={styles.gradient}
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

const styles = StyleSheet.create({
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
  glowWrapper: {
    width: '100%',
    maxWidth: 600,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 15,
    position: 'relative',
  },
  enhancedCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
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
  roleIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    fontWeight: '600',
    paddingLeft: 6,
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
  container: {
    flex: 1,
  },
  element1: {
    width: 90,
    height: 90,
    top: '15%',
    left: '8%',
  },
  element2: {
    width: 70,
    height: 70,
    top: '8%',
    right: '12%',
  },
  element3: {
    width: 80,
    height: 80,
    bottom: '25%',
    left: '5%',
    opacity: 0.5,
  },
  element4: {
    width: 70,
    height: 70,
    bottom: '20%',
    right: '8%',
    opacity: 0.7,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 700,
    paddingHorizontal: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  scrollContent: {
    paddingBottom: 40,
    width: '100%',
  },
  rolesContainer: {
    width: '100%',
    marginBottom: 30,
    gap: 20,
    alignItems: 'center',
  },
  roleCardContainer: {
    width: '100%',
    maxWidth: 600,
  },
  roleCard: {
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    width: '100%',
    overflow: 'hidden',
  },
  roleIcon: {
    fontSize: 40,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  roleFeatures: {
    alignItems: 'flex-start',
    width: '100%',
  },
  title: {
    fontSize: 36,
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
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0d0d0d',
  },
  topBackButtonContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    left: 10,
    zIndex: 10,
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
});