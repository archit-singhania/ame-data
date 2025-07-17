import { useEffect, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Animated, 
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Title, Paragraph } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function DashboardDoctor({ navigation }: any) {
  const [currentDoctorId, setCurrentDoctorId] = useState('');
  const [currentDoctorName, setCurrentDoctorName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const particleAnims = useRef(
    Array(8).fill(0).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const getDoctordetails = async () => {
      try {
        const doctorId = await AsyncStorage.getItem('doctorId');
        const doctorName = await AsyncStorage.getItem('doctorName'); 
        if (doctorId) {
          setCurrentDoctorName(doctorId);
        }
        if (doctorName) {
          setCurrentDoctorName(doctorName);
        }
      } catch (error) {
      }
    };
    getDoctordetails();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('doctorId');
              await AsyncStorage.removeItem('doctorName');
              navigation.navigate('LoginDoctor');
            } catch (error) {
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

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
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    cardAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: index * 150,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    particleAnims.forEach((particle, index) => {
      const startDelay = index * 400;
      Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: -height,
              duration: 6000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.y, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const menuItems = [
    {
      title: 'AME Stats & Health Overview',
      description: 'View Annual Medical Examination status, medical history, and anthropometric measurements.',
      icon: '🏥',
      iconBg: '#FF6B6B',
      onPress: () => navigation.navigate('AMEStatViewer'),
      gradient: ['#134E5E', '#71B280'] as const,
      shadowColor: '#FF6B6B',
    },
    {
      title: 'Low Medical Category (LMC)',
      description: 'Access classification records and status for personnel in low medical categories.',
      icon: '📋',
      iconBg: '#4ECDC4',
      onPress: () => navigation.navigate('LMCStatViewer'),
      gradient: ['#2b5876', '#4e4376'] as const,
      shadowColor: '#4ECDC4',
    },
    {
      title: 'Health Reports & Logs',
      description: 'Generate and review medical reports, activity logs, and examination summaries.',
      icon: '📊',
      iconBg: '#A8E6CF',
      onPress: () => navigation.navigate('ReportsDetailScreen'),
      gradient: ['#42275a', '#734b6d'] as const,
      shadowColor: '#A8E6CF',
    },
    {
      title: 'Prescription Management',
      description: 'Create, manage, and track patient prescriptions and medication records.',
      icon: '💊',
      iconBg: '#FFB74D',
      onPress: () => navigation.navigate('PrescriptionManagement', { doctorId: currentDoctorId, doctorname: currentDoctorName }),
      gradient: ['#485563', '#29323c'] as const,
      shadowColor: '#FFB74D',
    },
  ];

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmer = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={[
          '#0F0C29',
          '#302B63',
          '#24243e',
          '#2C5364',
          '#0F2027',
          '#0F0C29'
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {particleAnims.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: (index % 4) * (width / 4) + Math.random() * (width / 4),
                transform: [
                  { translateY: particle.y },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              }
            ]}
          />
        ))}

        <Animated.View 
          style={[
            styles.floatingGeometry,
            styles.geometry1,
            {
              transform: [{ rotate: spin }]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingGeometry,
            styles.geometry2,
            {
              transform: [{ rotate: spin }]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingGeometry,
            styles.geometry3,
            {
              transform: [{ rotate: spin }]
            }
          ]}
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: pulseAnim }
                ]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <Animated.View 
                style={[
                  styles.logoCircle,
                  {
                    transform: [{ rotate: spin }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#4ECDC4', '#45B7B8']}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.logoText}>⚕️</Text>
                </LinearGradient>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.shimmer,
                  {
                    transform: [{ translateX: shimmer }]
                  }
                ]}
              />
            </View>
            
            <Animated.View
              style={[
                styles.titleContainer,
                {
                  transform: [{ scale: bounceAnim }]
                }
              ]}
            >
              <Text style={styles.heading}>MedTrack Pro</Text>
              <Text style={styles.subtitle}>Doctor Portal Dashboard</Text>
              <View style={styles.divider} />
            </Animated.View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.cardsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {menuItems.map((item, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.cardWrapper,
                  {
                    opacity: cardAnims[index],
                    transform: [{
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      })
                    }, {
                      scale: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity
                  onPress={item.onPress}
                  activeOpacity={0.8}
                  style={[
                    styles.card,
                    {
                      shadowColor: item.shadowColor,
                    }
                  ]}
                >
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.glassOverlay} />
                    
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                          <Text style={styles.cardIcon}>{item.icon}</Text>
                        </View>
                        <View style={styles.cardNumber}>
                          <Text style={styles.cardNumberText}>{index + 1}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.cardBody}>
                        <Title style={styles.cardTitle}>{item.title}</Title>
                        <Paragraph style={styles.cardDescription}>
                          {item.description}
                        </Paragraph>
                      </View>
                      
                      <View style={styles.cardFooter}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${75 + index * 5}%` }]} />
                        </View>
                        <View style={styles.arrowContainer}>
                          <Text style={styles.arrow}>→</Text>
                        </View>
                      </View>
                    </View>
                    
                    <Animated.View 
                      style={[
                        styles.cardShimmer,
                        {
                          transform: [{ translateX: shimmer }]
                        }
                      ]}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.View 
            style={[
              styles.logoutContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <TouchableOpacity
              onPress={handleLogout} 
              style={styles.logoutButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoutText}>🚪 Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  floatingGeometry: {
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  geometry1: {
    width: 120,
    height: 120,
    top: '10%',
    right: '5%',
    borderRadius: 60,
  },
  geometry2: {
    width: 80,
    height: 80,
    top: '10%',
    left: '10%',
    borderRadius: 0,
    transform: [{ rotate: '45deg' }],
  },
  geometry3: {
    width: 60,
    height: 60,
    bottom: '25%',
    right: '20%',
    borderRadius: 30,
  },
  scrollContent: {
    paddingTop: StatusBar.currentHeight || 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    color: 'white',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.6,
  },
  titleContainer: {
    alignItems: 'center',
  },
  heading: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  cardsContainer: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    elevation: 15,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'relative',
    overflow: 'hidden',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    paddingVertical: 0,
    paddingHorizontal: 16,
    minHeight: 80,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  cardBody: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 20,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginRight: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 3,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  arrow: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  cardShimmer: {
    position: 'absolute',
    top: 0,
    left: -200,
    width: 200,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  logoutContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  logoutButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logoutGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});