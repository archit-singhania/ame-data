import React, { useState, useEffect, useCallback } from 'react';
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
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugPrintTables } from '../scripts/debugDB';
import { 
  getAMERecords, 
  createPrescriptionTables, 
  insertPrescription, 
  getPrescriptionsByPatient, 
  AMERecord,
  PrescriptionHistory,
  PrescriptionData,
  Medication
} from '../utils/sqlite';

interface SimplePrescriptionData {
  diagnosis: string;
  medications: Medication[];
  instructions: string;
  followUpDate: string;
  prescriptionDate: string;
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
  const [currentDoctor, setCurrentDoctor] = useState<Doctor>({
    id: 'DOC001',
    name: 'Dr. Current User'
  });

  const [prescriptionData, setPrescriptionData] = useState<SimplePrescriptionData>({
    diagnosis: '',
    medications: [],
    instructions: '',
    followUpDate: '',
    prescriptionDate: new Date().toISOString().split('T')[0]
  });

  const [newMedication, setNewMedication] = useState<Medication>({
    id: 0,
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

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

      return { id: 'DOC001', name: 'Dr. Current User' };
    } catch (error) {
      console.error('Error getting current doctor:', error);
      return { id: 'DOC001', name: 'Dr. Current User' };
    }
  }, [route?.params]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const doctor = await getCurrentDoctor();
        setCurrentDoctor(doctor);

        await createPrescriptionTables();
        
        debugPrintTables();

        const records = await getAMERecords();
        setPatients(Array.isArray(records) ? records : []);

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

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.full_name?.toLowerCase().includes(searchLower) ||
      patient.personnel_id?.toLowerCase().includes(searchLower) ||
      patient.rank?.toLowerCase().includes(searchLower) ||
      patient.unit?.toLowerCase().includes(searchLower)
    );
  });

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

  const savePrescription = async () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient');
      return;
    }

    if (!prescriptionData.diagnosis.trim()) {
      Alert.alert('Error', 'Please enter a diagnosis');
      return;
    }

    if (prescriptionData.medications.length === 0) {
      Alert.alert('Error', 'Please add at least one medication');
      return;
    }

    try {
      await createPrescriptionTables();
      
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
        doctorId: currentDoctor.id,
        doctorName: currentDoctor.name,
      };
      
      const result = await insertPrescription(prescriptionToSave);
      
      Alert.alert('Success', 'Prescription saved successfully!');
      
      setPrescriptionData({
        diagnosis: '',
        medications: [],
        instructions: '',
        followUpDate: '',
        prescriptionDate: new Date().toISOString().split('T')[0]
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
      <View style={styles.loadingContainer}>
        <Icon name="loading" size={48} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  if (showPatientList) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
        
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Select Patient</Text>
          <Text style={styles.headerSubtitle}>Choose a patient to create prescription</Text>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Icon name="magnify" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search patients..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <Text style={styles.patientCount}>
          {filteredPatients.length} patients found
        </Text>

        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id?.toString() || item.personnel_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.patientCard}
              onPress={() => selectPatient(item)}
            >
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{item.full_name}</Text>
                <Text style={styles.patientDetails}>
                  {item.rank} • {item.personnel_id}
                </Text>
                <Text style={styles.patientDetails}>
                  {item.unit} • Age: {item.age}
                </Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {item.present_category_awarded}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="account-search" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => setShowPatientList(true)}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Prescription</Text>
          <TouchableOpacity
            onPress={() => setShowHistory(true)}
            style={styles.historyButton}
          >
            <Icon name="history" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.formContainer}>
          <View style={styles.patientInfoCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {selectedPatient?.full_name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.patientInfoDetails}>
              <Text style={styles.selectedPatientName}>
                {selectedPatient?.full_name}
              </Text>
              <Text style={styles.selectedPatientDetails}>
                {selectedPatient?.rank} • {selectedPatient?.personnel_id}
              </Text>
              <Text style={styles.selectedPatientDetails}>
                {selectedPatient?.unit} • Age: {selectedPatient?.age}
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <TextInput
              style={styles.textInput}
              value={prescriptionData.diagnosis}
              onChangeText={(text) => setPrescriptionData(prev => ({...prev, diagnosis: text}))}
              placeholder="Enter diagnosis..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Medications</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowMedicationModal(true)}
              >
                <Icon name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {prescriptionData.medications.length > 0 ? (
              prescriptionData.medications.map((medication) => (
                <View key={medication.id} style={styles.medicationItem}>
                  <View style={styles.medicationHeader}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeMedication(medication.id)}
                      style={styles.removeButton}
                    >
                      <Icon name="close" size={20} color="#EF4444" />
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
                </View>
              ))
            ) : (
              <View style={styles.emptyMedications}>
                <Icon name="pill" size={32} color="#9CA3AF" />
                <Text style={styles.emptyMedicationsText}>
                  No medications added
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <TextInput
              style={styles.textArea}
              value={prescriptionData.instructions}
              onChangeText={(text) => setPrescriptionData(prev => ({...prev, instructions: text}))}
              placeholder="Enter additional instructions..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Follow-up Date</Text>
            <TextInput
              style={styles.textInput}
              value={prescriptionData.followUpDate}
              onChangeText={(text) => setPrescriptionData(prev => ({...prev, followUpDate: text}))}
              placeholder="YYYY-MM-DD (optional)"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={savePrescription}
          >
            <Icon name="content-save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Prescription</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showMedicationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMedicationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity
                onPress={() => setShowMedicationModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medication Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMedication.name}
                  onChangeText={(text) => setNewMedication(prev => ({...prev, name: text}))}
                  placeholder="Enter medication name..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dosage *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMedication.dosage}
                  onChangeText={(text) => setNewMedication(prev => ({...prev, dosage: text}))}
                  placeholder="e.g., 500mg, 2 tablets"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Frequency</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMedication.frequency}
                  onChangeText={(text) => setNewMedication(prev => ({...prev, frequency: text}))}
                  placeholder="e.g., Twice daily"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Duration</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMedication.duration}
                  onChangeText={(text) => setNewMedication(prev => ({...prev, duration: text}))}
                  placeholder="e.g., 7 days"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMedicationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addMedicationButton]}
                onPress={addMedication}
              >
                <Text style={styles.addMedicationButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Prescription History</Text>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {patientHistory.length > 0 ? (
                patientHistory.map((prescription, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyDate}>
                        {prescription.prescription_date}
                      </Text>
                      <Text style={styles.historyDoctor}>
                        {prescription.doctor_name}
                      </Text>
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
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Icon name="history" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyHistoryText}>
                    No prescription history
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  backButton: {
    padding: 4,
  },
  historyButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchTextInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  patientCount: {
    fontSize: 16,
    color: '#6B7280',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  patientInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientInfoDetails: {
    flex: 1,
  },
  selectedPatientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedPatientDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  medicationItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  removeButton: {
    padding: 4,
  },
  medicationDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  emptyMedications: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMedicationsText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  addMedicationButton: {
    backgroundColor: '#10B981',
  },
  addMedicationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  historyItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyDoctor: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  historyDiagnosis: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  historyMedications: {
    marginTop: 4,
  },
  historyMedication: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default PrescriptionManagement;