import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';

interface ExtendedViewStyle {
  backdropFilter?: string;
}

const { width, height } = Dimensions.get('window');

const db = SQLite.openDatabaseSync('healthSync.db');

export default function LoginPersonnel({ navigation }: any) {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

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
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleLogin = () => {
    if (!identity || !password) {
      Alert.alert('Error', 'Please enter both identity and password');
      return;
    }

    setLoading(true);

    try {
      const result = db.getAllSync('SELECT * FROM users WHERE email = ?', [identity]);

      if (result.length === 0) {
        Alert.alert('Login Failed', 'No account found with this identity');
      } else {
        const user = result[0] as { password: string; name: string };
        if (user.password === password) {
          Alert.alert('Success', `Welcome back, ${user.name}`);
          navigation.navigate('Dashboard');
        } else {
          Alert.alert('Login Failed', 'Incorrect password');
        }
      }
    } catch (error: any) {
      console.error('Login Error:', error.message || error);
      Alert.alert('Error', 'Database error occurred');
    } finally {
      setLoading(false);
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={[
          '#0F0C29',   
          '#24243e',  
          '#302b63',  
          '#24243e',  
          '#0F0C29'   
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: [{
                  translateY: particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (Math.random() - 0.5) * 200],
                  })
                }, {
                  translateX: particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (Math.random() - 0.5) * 100],
                  })
                }],
                opacity: particleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.8, 0.3],
                })
              }
            ]}
          />
        ))}

        <Animated.View 
          style={[
            styles.floatingElement,
            styles.element1,
            {
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30],
                  })
                },
                { rotate: rotateInterpolate }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)']}
            style={styles.elementGradient}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.floatingElement,
            styles.element2,
            {
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 25],
                  })
                },
                { 
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-360deg'],
                  })
                }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 94, 77, 0.7)', 'rgba(255, 154, 0, 0.7)']}
            style={styles.elementGradient}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.floatingElement,
            styles.element3,
            {
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  })
                },
                { rotate: rotateInterpolate }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(67, 206, 162, 0.6)', 'rgba(24, 90, 157, 0.6)']}
            style={styles.elementGradient}
          />
        </Animated.View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('RoleSelection')}
          disabled={loading}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('RoleSelection')}
          disabled={loading}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.glassOverlay} />
          
          <View style={styles.header}>
            <Animated.View style={[styles.iconContainer, {
              transform: [{
                scale: pulseAnim
              }]
            }]}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.iconGradient}
              >
                <Ionicons name="medical" size={32} color="white" />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>Healthcare Professional Portal</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                label="Identity"
                mode="outlined"
                value={identity}
                onChangeText={setIdentity}
                keyboardType="email-address"
                style={styles.input}
                autoCapitalize="none"
                disabled={loading}
                left={<TextInput.Icon icon="account" />}
                theme={{
                  colors: {
                    primary: '#667eea',
                    background: 'rgba(255, 255, 255, 0.9)',
                    outline: 'rgba(102, 126, 234, 0.3)',
                  }
                }}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
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
                    primary: '#667eea',
                    background: 'rgba(255, 255, 255, 0.9)',
                    outline: 'rgba(102, 126, 234, 0.3)',
                  }
                }}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size={24} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.linkContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Don't have an account? </Text>
                <Text style={[styles.linkText, styles.linkTextBold]}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 100,
    overflow: 'hidden',
  },
  elementGradient: {
    flex: 1,
    borderRadius: 100,
  },
  element1: {
    width: 120,
    height: 120,
    top: '8%',
    left: '8%',
  },
  element2: {
    width: 80,
    height: 80,
    top: '15%',
    right: '10%',
  },
  element3: {
    width: 140,
    height: 140,
    bottom: '12%',
    left: '5%',
    opacity: 0.7,
  },
  glowEffect: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: width * 0.4,
    top: '20%',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formContainer: {
    borderRadius: 30,
    padding: 35,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
    overflow: 'hidden',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 35,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  heading: { 
    fontSize: 32, 
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 20,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  form: {
    gap: 20,
    zIndex: 1,
  },
  inputContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
  },
  loginButton: {
    marginTop: 15,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  loginButtonGradient: {
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
  },
  linkTextBold: {
    color: 'white',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});