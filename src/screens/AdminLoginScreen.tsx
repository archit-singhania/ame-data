import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as SQLite from 'expo-sqlite';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { debugPrintTables } from '../scripts/debugDB';

const { width, height } = Dimensions.get('window');

const db = SQLite.openDatabaseSync('healthSync.db');

export default function LoginAdmin({ navigation }: any) {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const particleAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + (index * 500),
          useNativeDriver: true,
        })
      ).start();
    });

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
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
      const result = db.getAllSync('SELECT * FROM users WHERE identity = ?', [identity]);

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

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[
          '#0A1A2E',     
          '#16213E',     
          '#1B2951',    
          '#8B0000',     
          '#C41E3A',     
          '#2F4F4F'     
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View 
        style={[
          styles.backgroundOrb,
          styles.orb1,
          {
            transform: [
              { rotate: spin },
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                })
              }
            ]
          }
        ]}
      />
      
      <Animated.View 
        style={[
          styles.backgroundOrb,
          styles.orb2,
          {
            transform: [
              { rotate: spin },
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                })
              }
            ]
          }
        ]}
      />

      <Animated.View 
        style={[
          styles.backgroundOrb,
          styles.orb3,
          {
            transform: [
              { rotate: spin },
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                })
              }
            ]
          }
        ]}
      />

      {particleAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: `${10 + (index * 12)}%`,
              top: `${15 + (index * 8)}%`,
              transform: [{
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100],
                })
              }],
              opacity: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              })
            }
          ]}
        />
      ))}

      <Animated.View 
        style={[
          styles.formWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 10, paddingLeft: 30 }}>
          <Animated.View style={[styles.backButton, { transform: [{ scale: pulseAnim }] }]}>
            <Button
              onPress={() => navigation.navigate('RoleSelection')}
              disabled={loading}
              contentStyle={[
                styles.backButtonContent,
                loading && { opacity: 0.6 }
              ]}
              style={[
                styles.backButtonStyle,
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
        </View>
        <BlurView intensity={100} style={styles.formContainer}>
          <Animated.View 
            style={[
              styles.header,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#C41E3A', '#8B0000']}
                style={styles.iconGradient}
              >
                <Ionicons name="shield-checkmark" size={40} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.heading}>Admin Portal</Text>
            <Text style={styles.subheading}>Secure access to the dashboard</Text>
          </Animated.View>

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
                contentStyle={{ fontWeight: 'bold', fontSize: 16 }}
                theme={{
                  colors: {
                    primary: '#C41E3A',
                    background: 'rgba(255, 255, 255, 0.9)',
                    outline: 'rgba(102, 126, 234, 0.3)',
                    onSurfaceVariant: '#000000',
                    onSurface: '#000000', 
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
                contentStyle={{ fontWeight: 'bold', fontSize: 16 }}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                theme={{
                  colors: {
                    primary: '#C41E3A',
                    background: 'rgba(255, 255, 255, 0.9)',
                    outline: 'rgba(102, 126, 234, 0.3)',
                    onSurfaceVariant: '#000000',
                    onSurface: '#000000', 
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
                colors={loading ? ['#555', '#333'] : ['#8B0000', '#C41E3A', '#FFD700']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Login</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
              style={styles.registerWrapper}
              activeOpacity={0.7}
            >
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerLink}>Register</Text>
              </Text>
            <Button mode="outlined" onPress={debugPrintTables}>Debug DB</Button>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: '#C41E3A',
    top: -100,
    left: -100,
  },
  orb2: {
    width: 200,
    height: 200,
    backgroundColor: '#1B2951',
    top: height * 0.3,
    right: -50,
  },
  orb3: {
    width: 150,
    height: 150,
    backgroundColor: '#8B0000',
    bottom: 100,
    left: 50,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.9)', 
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 5,
  },
  backButton: {
    top: 20,
    left: 80,
    zIndex: 10,
    shadowColor: 'rgba(30, 58, 138, 0.8)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  backButtonStyle: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)', 
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.5)', 
    elevation: 0,
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  backButtonContent: {
    width: 52,
    height: 52,
  },
  registerWrapper: {
    marginTop: 20,
    alignSelf: 'center',
  },
  registerText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  registerLink: {
    color: '#FFD700',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    marginTop: 10,
    borderRadius: 30,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B7500',   
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heading: { 
    fontSize: 32, 
    fontWeight: 'bold',
    color: '#DAA520',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subheading: {
    fontSize: 16,
    color: '#C0C0C0',
    textAlign: 'center',
    fontWeight: '600'
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignSelf: 'center',
    width: '75%',
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 5,
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 16,
  },
});