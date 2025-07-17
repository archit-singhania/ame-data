import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, Dimensions, StatusBar, Platform, ScrollView, KeyboardAvoidingView, BackHandler, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { initDatabase, loginUser, UserRole } from '../utils/sqlite';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isLargeTablet = width >= 1024;
const isSmallScreen = width < 375;

const responsive = {
  getSize: (size: number): number => {
    if (isLargeTablet) return size * 1.4;
    if (isTablet) return size * 1.2;
    if (isSmallScreen) return size * 0.9;
    return size;
  },
  getFontSize: (size: number): number => {
    if (isLargeTablet) return size * 1.3;
    if (isTablet) return size * 1.15;
    if (isSmallScreen) return size * 0.9;
    return size;
  },
  getSpacing: (spacing: number): number => {
    if (isLargeTablet) return spacing * 1.5;
    if (isTablet) return spacing * 1.2;
    if (isSmallScreen) return spacing * 0.8;
    return spacing;
  },
  getCardWidth: (): number => {
    if (isLargeTablet) return Math.min(width * 0.6, 600);
    if (isTablet) return Math.min(width * 0.7, 500);
    return Math.min(width * 0.90, 420);
  },
  getIconSize: (size: number): number => {
    if (isLargeTablet) return size * 1.4;
    if (isTablet) return size * 1.2;
    return size;
  },
};

type LoginDoctorProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DashboardDoctor'>;
};

