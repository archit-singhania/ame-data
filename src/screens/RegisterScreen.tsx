import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar,
  Alert,
  TouchableOpacity,
  Platform,
  Easing,
  Image,
  ScrollView
} from 'react-native';
import { Text, TextInput, Menu } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { initDatabase, registerUser, UserRole, getUserCount } from '../utils/sqlite';

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

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation, route }: RegisterScreenProps) {
  const currentUser = route?.params?.currentUser;
  const [name, setName] = useState<string>('');
  const [rank, setRank] = useState<string>('');
  const [regtId, setRegtId] = useState<string>('');
  const [identity, setIdentity] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [loading, setLoading] = useState<boolean>(false);
  const [personnelIdType, setPersonnelIdType] = useState<'regt' | 'irla'>('regt');
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const masterFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-100)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleCount = isLargeTablet ? 18 : isTablet ? 15 : isSmallScreen ? 8 : 12;
  const particleAnims = useRef(Array.from({ length: particleCount }, () => new Animated.Value(0))).current;
  const inputAnimationCount = 8;
  const inputAnimations = useRef(Array.from({ length: inputAnimationCount }, () => ({
    opacity: new Animated.Value(0),
    translateX: new Animated.Value(60),
    scale: new Animated.Value(0.9),
    rotate: new Animated.Value(0)
  }))).current;

  const roleChipAnims = useRef(Array.from({ length: 2 }, () => ({
    scale: new Animated.Value(0.8),
    opacity: new Animated.Value(0),
    bounce: new Animated.Value(0)
  }))).current;

  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const getIdentityLabel = (role: UserRole): string => {
    const officerRanks = ['COMDT', '2IC', 'DC', 'AC'];
    
    switch (role) {
      case UserRole.ADMIN:
        return officerRanks.includes(rank) ? 'Admin IRLA Number' : 'Admin Regt. ID';
      case UserRole.DOCTOR:
        return 'IRLA Number';
      case UserRole.PERSONNEL:
        return officerRanks.includes(rank) ? 'IRLA Number' : 'Regt. ID';
      default:
        return 'Identity';
    }
  };

  const getRegtIdLabel = (role: UserRole): string => {
    const officerRanks = ['COMDT', '2IC', 'DC', 'AC'];
    
    switch (role) {
      case UserRole.DOCTOR:
        return 'IRLA Number (Doctor)';
      case UserRole.PERSONNEL:
        return officerRanks.includes(rank) ? 'IRLA Number' : 'Regt ID';
      case UserRole.ADMIN:
        return officerRanks.includes(rank) ? 'Admin IRLA Number' : 'Admin Regt. ID';
      default:
        return 'Registration ID';
    }
  };

  const startContinuousAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    particleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 4000 + (index * 200),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 4000 + (index * 200),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const startEntranceAnimations = () => {
    Animated.timing(masterFadeAnim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.timing(headerSlideAnim, {
      toValue: 0,
      duration: 1000,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(logoScaleAnim, {
        toValue: 1.2,
        duration: 800,
        easing: Easing.elastic(1.5),
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.stagger(150, 
      roleChipAnims.map(({ scale, opacity, bounce }) => 
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            easing: Easing.elastic(1.2),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();

    Animated.stagger(100, 
      inputAnimations.map(({ opacity, translateX, scale }) => 
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 800,
            easing: Easing.elastic(1.1),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  };

  useEffect(() => {
    const checkAccess = () => {
      initDatabase();

      setTimeout(() => {
        startEntranceAnimations();
        startContinuousAnimations();
      }, 300);
    };

    checkAccess();
  }, [currentUser]);

  useEffect(() => {
    if (password) {
      setConfirmPassword(password);
    }
  }, [password]);

  useEffect(() => {
    setName('');
    setRank('');
    setRegtId('');
    setIdentity('');
    setPassword('');
    setConfirmPassword('');
    setPersonnelIdType('regt');
    
    Animated.parallel([
      ...inputAnimations.map(({ opacity, translateX, scale }) => 
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 30,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      )
    ]).start(() => {
      setTimeout(() => {
        Animated.stagger(50, 
          inputAnimations.map(({ opacity, translateX, scale }) => 
            Animated.parallel([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: 0,
                duration: 400,
                easing: Easing.elastic(1.1),
                useNativeDriver: true,
              }),
            ])
          )
        ).start();
      }, 100);
    });
  }, [selectedRole]);

  const handleRegister = async (): Promise<void> => {
    if (loading) return;

    Animated.sequence([
      Animated.timing(buttonPulseAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!name || !rank || !identity || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userId = registerUser(
        1,
        name,
        rank,
        regtId,
        identity,
        password,
        selectedRole
      );

      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }).start();

      Alert.alert(
        'Success', 
        `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} registered successfully`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (selectedRole === UserRole.ADMIN) {
                navigation.navigate('LoginAdmin');
              } else if (selectedRole === UserRole.DOCTOR) {
                navigation.navigate('LoginDoctor');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    Animated.timing(masterFadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  const RoleChip = ({ role, isSelected, onPress, index }: { role: string, isSelected: boolean, onPress: () => void, index: number }) => (
    <Animated.View
      style={{
        transform: [
          { scale: roleChipAnims[index].scale },
          { 
            rotateY: roleChipAnims[index].bounce.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            })
          }
        ],
        opacity: roleChipAnims[index].opacity,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          Animated.sequence([
            Animated.timing(roleChipAnims[index].bounce, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(roleChipAnims[index].bounce, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
          onPress();
        }}
        style={[
          styles.roleChip,
          isSelected && styles.selectedRoleChip,
          {
            shadowColor: isSelected ? '#00d4ff' : '#ffffff',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isSelected ? 0.8 : 0.3,
            shadowRadius: isSelected ? 15 : 8,
            elevation: isSelected ? 15 : 8,
          }
        ]}
      >
        <LinearGradient
          colors={isSelected ? ['#00d4ff', '#0099cc', '#0066aa'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
          style={[styles.roleChipGradient, isSelected && { borderColor: '#00d4ff', borderWidth: 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[
            styles.roleChipText,
            isSelected && styles.selectedRoleChipText
          ]}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const inputTheme = {
    colors: {
      primary: '#00d4ff',
      outline: '#00d4ff',
      onSurfaceVariant: '#ffffff',
      onSurface: '#ffffff',
      surface: 'rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.1)',
      placeholder: 'rgba(255,255,255,0.7)',
    },
  };

  const ADMIN_PERSONNEL_RANKS = [
    'COMDT', '2IC', 'DC', 'AC', 'SM', 'INSP', 'SI', 'SI/JE', 'ASI', 'HC', 'HC/G', 'CT', 'M/CT',
    'HC/COOK', 'CT/COOK', 'RCT/COOK', 'HC/WC', 'CT/WC', 'RCT/WC', 'HC/WM', 'CT/WM', 'RCT/WM',
    'HC/SK', 'CT/SK', 'RCT/SK', 'CT/BB', 'RCT/BB', 'HC/BB', 'CT(COB)', 'R/CT/COB', 'CT/TM',
    'RCT/TM', 'RCT/CARP', 'HC/DVR', 'CT/DVR', 'SI/RM', 'ASI/RM', 'ASI/RO', 'HC/RO', 'CT/IT',
    'CT/COMN', 'INSP/MIN', 'SI(MIN)', 'ASI/MIN', 'HC(MIN)', 'AC/MO', 'ASI/PH', 'HC/NA', 'CT/KAHAR',
    'SI/GD', 'ASI/GD'
  ];

  const DOCTOR_RANKS = [
    'COMDT', '2IC', 'DC', 'AC'
  ];

  const renderParticles = () => {
    return particleAnims.map((anim, index) => (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.8, 0.3],
            }),
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -50],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.5, 0.5],
                }),
              },
            ],
          },
        ]}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <LinearGradient
        colors={['rgba(0,212,255,0.3)', 'rgba(138,43,226,0.3)', 'rgba(30,144,255,0.3)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.3],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {renderParticles()}

      <Animated.View
        style={[
          styles.waveContainer,
          {
            transform: [
              {
                translateX: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, width],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,212,255,0.2)', 'transparent']}
          style={styles.wave}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        style={[styles.scrollView, { opacity: masterFadeAnim }]} 
      >
        <Animated.View 
          style={[
            styles.content,
            {
              transform: [{ translateY: headerSlideAnim }]
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: logoScaleAnim },
                  { scale: pulseAnim },
                  {
                    rotateY: logoRotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }
            ]}
          >
          <Animated.View
            style={[
              styles.logoGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
            <View style={{ backgroundColor: 'black', padding: 8 }}>
              <Image
                source={require('../../assets/icon.png')}
                style={{ width: 100, height: 100, backgroundColor: 'red' }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.textContainer,
              {
                opacity: breatheAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }
            ]}
          >
            <Text style={styles.title}>Register New User</Text>
            <Text style={styles.subtitle}>
              Admin Panel - Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
            </Text>
          </Animated.View>

          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Select Role:</Text>
            <View style={styles.roleChipsContainer}>
              {[UserRole.ADMIN, UserRole.DOCTOR].map((role, index) => (
                <RoleChip
                  key={role}
                  role={role}
                  isSelected={selectedRole === role}
                  onPress={() => setSelectedRole(role)}
                  index={index}
                />
              ))}
            </View>
          </View>

          <View style={styles.formContainer}>
            {[
              { label: 'Full Name', value: name, setter: setName, icon: 'account', type: 'text' },
              { label: 'Rank', value: rank, setter: setRank, icon: 'star', type: 'dropdown-rank' },
              { 
                label: (() => {
                  const officerRanks = ['COMDT', '2IC', 'DC', 'AC'];
                  switch (selectedRole) {
                    case UserRole.ADMIN:
                      return officerRanks.includes(rank) ? 'Admin IRLA Number' : 'Admin Regt. ID';
                    case UserRole.DOCTOR:
                      return 'IRLA Number';
                    case UserRole.PERSONNEL:
                      return officerRanks.includes(rank) ? 'IRLA Number' : 'Regt. ID';
                    default:
                      return 'Identity';
                  }
                })(),
                value: identity, 
                setter: setIdentity, 
                icon: 'identifier', 
                type: selectedRole === 'admin' ? 'text' : 'numeric' 
              },
              { label: 'Password', value: password, setter: setPassword, icon: 'lock', type: 'password' },
              { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, icon: 'lock-check', type: 'password' },
            ].map((field, index) => (
              
              <Animated.View 
                key={field.label}
                style={[
                  styles.inputContainer,
                  {
                    opacity: inputAnimations[index] ? inputAnimations[index].opacity : 1,
                    transform: [
                      { translateX: inputAnimations[index] ? inputAnimations[index].translateX : 0 },
                      { scale: inputAnimations[index] ? inputAnimations[index].scale : 1 },
                    ],
                  }
                ]}
              >
                {field.type === 'dropdown' || field.type === 'dropdown-rank' ? (
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Rank:</Text>
                    <Menu
                      visible={menuVisible && field.label === 'Rank'}
                      onDismiss={() => setMenuVisible(false)}
                      contentStyle={styles.menuContent}
                      anchor={
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => setMenuVisible(true)}
                        >
                          <LinearGradient
                            colors={['rgba(0,212,255,0.25)', 'rgba(138,43,226,0.25)', 'rgba(30,144,255,0.25)']}
                            style={styles.dropdownGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <View style={styles.dropdownContent}>
                              <Text style={styles.dropdownButtonText}>
                                {rank || 'Select Rank'}
                              </Text>
                              <Animated.View
                                style={[
                                  styles.chevronContainer,
                                  {
                                    transform: [
                                      {
                                        rotate: menuVisible ? '180deg' : '0deg',
                                      },
                                    ],
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={['#00d4ff', '#8a2be2']}
                                  style={styles.chevronGradient}
                                >
                                  <Text style={styles.chevronText}>▼</Text>
                                </LinearGradient>
                              </Animated.View>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      }
                    >
                      <ScrollView 
                        style={styles.menuScrollContainer}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                      >
                        {(selectedRole === 'doctor' ? DOCTOR_RANKS : ADMIN_PERSONNEL_RANKS).map((item, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.menuItem,
                              rank === item && styles.selectedMenuItem
                            ]}
                            onPress={() => {
                              setRank(item);
                              setMenuVisible(false);
                            }}
                          >
                            <LinearGradient
                              colors={rank === item ? 
                                ['rgba(0,212,255,0.3)', 'rgba(138,43,226,0.3)'] : 
                                ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                              }
                              style={styles.menuItemGradient}
                            >
                              <Text style={[
                                styles.menuItemText,
                                rank === item && styles.selectedMenuItemText
                              ]}>
                                {item}
                              </Text>
                              {rank === item && (
                                <View style={styles.selectedIndicator}>
                                  <Text style={styles.selectedIndicatorText}>✓</Text>
                                </View>
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </Menu>
                  </View>
                ) : (
                  <View style={styles.enhancedInputWrapper}>
                  <LinearGradient
                    colors={['rgba(0,212,255,0.15)', 'rgba(138,43,226,0.15)', 'rgba(30,144,255,0.15)']}
                    style={styles.inputGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <TextInput
                      label={field.label}
                      value={field.value}
                      onChangeText={field.setter}
                      mode="outlined"
                      style={styles.enhancedInput}
                      theme={inputTheme}
                      secureTextEntry={field.type === 'password'}
                      keyboardType={field.type === 'numeric' ? 'numeric' : 'default'}
                      textColor="#ffffff"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      activeOutlineColor="#00d4ff"
                      outlineColor="rgba(0,212,255,0.5)"
                      right={
                        <TextInput.Icon 
                          icon={field.icon} 
                          color="rgba(0,212,255,0.8)"
                          onPress={() => {
                            if (inputAnimations[index]) {
                              Animated.sequence([
                                Animated.timing(inputAnimations[index].rotate, {
                                  toValue: 1,
                                  duration: 200,
                                  useNativeDriver: true,
                                }),
                                Animated.timing(inputAnimations[index].rotate, {
                                  toValue: 0,
                                  duration: 200,
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }
                          }}
                        />
                      }
                      contentStyle={styles.inputContent}
                      outlineStyle={styles.inputOutline}
                      editable={true}
                    />
                  </LinearGradient>
                  
                  <Animated.View
                    style={[
                      styles.inputParticleContainer,
                      {
                        opacity: inputAnimations[index] ? inputAnimations[index].opacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.6],
                        }) : 0.6,
                      },
                    ]}
                  >
                    {[...Array(4)].map((_, particleIndex) => (
                      <Animated.View
                        key={particleIndex}
                        style={[
                          styles.inputParticle,
                          {
                            left: `${25 + particleIndex * 16}%`,
                            transform: [
                              {
                                translateY: inputAnimations[index] ? inputAnimations[index].opacity.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -20 - particleIndex * 5],
                                }) : 0,
                              },
                              {
                                scale: inputAnimations[index] ? inputAnimations[index].opacity.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.5, 1.2],
                                }) : 1,
                              },
                            ],
                          },
                        ]}
                      />
                    ))}
                  </Animated.View>
                </View>
                )}
              </Animated.View>
            ))}
          </View>

          <Animated.View 
            style={[
              styles.buttonContainer,
              {
                transform: [{ scale: buttonPulseAnim }],
                opacity: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.8],
                }),
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? 
                  ['rgba(0,212,255,0.5)', 'rgba(138,43,226,0.5)', 'rgba(30,144,255,0.5)'] : 
                  ['#00d4ff', '#8a2be2', '#1e90ff']
                }
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Animated.View
                  style={[
                    styles.submitButtonContent,
                    {
                      transform: [
                        {
                          rotateY: buttonPulseAnim.interpolate({
                            inputRange: [0.95, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'REGISTERING...' : 'REGISTER USER'}
                  </Text>
                  {!loading && (
                    <Animated.View
                      style={[
                        styles.submitButtonIcon,
                        {
                          transform: [
                            {
                              translateX: pulseAnim.interpolate({
                                inputRange: [1, 1.15],
                                outputRange: [0, 5],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Text style={styles.submitButtonIconText}>→</Text>
                    </Animated.View>
                  )}
                </Animated.View>
                
                <Animated.View
                  style={[
                    styles.buttonGlow,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.8],
                      }),
                    },
                  ]}
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            style={[
              styles.backButtonContainer,
              {
                opacity: masterFadeAnim,
                transform: [
                  {
                    translateY: masterFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.backButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.successOverlay,
              {
                opacity: successAnim,
                transform: [
                  {
                    scale: successAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(0,255,0,0.3)', 'rgba(0,200,0,0.3)']}
              style={styles.successGradient}
            >
              <Text style={styles.successText}>✓</Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: responsive.getSpacing(20),
    paddingTop: Platform.OS === 'ios' ? responsive.getSpacing(60) : responsive.getSpacing(40),
    paddingBottom: responsive.getSpacing(40),
    minHeight: height,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    maxWidth: responsive.getCardWidth(),
    alignSelf: 'center',
    width: '100%'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: responsive.getSpacing(30),
    position: 'relative',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: responsive.getSpacing(40),
  },
  title: {
    fontSize: responsive.getFontSize(32),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: responsive.getSpacing(10),
    textShadowColor: 'rgba(0,212,255,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: responsive.getFontSize(16),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  roleContainer: {
    width: '100%',
    marginBottom: responsive.getSpacing(30),
  },
  roleLabel: {
    fontSize: responsive.getFontSize(18),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: responsive.getSpacing(15),
    textShadowColor: 'rgba(0,212,255,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  roleChipsContainer: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: responsive.getSpacing(10),
  },
  roleChip: {
    borderRadius: responsive.getSize(25),
    overflow: 'hidden',
    margin: responsive.getSpacing(5),
    minWidth: isSmallScreen ? width * 0.6 : 'auto',
  },
  roleChipGradient: {
    paddingHorizontal: responsive.getSpacing(20),
    paddingVertical: responsive.getSpacing(12),
    borderRadius: responsive.getSize(25),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: responsive.getFontSize(14),
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedRoleChip: {
    transform: [{ scale: 1.1 }],
  },
  selectedRoleChipText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  formContainer: {
    width: '100%',
    maxWidth: responsive.getCardWidth(),
    paddingHorizontal: responsive.getSpacing(10),
  },
  inputContainer: {
    marginBottom: responsive.getSpacing(20),
    position: 'relative',
  },
  enhancedInputWrapper: {
    position: 'relative',
  },
  inputGradientBorder: {
    borderRadius: responsive.getSize(12),
    padding: 2,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: responsive.getSize(5) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.getSize(10),
    elevation: 8,
  },
  enhancedInput: {
    backgroundColor: 'rgba(26,26,46,0.95)',
    borderRadius: responsive.getSize(10),
    fontSize: responsive.getFontSize(16),
    color: '#ffffff',
  },
  inputContent: {
    color: '#ffffff',
    fontSize: responsive.getFontSize(16),
    fontWeight: '500',
  },
  inputOutline: {
    borderColor: '#00d4ff',
    borderWidth: 2,
  },
  inputParticleContainer: {
    position: 'absolute',
    top: -responsive.getSize(10),
    left: 0,
    right: 0,
    height: responsive.getSize(20),
    pointerEvents: 'none',
  },
  inputParticle: {
    position: 'absolute',
    width: responsive.getSize(4),
    height: responsive.getSize(4),
    borderRadius: responsive.getSize(2),
    backgroundColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: responsive.getSize(5),
    elevation: 5,
  },
  dropdownContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dropdownLabel: {
    fontSize: responsive.getFontSize(16),
    color: '#ffffff',
    marginBottom: responsive.getSpacing(10),
    fontWeight: '600',
    textAlign: 'center',
  },
  dropdownButton: {
    borderRadius: responsive.getSize(12),
    overflow: 'hidden',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: responsive.getSize(5) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.getSize(10),
    elevation: 8,
  },
  dropdownButtonText: {
    color: '#ffffff',
    fontSize: responsive.getFontSize(16),
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    marginTop: responsive.getSpacing(30),
    marginBottom: responsive.getSpacing(20),
    alignItems: 'center',
  },
  submitButton: {
    borderRadius: responsive.getSize(30),
    overflow: 'hidden',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: responsive.getSize(10) },
    shadowOpacity: 0.8,
    shadowRadius: responsive.getSize(20),
    elevation: 15,
    alignSelf: 'center', 
    minWidth: '100%', 
    maxWidth: '100%',
  },
  submitButtonGradient: {
    paddingVertical: responsive.getSpacing(18),
    paddingHorizontal: responsive.getSpacing(30),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: responsive.getFontSize(18),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  submitButtonIcon: {
    marginLeft: responsive.getSpacing(10),
  },
  submitButtonIconText: {
    color: '#ffffff',
    fontSize: responsive.getFontSize(20),
    fontWeight: 'bold',
  },
  buttonGlow: {
    position: 'absolute',
    top: -responsive.getSize(5),
    left: -responsive.getSize(5),
    right: -responsive.getSize(5),
    bottom: -responsive.getSize(5),
    borderRadius: responsive.getSize(35),
    backgroundColor: 'rgba(0,212,255,0.3)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: responsive.getSize(25),
    elevation: 20,
  },
  backButtonContainer: {
    width: '100%',
    marginTop: responsive.getSpacing(20),
    marginBottom: responsive.getSpacing(20),
    alignItems: 'center',
  },
  backButton: {
    borderRadius: responsive.getSize(25),
    overflow: 'hidden',
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: responsive.getSize(5) },
    shadowOpacity: 0.5,
    shadowRadius: responsive.getSize(10),
    elevation: 8,
  },
  backButtonGradient: {
    paddingVertical: responsive.getSpacing(12),
    paddingHorizontal: responsive.getSpacing(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: '50%',
    maxWidth: '60%',
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: responsive.getFontSize(16),
    fontWeight: '600',
  },
  successOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: responsive.getSize(100),
    height: responsive.getSize(100),
    marginLeft: -responsive.getSize(50),
    marginTop: -responsive.getSize(50),
    borderRadius: responsive.getSize(50),
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  successGradient: {
    width: '100%',
    height: '100%',
    borderRadius: responsive.getSize(50),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: responsive.getSize(20),
    elevation: 20,
  },
  successText: {
    color: '#ffffff',
    fontSize: responsive.getFontSize(36),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  particle: {
    position: 'absolute',
    width: responsive.getSize(3),
    height: responsive.getSize(3),
    borderRadius: responsive.getSize(1.5),
    backgroundColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: responsive.getSize(3),
    elevation: 5,
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: -width,
    right: 0,
    height: '100%',
    pointerEvents: 'none',
  },
  wave: {
    width: width * 2,
    height: '100%',
    opacity: 0.3,
  },
  logoGlow: {
    position: 'absolute',
    width: responsive.getSize(120),
    height: responsive.getSize(120),
    borderRadius: responsive.getSize(12), 
    backgroundColor: 'rgba(0,212,255,0.3)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: responsive.getSize(30),
    elevation: 20,
  },
  menuContent: {
  backgroundColor: 'rgba(26,26,46,0.95)',
  borderRadius: responsive.getSize(12),
  borderWidth: 1,
  borderColor: 'rgba(0,212,255,0.3)',
  shadowColor: '#00d4ff',
  shadowOffset: { width: 0, height: responsive.getSize(8) },
  shadowOpacity: 0.5,
  shadowRadius: responsive.getSize(15),
  elevation: 15,
  maxHeight: height * 0.4,
},
menuScrollContainer: {
  maxHeight: height * 0.35,
  width: '100%',
},
dropdownContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: responsive.getSize(50),
},
chevronContainer: {
  width: responsive.getSize(24),
  height: responsive.getSize(24),
  borderRadius: responsive.getSize(12),
  overflow: 'hidden',
  marginLeft: responsive.getSpacing(10),
},
chevronGradient: {
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
},
menuItem: {
  borderRadius: responsive.getSize(8),
  marginVertical: responsive.getSpacing(2),
  marginHorizontal: responsive.getSpacing(4),
  overflow: 'hidden',
},
menuItemGradient: {
  paddingHorizontal: responsive.getSpacing(16),
  paddingVertical: responsive.getSpacing(12),
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: responsive.getSize(8),
},
menuItemText: {
  color: '#ffffff',
  fontSize: responsive.getFontSize(15),
  fontWeight: '500',
},
selectedMenuItem: {
  transform: [{ scale: 1.02 }],
},
selectedMenuItemText: {
  color: '#00d4ff',
  fontWeight: 'bold',
  textShadowColor: 'rgba(0,212,255,0.5)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
},
selectedIndicator: {
  width: responsive.getSize(20),
  height: responsive.getSize(20),
  borderRadius: responsive.getSize(10),
  backgroundColor: '#00d4ff',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#00d4ff',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 1,
  shadowRadius: responsive.getSize(8),
  elevation: 8,
},
selectedIndicatorText: {
  color: '#ffffff',
  fontSize: responsive.getFontSize(12),
  fontWeight: 'bold',
},
dropdownGradient: {
  paddingHorizontal: responsive.getSpacing(20),
  paddingVertical: responsive.getSpacing(8),
  borderRadius: responsive.getSize(12),
  borderWidth: 2,
  borderColor: 'rgba(0,212,255,0.4)',
  shadowColor: '#00d4ff',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: responsive.getSize(8),
  elevation: 8,
  width: "100%", 
  alignSelf: 'center',
},
chevronText: {
  color: '#ffffff',
  fontSize: responsive.getFontSize(10),
  fontWeight: 'bold',
  textShadowColor: 'rgba(0,0,0,0.5)',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 2,
},
});