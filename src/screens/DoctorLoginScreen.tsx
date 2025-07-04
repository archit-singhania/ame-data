import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, Dimensions, StatusBar, Platform } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const db = SQLite.openDatabaseSync('healthSync.db');

export default function LoginDoctor({ navigation }: any) {
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

  }, []);

  const handleLogin = () => {
    if (!identity || !password) {
      Alert.alert('Incomplete Information', 'Please enter both identity and password to continue');
      return;
    }

    setLoading(true);

    try {
      const result = db.getAllSync('SELECT * FROM users WHERE identity = ?', [identity]);

      if (result.length === 0) {
        Alert.alert('Access Denied', 'No account found with this identity');
      } else {
        const user = result[0] as { password: string; name: string };
        if (user.password === password) {
          Alert.alert('Welcome Back!', `Hello Dr. ${user.name}, access granted`);
          navigation.navigate('Dashboard');
        } else {
          Alert.alert('Authentication Failed', 'Invalid credentials provided');
        }
      }
    } catch (error: any) {
      console.error('Login Error:', error.message || error);
      Alert.alert('System Error', 'Unable to process login request');
    } finally {
      setLoading(false);
    }
  };

  const renderParticle = (index: number) => {
    const positions = [
      { top: 0.15 * height, left: 0.08 * width, size: 120 },
      { top: 0.25 * height, right: 0.12 * width, size: 80 },
      { bottom: 0.20 * height, left: 0.05 * width, size: 100 },
      { top: 0.45 * height, right: 0.08 * width, size: 60 },
      { bottom: 0.30 * height, right: 0.20 * width, size: 90 },
      { top: 0.60 * height, left: 0.15 * width, size: 70 },
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
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

        <Animated.View style={[
          styles.backButton,
          {
            transform: [{ scale: pulseAnim }],
            position: 'absolute',
            top: Platform.OS === 'ios' ? 200 : 180,
            left: 100,
            zIndex: 100,
          }
        ]}>
          <Button
            onPress={() => navigation.navigate('RoleSelection')}
            disabled={loading}
            contentStyle={[
              styles.backButtonContent,
              loading && { opacity: 0.6 }
            ]}
            style={[
              styles.backButtonStyleGlassEnhanced,
              styles.backButton,
              loading && { transform: [{ scale: 0.95 }] }
            ]}
            rippleColor="rgba(59, 130, 246, 0.3)"
          >
            <Ionicons 
              name="chevron-back" 
              size={26} 
              color="rgba(226, 232, 240, 0.95)" 
              style={{
                textShadowColor: 'rgba(30, 58, 138, 0.8)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}
            />
          </Button>
        </Animated.View>

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
          <BlurView intensity={20} tint="light" style={styles.glassCard}>
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
                    <Ionicons name="medical" size={40} color="white" />
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.welcomeText}>Doctor Portal</Text>
                <Text style={styles.subtitleText}>Secure Access Gateway</Text>
              </View>
              
              <View style={styles.formSection}>
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Doctor Identity"
                    mode="outlined"
                    value={identity}
                    onChangeText={setIdentity}
                    keyboardType="email-address"
                    style={[styles.input, { fontWeight: '700', fontSize: 16 }]}
                    autoCapitalize="none"
                    disabled={loading}
                    left={<TextInput.Icon icon="account-circle" />}
                    theme={{
                      colors: {
                        primary: '#1E3A8A',
                        background: 'rgba(255,255,255,0.9)',
                        outline: 'rgba(102, 126, 234, 0.3)',
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
                    style={[styles.input, { fontWeight: '700', fontSize: 16 }]}
                    disabled={loading}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon 
                        icon={showPassword ? "eye-off" : "eye"} 
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    theme={{
                      colors: {
                        primary: '#1E3A8A',
                        background: 'rgba(255,255,255,0.9)',
                        outline: 'rgba(102, 126, 234, 0.3)',
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
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.loadingText}>Authenticating...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonTextContainer}>
                          <Text style={styles.loginButtonText}>Access Portal</Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </View>
                      )}
                    </Button>
                  </LinearGradient>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backgroundPattern: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    borderRadius: width,
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
  contentWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  backButton: {
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButtonContent: {
    width: 52,
    height: 52,
  },
  backButtonStyleGlassEnhanced: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)', 
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.5)', 
    elevation: 0,
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    overflow: 'hidden',
  },
  glassCard: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  cardOverlay: {
    backgroundColor: 'rgba(15, 15, 15, 0.45)', 
    padding: 35,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 134, 11, 0.4)', 
    shadowColor: 'rgba(255, 215, 0, 0.25)', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 350,
    transform: [{ skewX: '-20deg' }],
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
    borderRadius: 35,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  iconGradient: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: { 
    fontSize: 32, 
    fontWeight: '800',
    color: '#DAA520',        
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  formSection: {
    gap: 25,
  },
  inputContainer: {
    position: 'relative',
  },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonContainer: {
    marginTop: 15,
  },
  gradientWrapper: {
    borderRadius: 20,
    padding: 2,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '78%',
  },
  loginButton: { 
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    alignSelf: 'center', 
    width: '75%',        
    overflow: 'hidden',  
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  loginButtonContent: {
    height: 52,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    marginTop: 10,
  },
  registerText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: 16,
  },
});