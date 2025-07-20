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
  Modal
} from 'react-native';
import { Text, Title, Paragraph } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getAllPrescriptions, 
  PrescriptionHistory 
} from '../utils/sqlite';

const { width, height } = Dimensions.get('window');

export default function DashboardAdmin({ navigation }: any) {
  const [currentAdminId, setCurrentAdminId] = useState(1);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionHistory[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
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
    const getAdminId = async () => {
      try {
        const adminId = await AsyncStorage.getItem('adminId');
        if (adminId) {
          setCurrentAdminId(parseInt(adminId));
        }
      } catch (error) {
      }
    };
    getAdminId();
  }, []);

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

  const fetchPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      
      const allPrescriptions = await getAllPrescriptions();
      
      if (allPrescriptions && Array.isArray(allPrescriptions)) {
        const transformedPrescriptions = allPrescriptions.map((prescription: any) => ({
          id: prescription.id?.toString() || '',
          patient_name: prescription.patient_name || 'Unknown Patient',
          personnel_id: prescription.patient_id || prescription.personnel_id || 'N/A',
          doctor_name: prescription.doctor_name || 'N/A',
          diagnosis: prescription.diagnosis || 'N/A',
          medications: prescription.medications || '[]',
          instructions: prescription.instructions || '',
          prescription_date: prescription.prescription_date || 'No date',
          follow_up_date: prescription.follow_up_date || '',
          status: prescription.status || 'active',
          patient_rank: prescription.patient_rank || '',
          patient_unit: prescription.patient_unit || '',
        }));
        
        setPrescriptions(transformedPrescriptions);
      } else {
        setPrescriptions([]);
      }
      
      setShowPrescriptionModal(true);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions. Please try again.');
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

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
              await AsyncStorage.removeItem('adminId');
              navigation.navigate('LoginAdmin');
            } catch (error) {
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    {
      title: 'AME Stats & Health Overview',
      description: 'View Annual Medical Examination status, medical history, and anthropometric measurements.',
      icon: '🏥',
      iconBg: '#FF6B6B',
      onPress: () => navigation.navigate('AMEStatus'),
      gradient: ['#134E5E', '#71B280'] as const,
      shadowColor: '#FF6B6B',
    },
    {
      title: 'Low Medical Category (LMC)',
      description: 'Access classification records and status for personnel in low medical categories.',
      icon: '📋',
      iconBg: '#4ECDC4',
      onPress: () => navigation.navigate('LMCRecords'),
      gradient: ['#2b5876', '#4e4376'] as const,
      shadowColor: '#4ECDC4',
    },
    {
      title: 'Health Reports & Logs',
      description: 'Generate and review medical reports, activity logs, and examination summaries.',
      icon: '📊',
      iconBg: '#A8E6CF',
      onPress: () => navigation.navigate('ReportsDetailScreen_ADM'),
      gradient: ['#42275a', '#734b6d'] as const,
      shadowColor: '#A8E6CF',
    },
    {
      title: 'Admin & Record Control',
      description: 'Manage users, update data, and maintain tables and medical records efficiently.',
      icon: '⚙️',
      iconBg: '#FFB74D',
      onPress: () => navigation.navigate('RecordManagement', { adminId: currentAdminId }),
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
          <TouchableOpacity
            style={[
              styles.prescriptionButton,
              { opacity: loadingPrescriptions ? 0.6 : 1 }
            ]}
            onPress={() => {
              if (!loadingPrescriptions) {
                Alert.alert(
                  'Prescription Records',
                  'View all prescription records?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'View', onPress: fetchPrescriptions },
                  ]
                );
              }
            }}
            disabled={loadingPrescriptions}
          >
            <Text style={styles.prescriptionButtonText}>
              {loadingPrescriptions ? '⏳' : '💊'}
            </Text>
          </TouchableOpacity>
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
              <Text style={styles.subtitle}>Advanced Medical Records Dashboard</Text>
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
          <Modal
            visible={showPrescriptionModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowPrescriptionModal(false)}
            statusBarTranslucent={true}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>All Prescriptions</Text>
                  <TouchableOpacity
                    onPress={() => setShowPrescriptionModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  {prescriptions && prescriptions.length > 0 ? (
                    prescriptions.map((prescription, index) => (
                      <View key={`prescription-${index}`} style={styles.prescriptionCard}>
                        <View style={styles.prescriptionHeader}>
                          <Text style={styles.prescriptionPatient}>
                            {prescription.patient_name || 'Unknown Patient'}
                          </Text>
                          <Text style={styles.prescriptionDate}>
                            {prescription.prescription_date || 'No date'}
                          </Text>
                        </View>

                        {(prescription.rank || prescription.unit) && (
                          <View style={styles.prescriptionDetails}>
                            <Text style={styles.prescriptionLabel}>Patient Info:</Text>
                            <Text style={styles.prescriptionValue}>
                              {prescription.rank && `${prescription.rank} - `}
                              {prescription.unit || ''}
                            </Text>
                          </View>
                        )}
                        
                        <View style={styles.prescriptionDetails}>
                          <Text style={styles.prescriptionLabel}>Personnel ID:</Text>
                          <Text style={styles.prescriptionValue}>
                            {prescription.personnel_id || 'N/A'}
                          </Text>
                        </View>
                        
                        <View style={styles.prescriptionDetails}>
                          <Text style={styles.prescriptionLabel}>Doctor:</Text>
                          <Text style={styles.prescriptionValue}>
                            {prescription.doctor_name || 'N/A'}
                          </Text>
                        </View>
                        
                        <View style={styles.prescriptionDetails}>
                          <Text style={styles.prescriptionLabel}>Diagnosis:</Text>
                          <Text style={styles.prescriptionValue}>
                            {prescription.diagnosis || 'N/A'}
                          </Text>
                        </View>
                        
                        {prescription.medications && (
                          <View style={styles.prescriptionDetails}>
                            <Text style={styles.prescriptionLabel}>Medications:</Text>
                            {(() => {
                              try {
                                const meds = JSON.parse(prescription.medications);
                                if (Array.isArray(meds) && meds.length > 0) {
                                  return meds.map((med, medIndex) => (
                                    <View key={medIndex} style={styles.medicationItem}>
                                      <Text style={styles.medicationText}>
                                        • {med.name || 'Unknown medication'}
                                      </Text>
                                      <Text style={styles.medicationDetails}>
                                        Dosage: {med.dosage || 'Not specified'}
                                      </Text>
                                      <Text style={styles.medicationDetails}>
                                        Frequency: {med.frequency || 'Not specified'}
                                      </Text>
                                      {med.duration && (
                                        <Text style={styles.medicationDetails}>
                                          Duration: {med.duration}
                                        </Text>
                                      )}
                                    </View>
                                  ));
                                } else {
                                  return (
                                    <Text style={styles.prescriptionValue}>
                                      {prescription.medications || 'No medications prescribed'}
                                    </Text>
                                  );
                                }
                              } catch (e) {
                                return (
                                  <Text style={styles.prescriptionValue}>
                                    {prescription.medications || 'No medications prescribed'}
                                  </Text>
                                );
                              }
                            })()}
                          </View>
                        )}
                        
                        {prescription.instructions && (
                          <View style={styles.prescriptionDetails}>
                            <Text style={styles.prescriptionLabel}>Instructions:</Text>
                            <Text style={styles.prescriptionValue}>
                              {prescription.instructions}
                            </Text>
                          </View>
                        )}
                        
                        {prescription.follow_up_date && (
                          <View style={styles.prescriptionDetails}>
                            <Text style={styles.prescriptionLabel}>Follow-up:</Text>
                            <Text style={styles.prescriptionValue}>
                              {prescription.follow_up_date}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyPrescriptions}>
                      <Text style={styles.emptyPrescriptionsText}>
                        {loadingPrescriptions ? 'Loading prescriptions...' : 'No prescriptions found'}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 24, 
    padding: 0, 
    width: width * 0.92,
    maxHeight: height * 0.85,
    marginTop: StatusBar.currentHeight || 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA', 
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalContent: {
    maxHeight: height * 0.65,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  prescriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  prescriptionPatient: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  prescriptionDate: {
    fontSize: 13,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '500',
  },
  prescriptionDetails: {
    marginBottom: 12,
  },
  prescriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prescriptionValue: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontWeight: '500',
  },
  medicationItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  medicationText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 0,
    marginTop: 2,
    fontWeight: '500',
  },
  emptyPrescriptions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyPrescriptionsText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  prescriptionButton: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 50,
    right: 24,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  prescriptionButtonText: {
    fontSize: 24,
    textAlign: 'center',
  },
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