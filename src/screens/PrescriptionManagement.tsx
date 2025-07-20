import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { debugPrintTables } from '../scripts/debugDB';
import { 
  getAMERecords, 
  createPrescriptionTables, 
  insertPrescription, 
  getPrescriptionsByPatient, 
  AMERecord,
  PrescriptionHistory,
  PrescriptionData,
  deletePrescription,
  Medication
} from '../utils/sqlite';

const { width, height } = Dimensions.get('window');

const getResponsiveDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const isSmallScreen = width < 380;
  const isMediumScreen = width >= 380 && width < 768;
  const isLargeScreen = width >= 768 && width < 1024;
  const isExtraLarge = width >= 1024;
  
  return {
    width,
    height,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isExtraLarge,
    containerPadding: isSmallScreen ? 12 : isMediumScreen ? 16 : isLargeScreen ? 24 : 32,
    cardMargin: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
    fontSize: {
      small: isSmallScreen ? 12 : 14,
      medium: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
      large: isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 24,
      xlarge: isSmallScreen ? 20 : isMediumScreen ? 24 : isLargeScreen ? 28 : 32,
    },
    iconSize: {
      small: isSmallScreen ? 16 : 20,
      medium: isSmallScreen ? 20 : 24,
      large: isSmallScreen ? 24 : 28,
    }
  };
};

interface SimplePrescriptionData {
  diagnosis: string;
  medications: Medication[];
  instructions: string;
  followUpDate: string;
  prescriptionDate: string;
  doctorName: string;
}

interface Doctor {
  id: string;
  name: string;
}