export default function LoginDoctor({ navigation }: LoginDoctorProps) {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const particleAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    try {
      initDatabase();
    } catch (error) {
      console.error('Database initialization error:', error);
      Alert.alert('System Error', 'Failed to initialize database');
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!loading) {
        navigation.navigate('RoleSelection');
        return true;
      }
      return false;
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    particleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + (index * 500),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + (index * 500),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => backHandler.remove();
  }, []);

  const handleLogin = async () => {
    if (!identity || !password) {
      Alert.alert('Incomplete Information', 'Please enter both identity and password to continue');
      return;
    }

    setLoading(true);
    
    try {
      const user = loginUser(identity, password, UserRole.DOCTOR);
      
      if (user) {
        Alert.alert('Welcome Back!', `Hello Dr. ${user.full_name}, access granted`);
        navigation.navigate('DashboardDoctor');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Login Error:', err.message);
      
      if (err.message.includes('Invalid doctor IRLA number format')) {
        Alert.alert('Invalid Format', 'Please enter a valid doctor IRLA number format (e.g., AB1234)');
      } else if (err.message.includes('Invalid credentials')) {
        Alert.alert('Authentication Failed', 'Invalid credentials provided');
      } else {
        Alert.alert('System Error', 'Unable to process login request');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderParticle = (index: number) => {
    const particleSize = responsive.getSize(60 + (index * 10));
    const positions = [
      { top: 0.15 * height, left: 0.08 * width, size: particleSize * 2 },
      { top: 0.25 * height, right: 0.12 * width, size: particleSize * 1.3 },
      { bottom: 0.20 * height, left: 0.05 * width, size: particleSize * 1.7 },
      { top: 0.45 * height, right: 0.08 * width, size: particleSize },
      { bottom: 0.30 * height, right: 0.20 * width, size: particleSize * 1.5 },
      { top: 0.60 * height, left: 0.15 * width, size: particleSize * 1.2 },
    ];

    const pos = positions[index];
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          pos,
          {
            width: pos.size,
            height: pos.size,
            opacity: particleAnims[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.1, 0.3, 0.1],
            }),
            transform: [
              {
                translateY: particleAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30 - (index * 5)],
                })
              },
              {
                scale: particleAnims[index].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 1.2, 0.8],
                })
              }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.6)', 'rgba(30, 58, 138, 0.4)']}
          style={styles.particleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    );
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const backButtonTop = Platform.OS === 'android'
    ? responsive.getSpacing(40) + (StatusBar.currentHeight || 0)
    : responsive.getSpacing(60);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="rgba(27, 67, 50, 0.9)"
        translucent={true}
      />
      
      <LinearGradient
        colors={[
          '#1B4332',
          '#2D5016',
          '#3C6E47',
          '#1E3A8A',
          '#60A5FA',
          '#374151'
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.backgroundPattern,
            { transform: [{ rotate: spin }] }
          ]}
        >
          <LinearGradient
            colors={['rgba(30, 58, 138, 0.4)', 'rgba(45, 80, 22, 0.4)']}
            style={styles.patternGradient}
          />
        </Animated.View>

        {Array.from({ length: 6 }).map((_, index) => renderParticle(index))}

        <Animated.View
          style={[
            styles.backButton,
            {
              transform: [{ scale: pulseAnim }],
              position: 'absolute',
              top: backButtonTop,
              left: responsive.getSpacing(20),
              zIndex: 200,
            }
          ]}
          >
          <TouchableOpacity
            onPress={() => navigation.navigate('RoleSelection')}
            disabled={loading}
            style={[
              styles.backButtonStyleGlassEnhanced,
              {
                width: responsive.getSpacing(45),
                height: responsive.getSpacing(45),
                justifyContent: 'center',
                alignItems: 'center'
              },
              loading && { transform: [{ scale: 0.95 }], opacity: 0.6 }
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={responsive.getIconSize(32)}
              color="rgba(226, 232, 240, 0.95)"
              style={{
                textShadowColor: 'rgba(30, 58, 138, 0.8)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}
            />
          </TouchableOpacity>
          </Animated.View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            alwaysBounceVertical={false}
            nestedScrollEnabled={true}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          >
            <Animated.View
              style={[
                styles.contentWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <BlurView
                intensity={Platform.OS === 'android' ? 30 : 20}
                tint="light"
                style={styles.glassCard}
              >
                <View style={styles.cardOverlay}>
                  <Animated.View
                    style={[
                      styles.shimmer,
                      {
                        transform: [{ translateX: shimmerTranslate }]
                      }
                    ]}
                  />
                  
                  <View style={styles.header}>
                    <Animated.View
                      style={[
                        styles.iconContainer,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <LinearGradient
                        colors={['#1E3A8A', '#2D5016']}
                        style={styles.iconGradient}
                      >
                        <Ionicons
                          name="medical"
                          size={responsive.getIconSize(40)}
                          color="white"
                        />
                      </LinearGradient>
                    </Animated.View>
                    <Text style={styles.welcomeText}>Doctor Portal</Text>
                    <Text style={styles.subtitleText}>Records Access Gateway</Text>
                  </View>

                  <View style={styles.formSection}>
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Doctor IRLA Number"
                        mode="outlined"
                        value={identity}
                        onChangeText={setIdentity}
                        keyboardType="default"
                        style={[styles.input, {
                          fontWeight: '700',
                          fontSize: responsive.getFontSize(16)
                        }]}
                        autoCapitalize="characters"
                        disabled={loading}
                        left={<TextInput.Icon icon="account-circle" />}
                        dense={Platform.OS === 'android'}
                        contentStyle={Platform.OS === 'android' ? { paddingVertical: 8 } : {}}
                        placeholder="e.g., AB1234"
                        theme={{
                          colors: {
                            primary: '#1E3A8A',
                            background: 'rgba(255,255,255,0.95)',
                            outline: 'rgba(102, 126, 234, 0.3)',
                            onSurfaceVariant: 'rgba(0,0,0,0.6)',
                          }
                        }}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Secure Password"
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        style={[styles.input, {
                          fontWeight: '700',
                          fontSize: responsive.getFontSize(16)
                        }]}
                        disabled={loading}
                        left={<TextInput.Icon icon="lock" />}
                        dense={Platform.OS === 'android'}
                        contentStyle={Platform.OS === 'android' ? { paddingVertical: 8 } : {}}
                        right={
                          <TextInput.Icon
                            icon={showPassword ? "eye-off" : "eye"}
                            onPress={() => setShowPassword(!showPassword)}
                          />
                        }
                        theme={{
                          colors: {
                            primary: '#1E3A8A',
                            background: 'rgba(255,255,255,0.95)',
                            outline: 'rgba(102, 126, 234, 0.3)',
                            onSurfaceVariant: 'rgba(0,0,0,0.6)',
                          }
                        }}
                      />
                    </View>

                    <View style={styles.buttonContainer}>
                      <LinearGradient
                        colors={['#B8860B', '#C99700', '#DAA520', '#8B7500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientWrapper}
                      >
                        <Button
                          mode="contained"
                          onPress={handleLogin}
                          disabled={loading}
                          contentStyle={styles.loginButtonContent}
                          labelStyle={styles.loginButtonText}
                          style={[styles.loginButton, { backgroundColor: 'transparent' }]}
                          rippleColor="rgba(255, 255, 255, 0.3)"
                        >
                          {loading ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator color="#fff" size="small" />
                              <Text style={styles.loadingText}>Authenticating...</Text>
                            </View>
                          ) : (
                            <View style={styles.buttonTextContainer}>
                              <Text style={styles.loginButtonText}>Access Portal</Text>
                              <Ionicons
                                name="arrow-forward"
                                size={responsive.getIconSize(20)}
                                color="#fff"
                              />
                            </View>
                          )}
                        </Button>
                      </LinearGradient>
                    </View>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android'
      ? responsive.getSpacing(80) + (StatusBar.currentHeight || 0)
      : responsive.getSpacing(100),
    paddingBottom: responsive.getSpacing(40),
    paddingHorizontal: responsive.getSpacing(16),
    minHeight: height,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: responsive.getCardWidth(),
    alignItems: 'center',
  },
  backButton: {
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  backgroundPattern: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    borderRadius: width,
    top: -width / 2,
    left: -width / 2,
  },
  patternGradient: {
    flex: 1,
    borderRadius: width,
  },
  particle: {
    position: 'absolute',
    borderRadius: 100,
    overflow: 'hidden',
  },
  particleGradient: {
    flex: 1,
    borderRadius: 100,
  },
  backButtonStyleGlassEnhanced: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: responsive.getSize(25),
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.7)',
    overflow: 'hidden',
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  backButtonContent: {
    width: responsive.getSize(52),
    height: responsive.getSize(52),
  },
  glassCard: {
    width: '100%',
    borderRadius: responsive.getSize(25),
    overflow: 'hidden',
    elevation: Platform.OS === 'android' ? 24 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  cardOverlay: {
    backgroundColor: Platform.OS === 'android'
      ? 'rgba(15, 15, 15, 0.55)'
      : 'rgba(15, 15, 15, 0.45)',
    padding: responsive.getSpacing(30),
    position: 'relative',
    overflow: 'hidden',
    borderRadius: responsive.getSize(25),
    borderWidth: 1.5,
    borderColor: 'rgba(184, 134, 11, 0.4)',
    shadowColor: 'rgba(255, 215, 0, 0.25)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: Platform.OS === 'android' ? 16 : 12,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: responsive.getSize(350),
    transform: [{ skewX: '-20deg' }],
  },
  header: {
    alignItems: 'center',
    marginBottom: responsive.getSpacing(35),
  },
  iconContainer: {
    marginBottom: responsive.getSpacing(20),
    borderRadius: responsive.getSize(35),
    overflow: 'hidden',
    elevation: Platform.OS === 'android' ? 12 : 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  iconGradient: {
    width: responsive.getSize(70),
    height: responsive.getSize(70),
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: responsive.getFontSize(isLargeTablet ? 42 : isTablet ? 36 : 32),
    fontWeight: '800',
    color: '#DAA520',
    marginBottom: responsive.getSpacing(8),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
    textAlign: 'center',
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center',
    }),
  },
  subtitleText: {
    fontSize: responsive.getFontSize(16),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
    }),
  },
  formSection: {
    gap: responsive.getSpacing(22),
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: responsive.getSize(12),
    elevation: Platform.OS === 'android' ? 8 : 5,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    fontSize: responsive.getFontSize(16),
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
    }),
  },
  buttonContainer: {
    marginTop: responsive.getSpacing(15),
  },
  gradientWrapper: {
    borderRadius: responsive.getSize(18),
    padding: 2,
    overflow: 'hidden',
    alignSelf: 'center',
    width: isLargeTablet ? '60%' : isTablet ? '70%' : '80%',
    elevation: Platform.OS === 'android' ? 12 : 0,
  },
  loginButton: {
    borderRadius: responsive.getSize(18),
    elevation: Platform.OS === 'android' ? 12 : 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  loginButtonContent: {
    height: responsive.getSize(50),
    paddingHorizontal: responsive.getSpacing(10),
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.getSpacing(10),
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: responsive.getFontSize(17),
    fontWeight: '700',
    letterSpacing: 1,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center',
    }),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.getSpacing(12),
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: responsive.getFontSize(16),
    fontWeight: '600',
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center',
    }),
  },
});