import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar,
  Alert,
  TouchableOpacity,
  TextInput as RNTextInput
} from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as SQLite from 'expo-sqlite';

const { width, height } = Dimensions.get('window');

interface SQLTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: SQLStatementCallback,
    errorCallback?: SQLStatementErrorCallback
  ) => void;
}

interface SQLResultSet {
  insertId?: number;
  rowsAffected: number;
  rows: SQLResultSetRowList;
}

interface SQLResultSetRowList {
  length: number;
  item(index: number): any;
  _array: any[];
}

type SQLStatementCallback = (transaction: SQLTransaction, resultSet: SQLResultSet) => void;
type SQLStatementErrorCallback = (transaction: SQLTransaction, error: SQLError) => boolean;

interface SQLError {
  code: number;
  message: string;
}

const db = SQLite.openDatabaseSync('healthSync.db');

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const inputAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  const initDatabase = (): void => {
    try {
      db.execSync(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );
    } catch (error) {
      console.error('Error creating users table:', error);
    }
  };

  useEffect(() => {
    initDatabase();
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

    const inputStagger = Animated.stagger(200, 
      inputAnimations.map(anim => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      )
    );

    setTimeout(() => inputStagger.start(), 400);

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
  }, []);

  const handleRegister = (): void => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const result = db.getAllSync('SELECT * FROM users WHERE email = ?', [email]);
      if (result.length > 0) {
        Alert.alert('Error', 'User already exists with this email');
      } else {
        registerUser();
      }
    } catch (error) {
      console.error('Error checking user:', error);
      Alert.alert('Error', 'Database error occurred');
    }
  };

  const registerUser = (): void => {
    try {
      db.runSync('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
      Alert.alert('Success', 'User registered successfully', [
        {
          text: 'OK',
          onPress: () => {
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            navigation.navigate('Login');
          }
        }
      ]);
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', 'Failed to register user');
    }
  };

  const handleBackToLogin = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
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
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>H</Text>
            </View>
          </Animated.View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join HealthSync Community
            </Text>
          </View>
          <View style={styles.formContainer}>
            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  opacity: inputAnimations[0],
                  transform: [{
                    translateX: inputAnimations[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    })
                  }]
                }
              ]}
            >
              <TextInput
                mode="outlined"
                label="Full Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                theme={{
                  colors: {
                    primary: 'white',
                    outline: 'rgba(255,255,255,0.5)',
                    onSurfaceVariant: 'rgba(255,255,255,0.7)',
                  }
                }}
                textColor="white"
                autoCapitalize="words"
                left={<TextInput.Icon icon="account" color="rgba(255,255,255,0.7)" />}
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  opacity: inputAnimations[1],
                  transform: [{
                    translateX: inputAnimations[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })
                  }]
                }
              ]}
            >
              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                theme={{
                  colors: {
                    primary: 'white',
                    outline: 'rgba(255,255,255,0.5)',
                    onSurfaceVariant: 'rgba(255,255,255,0.7)',
                  }
                }}
                textColor="white"
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email" color="rgba(255,255,255,0.7)" />}
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  opacity: inputAnimations[2],
                  transform: [{
                    translateX: inputAnimations[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    })
                  }]
                }
              ]}
            >
              <TextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                theme={{
                  colors: {
                    primary: 'white',
                    outline: 'rgba(255,255,255,0.5)',
                    onSurfaceVariant: 'rgba(255,255,255,0.7)',
                  }
                }}
                textColor="white"
                secureTextEntry
                left={<TextInput.Icon icon="lock" color="rgba(255,255,255,0.7)" />}
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  opacity: inputAnimations[3],
                  transform: [{
                    translateX: inputAnimations[3].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })
                  }]
                }
              ]}
            >
              <TextInput
                mode="outlined"
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                theme={{
                  colors: {
                    primary: 'white',
                    outline: 'rgba(255,255,255,0.5)',
                    onSurfaceVariant: 'rgba(255,255,255,0.7)',
                  }
                }}
                textColor="white"
                secureTextEntry
                left={<TextInput.Icon icon="lock-check" color="rgba(255,255,255,0.7)" />}
              />
            </Animated.View>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Create Account
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleBackToLogin}
              style={[styles.secondaryButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: 'white' }]}
            >
              Already Have Account?
            </Button>
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
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  element1: {
    width: 80,
    height: 80,
    top: '10%',
    left: '10%',
  },
  element2: {
    width: 60,
    height: 60,
    top: '20%',
    right: '15%',
  },
  element3: {
    width: 100,
    height: 100,
    bottom: '15%',
    left: '5%',
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryButton: {
    borderRadius: 25,
    borderWidth: 2,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
});