const PrescriptionManagement: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PrescriptionManagement'>>();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<AMERecord | null>(null);
  const [patients, setPatients] = useState<AMERecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPatientList, setShowPatientList] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [patientHistory, setPatientHistory] = useState<PrescriptionHistory[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [currentDoctor, setCurrentDoctor] = useState<Doctor>({
    id: '',
    name: ''
  });

  const goBackToDashboard = () => {
    navigation.navigate('DashboardDoctor'); 
  };

  const [prescriptionData, setPrescriptionData] = useState<SimplePrescriptionData>({
    diagnosis: '',
    medications: [],
    instructions: '',
    followUpDate: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    doctorName: ''
  });

  const [newMedication, setNewMedication] = useState<Medication>({
    id: 0,
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const premiumGradients = {
    primary: ['#667eea', '#764ba2'] as [string, string],
    secondary: ['#f093fb', '#f5576c'] as [string, string],
    success: ['#4facfe', '#00f2fe'] as [string, string],
    danger: ['#fa709a', '#fee140'] as [string, string],
    dark: ['#434343', '#000000'] as [string, string],
    light: ['#ffecd2', '#fcb69f'] as [string, string],
    glass: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)'] as [string, string],
    cardGlass: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'] as [string, string],
  };

  const getCurrentDoctor = useCallback(async () => {
    try {
      const { doctorId, doctorname } = route?.params || {};
      
      if (doctorId && doctorname) {
        return { id: doctorId, name: doctorname };
      }

      const storedDoctor = await AsyncStorage.getItem('currentDoctor');
      if (storedDoctor) {
        return JSON.parse(storedDoctor);
      }

      return { id: '', name: '' };
    } catch (error) {
      console.error('Error getting current doctor:', error);
      return { id: '', name: '' };
    }
  }, [route?.params]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const doctor = await getCurrentDoctor();
        setCurrentDoctor(doctor);

        await createPrescriptionTables();
        
        const records = await getAMERecords();
        const sortedRecords = Array.isArray(records) 
          ? records.sort((a, b) => {
              const serialA = parseInt(String(a.s_no)) || 0;
              const serialB = parseInt(String(b.s_no)) || 0;
              return serialA - serialB;
            })
          : [];
        
        setPatients(sortedRecords);

      } catch (error) {
        console.error('Error loading data:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        Alert.alert('Error', 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getCurrentDoctor]);

  const sortedAndFilteredPatients = useMemo(() => {
    return patients
      .filter(patient => {
        if (!searchTerm.trim()) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          patient.full_name?.toLowerCase().includes(searchLower) ||
          patient.personnel_id?.toLowerCase().includes(searchLower) ||
          patient.rank?.toLowerCase().includes(searchLower) ||
          patient.unit?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        const serialA = parseInt(String(a.s_no)) || 0;
        const serialB = parseInt(String(b.s_no)) || 0;
        return serialA - serialB;
      });
  }, [patients, searchTerm]);


  const loadPatientHistory = async (personnelId: string) => {
    try {
      const history = await getPrescriptionsByPatient(personnelId);
      setPatientHistory(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Error loading patient history:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      setPatientHistory([]);
    }
  };

  const selectPatient = (patient: AMERecord) => {
    setSelectedPatient(patient);
    setShowPatientList(false);
    loadPatientHistory(patient.personnel_id);
  };

  const addMedication = () => {
    if (!newMedication.name.trim() || !newMedication.dosage.trim()) {
      Alert.alert('Error', 'Please enter medication name and dosage');
      return;
    }

    const medication = {
      ...newMedication,
      id: Date.now(),
      name: newMedication.name.trim(),
      dosage: newMedication.dosage.trim(),
      frequency: newMedication.frequency.trim(),
      duration: newMedication.duration.trim(),
      instructions: newMedication.instructions.trim()
    };

    setPrescriptionData(prev => ({
      ...prev,
      medications: [...prev.medications, medication]
    }));

    setNewMedication({
      id: 0,
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });

    setShowMedicationModal(false);
  };

  const removeMedication = (id: number) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== id)
    }));
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePrescription(prescriptionId); 
              Alert.alert('Success', 'Prescription deleted successfully');
              if (selectedPatient) {
                await loadPatientHistory(selectedPatient.personnel_id);
              }
            } catch (error) {
              console.error('Error deleting prescription:', error);
              Alert.alert('Error', 'Failed to delete prescription');
            }
          }
        }
      ]
    );
  };

  const savePrescription = async () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient');
      return;
    }

    if (!prescriptionData.diagnosis.trim()) {
      Alert.alert('Error', 'Please enter a diagnosis');
      return;
    }

    if (!prescriptionData.doctorName.trim()) {
      Alert.alert('Error', 'Please enter doctor name');
      return;
    }

    if (prescriptionData.medications.length === 0) {
      Alert.alert('Error', 'Please add at least one medication');
      return;
    }

    try {
      await createPrescriptionTables();
      
      const doctorId = await findDoctorIdByName(prescriptionData.doctorName.trim());
      
      const prescriptionToSave = {
        patient: {
          personnel_id: selectedPatient.personnel_id,
          full_name: selectedPatient.full_name,
          rank: selectedPatient.rank,
          unit: selectedPatient.unit,
          age: selectedPatient.age || 0,
          blood_group: selectedPatient.blood_group || '',
          present_category_awarded: selectedPatient.present_category_awarded || ''
        },
        diagnosis: prescriptionData.diagnosis.trim(),
        symptoms: '', 
        medications: prescriptionData.medications,
        instructions: prescriptionData.instructions.trim(),
        followUpDate: prescriptionData.followUpDate || null,
        prescriptionDate: prescriptionData.prescriptionDate,
        doctorId: doctorId, 
        doctorName: prescriptionData.doctorName.trim(),
      };

      const result = await insertPrescription(prescriptionToSave);
      
      Alert.alert('Success', 'Prescription saved successfully!');
      
      setPrescriptionData({
        diagnosis: '',
        medications: [],
        instructions: '',
        followUpDate: '',
        prescriptionDate: new Date().toISOString().split('T')[0],
        doctorName: ''
      });

      await loadPatientHistory(selectedPatient.personnel_id);
      
    } catch (error) {
      console.error('Error saving prescription:', error);
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
        console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } else {
        console.error('Full error details:', JSON.stringify(error, null, 2));
      }
      Alert.alert('Error', `Failed to save prescription: ${message}`);
    }
  };

  if (loading) {
    return (
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={premiumGradients.primary}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <LinearGradient
              colors={premiumGradients.light}
              style={styles.loadingIcon}
            >
              <Icon name="loading" size={48} color="#667eea" />
            </LinearGradient>
            <Text style={styles.loadingText}>Loading Personnel...</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (showPatientList) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        
        <LinearGradient
          colors={premiumGradients.primary}
          style={[styles.header, { paddingHorizontal: getResponsiveDimensions().containerPadding }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={goBackToDashboard}
              style={styles.headerButton}
            >
              <LinearGradient
                colors={premiumGradients.glass}
                style={styles.headerButtonGradient}
              >
                <Icon name="view-dashboard" size={getResponsiveDimensions().iconSize.medium} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { fontSize: getResponsiveDimensions().fontSize.large }]}>
                Medical Prescription
              </Text>
              <Text style={[styles.headerSubtitle, { fontSize: getResponsiveDimensions().fontSize.medium }]}>
                Select a personnel to continue
              </Text>
            </View>
            <View style={styles.headerButton} />
          </View>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <LinearGradient
            colors={premiumGradients.cardGlass}
            style={styles.searchInput}
          >
            <View style={styles.searchIconContainer}>
              <LinearGradient
                colors={premiumGradients.primary}
                style={styles.searchIconGradient}
              >
                <Icon name="magnify" size={20} color="#ffffff" />
              </LinearGradient>
            </View>
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search patients..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#94a3b8"
            />
          </LinearGradient>
        </View>

        <View style={styles.patientCountContainer}>
          <LinearGradient
            colors={premiumGradients.light}
            style={styles.patientCountBadge}
          >
            <Text style={styles.patientCount}>
              {sortedAndFilteredPatients.length} patients found
            </Text>
          </LinearGradient>
        </View>

        <FlatList
          data={sortedAndFilteredPatients}
          keyExtractor={(item) => item.id?.toString() || item.personnel_id}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <TouchableOpacity
                style={styles.patientGridCard}
                onPress={() => selectPatient(item)}
              >
                <LinearGradient
                  colors={premiumGradients.cardGlass}
                  style={styles.gridCardContent}
                >
                  <LinearGradient
                    colors={premiumGradients.primary}
                    style={styles.gridPatientIcon}
                  >
                    <Text style={styles.gridSoldierEmoji}>👨🏼‍✈️</Text>
                  </LinearGradient>
                  <View style={styles.gridPatientInfo}>
                    <Text style={styles.gridPatientName}>{item.full_name}</Text>
                    <Text style={styles.gridPatientRank}>{item.rank}</Text>
                    <Text style={styles.gridPatientId}>{item.personnel_id}</Text>
                    <Text style={styles.gridPatientUnit}>{item.unit}</Text>
                    <View style={styles.gridBottomRow}>
                      <Text style={styles.gridPatientAge}>Age: {item.age}</Text>
                      <LinearGradient
                        colors={premiumGradients.success}
                        style={styles.gridCategoryBadge}
                      >
                        <Text style={styles.gridCategoryText}>{item.present_category_awarded}</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          numColumns={2}
          columnWrapperStyle={styles.ridRow}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={premiumGradients.light}
                style={styles.emptyIcon}
              >
                <Icon name="account-search" size={64} color="#94a3b8" />
              </LinearGradient>
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          )}
          contentContainerStyle={{ 
            paddingBottom: 20,
            paddingHorizontal: 10
          }}
        />
      </View>
    );
  }

  const findDoctorIdByName = async (doctorName: string): Promise<string> => {
    try {
      const ameRecords = await getAMERecords();
      const doctor = ameRecords.find(record => 
        record.full_name?.toLowerCase().trim() === doctorName.toLowerCase().trim()
      );
      return doctor ? doctor.personnel_id : '';
    } catch (error) {
      console.error('Error finding doctor ID:', error);
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingHorizontal: getResponsiveDimensions().containerPadding }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => setShowPatientList(true)}
            style={styles.headerButton}
          >
            <LinearGradient
              colors={premiumGradients.glass}
              style={styles.headerButtonGradient}
            >
              <Icon name="arrow-left" size={getResponsiveDimensions().iconSize.medium} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text 
              style={[
                styles.headerTitle, 
                { 
                  fontSize: getResponsiveDimensions().isSmallScreen ? 14 : getResponsiveDimensions().fontSize.medium,
                  textAlign: 'center',
                  flexShrink: 1
                }
              ]}
              numberOfLines={getResponsiveDimensions().isSmallScreen ? 2 : 1}
            >
              {getResponsiveDimensions().isSmallScreen ? "New Prescription" : "Details for New Prescription Issuance"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowHistory(true)}
            style={styles.headerButton}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.headerButtonGradient}
            >
              <Icon name="history" size={getResponsiveDimensions().iconSize.medium} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.formContainer}
          contentContainerStyle={styles.formScrollContent}
        >
          <View style={styles.centeredFormWrapper}>
            <View style={styles.prescriptionGridContainer}>
              <LinearGradient
                colors={premiumGradients.cardGlass}
                style={styles.prescriptionPatientGrid}
              >
                <LinearGradient
                  colors={premiumGradients.primary}
                  style={styles.prescriptionPatientIcon}
                >
                  <Text style={styles.prescriptionSoldierEmoji}>🪖</Text>
                </LinearGradient>
                <View style={styles.prescriptionPatientDetails}>
                  <View style={styles.prescriptionInfoRow}>
                    <Text style={styles.prescriptionLabel}>Name:</Text>
                    <Text style={styles.prescriptionValue}>{selectedPatient?.full_name}</Text>
                  </View>
                  <View style={styles.prescriptionInfoRow}>
                    <Text style={styles.prescriptionLabel}>Rank:</Text>
                    <Text style={styles.prescriptionValue}>{selectedPatient?.rank}</Text>
                  </View>
                  <View style={styles.prescriptionInfoRow}>
                    <Text style={styles.prescriptionLabel}>ID:</Text>
                    <Text style={styles.prescriptionValue}>{selectedPatient?.personnel_id}</Text>
                  </View>
                  <View style={styles.prescriptionInfoRow}>
                    <Text style={styles.prescriptionLabel}>Unit:</Text>
                    <Text style={styles.prescriptionValue}>{selectedPatient?.unit}</Text>
                  </View>
                  <View style={styles.prescriptionInfoRow}>
                    <Text style={styles.prescriptionLabel}>Age:</Text>
                    <Text style={styles.prescriptionValue}>{selectedPatient?.age}</Text>
                  </View>
                  <View style={styles.prescriptionInfoRow}>
                    <Text style={styles.prescriptionLabel}>Blood Group:</Text>
                    <Text style={styles.prescriptionValue}>{selectedPatient?.blood_group}</Text>
                  </View>
                </View>
                <LinearGradient
                  colors={premiumGradients.primary}
                  style={styles.prescriptionStatusIndicator}
                >
                  <Icon name="check-circle" size={20} color="#ffffff" />
                </LinearGradient>
              </LinearGradient>
            </View>

            <LinearGradient
              colors={premiumGradients.cardGlass}
              style={styles.formCard}
            >
              <View style={styles.sectionTitleContainer}>
                <LinearGradient
                  colors={premiumGradients.primary}
                  style={styles.sectionIcon}
                >
                  <Icon name="stethoscope" size={16} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Diagnosis</Text>
              </View>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={prescriptionData.diagnosis}
                  onChangeText={(text) => setPrescriptionData(prev => ({...prev, diagnosis: text}))}
                  placeholder="Enter diagnosis..."
                  placeholderTextColor="#94a3b8"
                  multiline
                />
              </View>
              <View style={styles.sectionSeparator} />
            </LinearGradient>

            <LinearGradient
              colors={premiumGradients.cardGlass}
              style={styles.formCard}
            >
              <View style={styles.sectionTitleContainer}>
                <LinearGradient
                  colors={premiumGradients.primary}
                  style={styles.sectionIcon}
                >
                  <Icon name="doctor" size={16} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Doctor Name</Text>
              </View>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={prescriptionData.doctorName}
                  onChangeText={(text) => setPrescriptionData(prev => ({...prev, doctorName: text}))}
                  placeholder="Enter doctor name..."
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.sectionSeparator} />
            </LinearGradient>

            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.formCard}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.sectionIcon}
                  >
                    <Icon name="pill" size={16} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.sectionTitle}>Medications</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButtonContainer}
                  onPress={() => setShowMedicationModal(true)}
                >
                  <LinearGradient
                    colors={premiumGradients.success}
                    style={styles.addButton}
                  >
                    <Icon name="plus" size={getResponsiveDimensions().iconSize.small} color="#ffffff" />
                    {!getResponsiveDimensions().isSmallScreen && (
                      <Text style={styles.addButtonText}>Add</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionSeparator} />

              {prescriptionData.medications.length > 0 ? (
                prescriptionData.medications.map((medication) => (
                  <LinearGradient
                    key={medication.id}
                    colors={premiumGradients.light}
                    style={styles.medicationItem}
                  >
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      <TouchableOpacity
                        onPress={() => removeMedication(medication.id)}
                        style={styles.removeButtonContainer}
                      >
                        <LinearGradient
                          colors={premiumGradients.danger}
                          style={styles.removeButton}
                        >
                          <Icon name="close" size={16} color="#ffffff" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.medicationDetail}>
                      Dosage: {medication.dosage}
                    </Text>
                    {medication.frequency && (
                      <Text style={styles.medicationDetail}>
                        Frequency: {medication.frequency}
                      </Text>
                    )}
                    {medication.duration && (
                      <Text style={styles.medicationDetail}>
                        Duration: {medication.duration}
                      </Text>
                    )}
                  </LinearGradient>
                ))
              ) : (
                <View style={styles.emptyMedications}>
                  <LinearGradient
                    colors={premiumGradients.light}
                    style={styles.emptyMedicationIcon}
                  >
                    <Icon name="pill" size={32} color="#94a3b8" />
                  </LinearGradient>
                  <Text style={styles.emptyMedicationsText}>
                    No medications added
                  </Text>
                </View>
              )}
            </LinearGradient>

            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.formCard}
            >
              <View style={styles.sectionTitleContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.sectionIcon}
                >
                  <Icon name="text-box" size={16} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Instructions</Text>
              </View>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textArea}
                  value={prescriptionData.instructions}
                  onChangeText={(text) => setPrescriptionData(prev => ({...prev, instructions: text}))}
                  placeholder="Enter additional instructions..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.sectionSeparator} />
            </LinearGradient>

            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.formCard}
            >
              <View style={styles.sectionTitleContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.sectionIcon}
                >
                  <Icon name="calendar" size={16} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Follow-up Date</Text>
              </View>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={prescriptionData.followUpDate}
                  onChangeText={(text) => setPrescriptionData(prev => ({...prev, followUpDate: text}))}
                  placeholder="YYYY-MM-DD (optional)"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.sectionSeparator} />
            </LinearGradient>

            <TouchableOpacity
              style={styles.saveButtonContainer}
              onPress={savePrescription}
            >
              <LinearGradient
                colors={premiumGradients.primary}
                style={styles.saveButton}
              >
                <Icon name="content-save" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save Prescription</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showMedicationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMedicationModal(false)}
      >
        <BlurView intensity={50} tint="dark" style={styles.modalOverlay}>
          <LinearGradient
            colors={premiumGradients.cardGlass}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={premiumGradients.primary}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity
                onPress={() => setShowMedicationModal(false)}
                style={styles.modalCloseButtonContainer}
              >
                <LinearGradient
                  colors={premiumGradients.glass}
                  style={styles.modalCloseButton}
                >
                  <Icon name="close" size={24} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medication Name *</Text>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={newMedication.name}
                    onChangeText={(text) => setNewMedication(prev => ({...prev, name: text}))}
                    placeholder="Enter medication name..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dosage *</Text>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={newMedication.dosage}
                    onChangeText={(text) => setNewMedication(prev => ({...prev, dosage: text}))}
                    placeholder="e.g., 500mg, 2 tablets"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Frequency</Text>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={newMedication.frequency}
                    onChangeText={(text) => setNewMedication(prev => ({...prev, frequency: text}))}
                    placeholder="e.g., Twice daily"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Duration</Text>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={newMedication.duration}
                    onChangeText={(text) => setNewMedication(prev => ({...prev, duration: text}))}
                    placeholder="e.g., 7 days"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonContainer}
                onPress={() => setShowMedicationModal(false)}
              >
                <LinearGradient
                  colors={premiumGradients.light}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonContainer}
                onPress={addMedication}
              >
                <LinearGradient
                  colors={premiumGradients.success}
                  style={styles.addMedicationButton}
                >
                  <Text style={styles.addMedicationButtonText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </Modal>

      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Prescription History</Text>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                style={styles.modalCloseButtonContainer}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.modalCloseButton}
                >
                  <Icon name="close" size={24} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalContent}>
              {patientHistory.length > 0 ? (
                patientHistory.map((prescription, index) => (
                  <LinearGradient
                    key={index}
                    colors={premiumGradients.light}
                    style={styles.historyItem}
                  >
                    <View style={styles.historyHeader}>
                      <LinearGradient
                        colors={premiumGradients.primary}
                        style={styles.historyDateBadge}
                      >
                        <Text style={styles.historyDate}>
                          {prescription.prescription_date}
                        </Text>
                      </LinearGradient>
                      <LinearGradient
                        colors={premiumGradients.success}
                        style={styles.historyDoctorBadge}
                      >
                        <Text style={styles.historyDoctor}>
                          {prescription.doctor_name}
                        </Text>
                      </LinearGradient>
                      <TouchableOpacity
                        onPress={() => handleDeletePrescription(prescription.id)} 
                        style={styles.deleteButtonContainer}
                      >
                        <LinearGradient
                          colors={premiumGradients.danger}
                          style={styles.deleteButton}
                        >
                          <Icon name="delete" size={16} color="#ffffff" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.historyDiagnosis}>
                      {prescription.diagnosis}
                    </Text>
                    {prescription.medications && (
                      <View style={styles.historyMedications}>
                        {(() => {
                          try {
                            const meds: Medication[] = JSON.parse(prescription.medications);
                            return meds.map((med, medIndex) => (
                              <Text key={medIndex} style={styles.historyMedication}>
                                • {med.name} - {med.dosage}
                              </Text>
                            ));
                          } catch (e) {
                            return (
                              <Text style={styles.historyMedication}>
                                Medications not available
                              </Text>
                            );
                          }
                        })()}
                      </View>
                    )}
                  </LinearGradient>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <LinearGradient
                    colors={premiumGradients.light}
                    style={styles.emptyHistoryIcon}
                  >
                    <Icon name="history" size={48} color="#94a3b8" />
                  </LinearGradient>
                  <Text style={styles.emptyHistoryText}>
                    No prescription history found
                  </Text>
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  deleteButtonContainer: {
    marginLeft: 8,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 5,
    marginVertical: 8,
  },
  patientGridCard: {
    height: 220,
    borderRadius: 16,
  },
  gridCardContent: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  gridPatientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridSoldierEmoji: {
    fontSize: 20,
  },
  gridPatientInfo: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  gridPatientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  gridPatientRank: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 2,
  },
  gridPatientId: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  gridPatientUnit: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  gridBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
  },
  gridPatientAge: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  gridCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flex: 1,
    marginLeft: 4,
  },
  gridCategoryText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  prescriptionGridContainer: {
    width: '90%',
    marginBottom: 20,
  },
  prescriptionPatientGrid: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  prescriptionPatientIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  prescriptionSoldierEmoji: {
    fontSize: 24,
  },
  prescriptionPatientDetails: {
    flex: 1,
  },
  prescriptionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 2,
  },
  prescriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  prescriptionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 2,
    textAlign: 'right',
  },
  prescriptionStatusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  centeredCardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: getResponsiveDimensions().cardMargin,
  },
  centeredFormWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: getResponsiveDimensions().cardMargin,
  },
  formScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  patientStatusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    paddingTop: getResponsiveDimensions().isSmallScreen ? 50 : 60,
    paddingBottom: getResponsiveDimensions().isSmallScreen ? 20 : 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  searchContainer: {
    paddingHorizontal: getResponsiveDimensions().containerPadding,
    paddingVertical: getResponsiveDimensions().isSmallScreen ? 15 : 20,
  },
  formContainer: {
    flex: 1,
    padding: getResponsiveDimensions().containerPadding,
  },
  patientCardContainer: {
    width: '100%',
    marginBottom: getResponsiveDimensions().cardMargin,
  },
  modalContainer: {
    width: getResponsiveDimensions().isSmallScreen ? width * 0.95 : 
          getResponsiveDimensions().isMediumScreen ? width * 0.92 : 
          getResponsiveDimensions().isLargeScreen ? width * 0.8 : width * 0.6,
    maxHeight: height * 0.8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  formCard: {
    width: '80%', 
    borderRadius: getResponsiveDimensions().isSmallScreen ? 15 : 20,
    padding: getResponsiveDimensions().isSmallScreen ? 16 : 24,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0', 
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  patientInfoCard: {
    width: '80%',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  saveButtonContainer: {
    width: '80%',
    marginTop: 20,
    marginBottom: 40,
    alignSelf: 'center',
  },
  medicationItem: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, 
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  textInputContainer: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 120,
    paddingHorizontal: 40,
    width: '100%',
  },
  emptyMedications: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  patientCard: {
    width: '100%',
    borderRadius: getResponsiveDimensions().isSmallScreen ? 15 : 20,
    padding: getResponsiveDimensions().isSmallScreen ? 16 : 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderStyle: 'solid',
    backgroundColor: '#666',
  },
  patientEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  soldierEmoji: {
    fontSize: 24,
  },
  patientAvatar: {
    width: getResponsiveDimensions().isSmallScreen ? 48 : 56,
    height: getResponsiveDimensions().isSmallScreen ? 48 : 56,
    borderRadius: getResponsiveDimensions().isSmallScreen ? 24 : 28,
  },
  patientName: {
    fontSize: getResponsiveDimensions().fontSize.medium,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  patientSubDetails: {
    fontSize: getResponsiveDimensions().fontSize.small,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  sectionTitle: {
    fontSize: getResponsiveDimensions().fontSize.medium,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  textInput: {
    fontSize: getResponsiveDimensions().fontSize.medium,
    color: '#1e293b',
    padding: getResponsiveDimensions().isSmallScreen ? 12 : 16,
    minHeight: getResponsiveDimensions().isSmallScreen ? 44 : 52,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  saveButtonText: {
    fontSize: getResponsiveDimensions().fontSize.medium,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  loadingIcon: {
    width: getResponsiveDimensions().isSmallScreen ? 80 : 100,
    height: getResponsiveDimensions().isSmallScreen ? 80 : 100,
    borderRadius: getResponsiveDimensions().isSmallScreen ? 40 : 50,
  },
  emptyIcon: {
    width: getResponsiveDimensions().isSmallScreen ? 100 : 140,
    height: getResponsiveDimensions().isSmallScreen ? 100 : 140,
    borderRadius: getResponsiveDimensions().isSmallScreen ? 50 : 70,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#ffffff',
  },
  searchIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  medicationName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    letterSpacing: 0.2,
  },
  medicationDetail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  addButtonContainer: {
    marginLeft: 'auto',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveDimensions().isSmallScreen ? 8 : 12,
    paddingVertical: getResponsiveDimensions().isSmallScreen ? 6 : 8,
    borderRadius: getResponsiveDimensions().isSmallScreen ? 16 : 20,
    minWidth: getResponsiveDimensions().isSmallScreen ? 32 : 'auto',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: getResponsiveDimensions().fontSize.small,
    fontWeight: '600',
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 28,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  historyItem: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#ffffff',
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 15,
  },
  historyDiagnosis: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  emptyText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerButton: {
    width: 44,
    height: 44,
  },
  headerButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconContainer: {
    marginRight: 10,
  },
  patientCountContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  patientCountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  patientCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientDetails: {
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patientInfoDetails: {
    flex: 1,
  },
  selectedPatientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  selectedPatientDetails: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  textArea: {
    fontSize: 16,
    color: '#334155',
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeButtonContainer: {
    marginLeft: 10,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMedicationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyMedicationsText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  modalCloseButtonContainer: {
    marginLeft: 15,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxHeight: height * 0.6,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButtonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  addMedicationButton: {
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  addMedicationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyDateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  historyDate: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyDoctorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  historyDoctor: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyMedications: {
    marginTop: 5,
  },
  historyMedication: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyHistoryIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyHistoryText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PrescriptionManagement;