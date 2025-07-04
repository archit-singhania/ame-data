import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar,
  Alert,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Text, Button, TextInput, Card, Chip, Menu, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as SQLite from 'expo-sqlite';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

interface User {
  id?: number;
  name: string;
  rank: string;
  regt_id: string;
  identity: string;
  password: string;
  role: 'admin' | 'doctor' | 'personnel';
  created_at?: string;
  created_by?: number;
}

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

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation, route }: RegisterScreenProps) {
  const currentUser = route?.params?.currentUser;

  const [name, setName] = useState<string>('');
  const [rank, setRank] = useState<string>('');
  const [regtId, setRegtId] = useState<string>('');
  const [identity, setIdentity] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'doctor' | 'personnel'>('personnel');
  const [loading, setLoading] = useState<boolean>(false);
  const [personnelIdType, setPersonnelIdType] = useState<'regt' | 'irla'>('regt');
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const inputAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  const initDatabase = (): void => {
    try {
      const tableExists = db.getAllSync("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      
      if (tableExists.length > 0) {
        const tableInfo = db.getAllSync("PRAGMA table_info(users)") as { name: string }[];
        const hasRoleColumn = tableInfo.some(col => col.name === "role");
        
        if (!hasRoleColumn) {
          db.execSync("DROP TABLE IF EXISTS users");
        }
      }

      db.execSync(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          rank TEXT NOT NULL,
          regt_id TEXT NOT NULL,
          identity TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'personnel')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )`
      );

      const adminExists = db.getAllSync('SELECT * FROM users WHERE role = ?', ['admin']);
      if (adminExists.length === 0) {
        db.runSync(
          'INSERT INTO users (name, rank, regt_id, identity, password, role) VALUES (?, ?, ?, ?, ?, ?)',
          ['Default Admin', 'Admin', 'admin', 'admin', 'admin', 'admin']
        );
      }
    } catch (error) {
      console.error('Error creating database:', error);
    }
  };

  const validateIdentity = (identity: string, role: string): boolean => {
    switch (role) {
      case 'admin':
        return identity.length >= 3;
      case 'doctor':
      case 'personnel':
        return /^\d{8,10}$/.test(identity);
      default:
        return false;
    }
  };

  const validateRegtId = (regtId: string, role: string): boolean => {
    switch (role) {
      case 'admin':
        return regtId.length >= 3;
      case 'doctor':
        return /^\d{8,10}$/.test(regtId);
      case 'personnel':
        return /^\d{8,10}$/.test(regtId) || /^[A-Z0-9]{6,12}$/.test(regtId);
      default:
        return false;
    }
  };

  const getIdentityLabel = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Admin Identity';
      case 'doctor':
        return 'IRLA Number (8-10 digits)';
      case 'personnel':
        return personnelIdType === 'irla' ? 'IRLA Number (8-10 digits)' : 'Regt Number (8-10 digits)';
      default:
        return 'Identity';
    }
  };

  const getRegtIdLabel = (role: string): string => {
    switch (role) {
      case 'doctor':
        return 'IRLA Number (Doctor)';
      case 'personnel':
        return personnelIdType === 'irla' ? 'IRLA Number' : 'Regt ID';
      default:
        return 'Registration ID';
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can register new users', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }

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
  }, [currentUser]);

  useEffect(() => {
    if (selectedRole === 'admin') {
      setRegtId(identity);
      setPassword(identity);
      setConfirmPassword(identity);
    } else if (selectedRole === 'doctor') {
      setRegtId(identity);
      setPassword(identity);
      setConfirmPassword(identity);
    } else if (selectedRole === 'personnel') {
      setRegtId(identity);
      setPassword(identity);
      setConfirmPassword(identity);
    }
  }, [identity, selectedRole]);

  useEffect(() => {
    setName('');
    setRank('');
    setRegtId('');
    setIdentity('');
    setPassword('');
    setConfirmPassword('');
    setPersonnelIdType('regt');
  }, [selectedRole]);

  const handleRegister = async (): Promise<void> => {
    if (loading) return;

    if (!name || !rank || !identity || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateIdentity(identity, selectedRole)) {
      Alert.alert('Error', `Invalid identity format for ${selectedRole}`);
      return;
    }

    if (selectedRole !== 'admin' && !validateRegtId(regtId, selectedRole)) {
      Alert.alert('Error', `Invalid registration ID format for ${selectedRole}`);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password !== identity) {
      Alert.alert('Error', 'Password must be the same as identity for security');
      return;
    }

    setLoading(true);

    try {
      const checkFields = selectedRole === 'admin' ? [identity] : [identity, regtId];
      const checkQuery = selectedRole === 'admin' ? 'SELECT * FROM users WHERE identity = ?' : 'SELECT * FROM users WHERE identity = ? OR regt_id = ?';
      const existingUser = db.getAllSync(checkQuery, checkFields);
      
      if (existingUser.length > 0) {
        Alert.alert('Error', selectedRole === 'admin' ? 'User already exists with this identity' : 'User already exists with this identity or registration ID');
        setLoading(false);
        return;
      }

      const result = db.runSync(
        'INSERT INTO users (name, rank, regt_id, identity, password, role, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, rank, regtId, identity, password, selectedRole, currentUser?.id ?? 0]
      );

      Alert.alert('Success', `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} registered successfully`, [
        {
          text: 'OK',
          onPress: () => {
            setName('');
            setRank('');
            setRegtId('');
            setIdentity('');
            setPassword('');
            setConfirmPassword('');
            setSelectedRole('personnel');
            setPersonnelIdType('regt');
            navigation.goBack();
          }
        }
      ]);
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', 'Failed to register user');
    } finally {
      setLoading(false);
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

  const RoleChip = ({ role, isSelected, onPress }: { role: string, isSelected: boolean, onPress: () => void }) => (
    <Chip
      selected={isSelected}
      onPress={onPress}
      style={[
        styles.roleChip,
        isSelected && styles.selectedRoleChip
      ]}
      textStyle={[
        styles.roleChipText,
        isSelected && styles.selectedRoleChipText
      ]}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Chip>
  );

  const inputTheme = {
    colors: {
      primary: 'white',
      outline: 'rgba(255,255,255,0.5)',
      onSurfaceVariant: 'rgba(255,255,255,0.7)',
    },
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

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.title}>Register New User</Text>
              <Text style={styles.subtitle}>
                Admin Panel - Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
              </Text>
            </View>

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Select Role:</Text>
              <View style={styles.roleChipsContainer}>
                <RoleChip 
                  role="admin" 
                  isSelected={selectedRole === 'admin'} 
                  onPress={() => setSelectedRole('admin')}
                />
                <RoleChip 
                  role="doctor" 
                  isSelected={selectedRole === 'doctor'} 
                  onPress={() => setSelectedRole('doctor')}
                />
                <RoleChip 
                  role="personnel" 
                  isSelected={selectedRole === 'personnel'} 
                  onPress={() => setSelectedRole('personnel')}
                />
              </View>
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
                  theme={inputTheme}
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
                  label="Rank"
                  value={rank}
                  onChangeText={setRank}
                  style={styles.input}
                  theme={inputTheme}
                  textColor="white"
                  autoCapitalize="words"
                  left={<TextInput.Icon icon="star" color="rgba(255,255,255,0.7)" />}
                />
              </Animated.View>

              {selectedRole === 'personnel' && (
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
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>ID Type:</Text>
                    <Menu
                      visible={menuVisible}
                      onDismiss={() => setMenuVisible(false)}
                      anchor={
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => setMenuVisible(true)}
                        >
                          <Text style={styles.dropdownButtonText}>
                            {personnelIdType === 'regt' ? 'Regt ID (Other Ranks)' : 'IRLA Number (Officers)'}
                          </Text>
                          <TextInput.Icon icon="chevron-down" color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                      }
                    >
                      <Menu.Item 
                        onPress={() => {
                          setPersonnelIdType('regt');
                          setMenuVisible(false);
                          setIdentity('');
                          setRegtId('');
                        }} 
                        title="Regt ID (Other Ranks)" 
                      />
                      <Menu.Item 
                        onPress={() => {
                          setPersonnelIdType('irla');
                          setMenuVisible(false);
                          setIdentity('');
                          setRegtId('');
                        }} 
                        title="IRLA Number (Officers)" 
                      />
                    </Menu>
                  </View>
                </Animated.View>
              )}

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
                  label={getIdentityLabel(selectedRole)}
                  value={identity}
                  onChangeText={setIdentity}
                  style={styles.input}
                  theme={inputTheme}
                  textColor="white"
                  autoCapitalize={selectedRole === 'admin' ? 'none' : 'characters'}
                  keyboardType={selectedRole === 'admin' ? 'default' : 'numeric'}
                  left={<TextInput.Icon icon="identifier" color="rgba(255,255,255,0.7)" />}
                />
              </Animated.View>

              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: inputAnimations[4],
                    transform: [{
                      translateX: inputAnimations[4].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      })
                    }]
                  }
                ]}
              >
                <TextInput
                  mode="outlined"
                  label="Password (Auto-filled)"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  theme={inputTheme}
                  textColor="white"
                  secureTextEntry
                  editable={false}
                  left={<TextInput.Icon icon="lock" color="rgba(255,255,255,0.7)" />}
                />
              </Animated.View>

              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: inputAnimations[5],
                    transform: [{
                      translateX: inputAnimations[5].interpolate({
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
                  theme={inputTheme}
                  textColor="white"
                  secureTextEntry
                  editable={false}
                  left={<TextInput.Icon icon="lock-check" color="rgba(255,255,255,0.7)" />}
                />
              </Animated.View>
            </View>

            <Card style={styles.securityCard}>
              <Card.Content>
                <Text style={styles.securityTitle}>Security Notice</Text>
                <Text style={styles.securityText}>
                  • Password is automatically set to match identity for security
                  {'\n'}• {
                    selectedRole === 'admin'
                      ? 'Select appropriate rank and then enter IRLA Number or Regt ID accordingly'
                      : selectedRole === 'doctor'
                        ? 'Identity must be 8-10 digit IRLA Number'
                        : 'IRLA/Regt numbers must be 8-10 digits'
                  }
                  {'\n'}• {
                    selectedRole === 'admin'
                      ? 'Admin identity must be 8-10 characters (same as Regt ID/IRLA Number)'
                      : selectedRole === 'doctor'
                        ? 'IRLA Number is used as identity'
                        : 'Select appropriate ID type: Regt ID or IRLA Number'
                  }
                </Text>
              </Card.Content>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleBackToLogin}
                style={[styles.secondaryButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
                contentStyle={styles.buttonContent}
                labelStyle={[styles.buttonLabel, { color: 'white' }]}
                disabled={loading}
              >
                Back to Dashboard
              </Button>
            </View>
          </Animated.View>
        </ScrollView>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
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
  roleContainer: {
    width: '100%',
    marginBottom: 30,
  },
  roleLabel: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  roleChipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  roleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    margin: 5,
  },
  selectedRoleChip: {
    backgroundColor: 'white',
  },
  roleChipText: {
    color: 'white',
  },
  selectedRoleChipText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  dropdownContainer: {
    marginBottom: 10,
  },
  dropdownLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 15,
  },
  dropdownButtonText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  securityCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
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