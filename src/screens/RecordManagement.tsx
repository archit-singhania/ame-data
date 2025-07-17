import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  getAllUsers,
  getAMERecords,
  getLowMedicalRecords,
  updateUser,
  deleteUser,
  updateAMERecord,
  deleteAMERecords,
  deleteAMERecord,
  updateLowMedicalRecord,
  deleteLowMedicalRecord,
  User,
  AMERecord,
  LowMedicalRecord,
  insertAMERecord,
  insertLowMedicalRecord,
} from '../utils/sqlite';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, MotiText } from 'moti';

type RecordManagementRouteProp = RouteProp<RootStackParamList, 'RecordManagement'>;
type RecordManagementNavProp = StackNavigationProp<RootStackParamList, 'RecordManagement'>;

type Props = {
  route: RecordManagementRouteProp;
  navigation: RecordManagementNavProp;
};

const { width, height } = Dimensions.get('window');

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: 'input' | 'picker' | 'date';
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secure?: boolean;
  multiline?: boolean;
  options?: string[];
  required?: boolean;
}

type TabType = 'users' | 'ame' | 'lowMedical';

type RecordManagementRouteParams = {
  adminId?: number;
};

type RecordManagementProp = RouteProp<
  { RecordManagement: RecordManagementRouteParams },
  'RecordManagement'
>;

const RecordManagement: React.FC<Props> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [ameRecords, setAMERecords] = useState<AMERecord[]>([]);
  const [lowMedicalRecords, setLowMedicalRecords] = useState<LowMedicalRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  const [cardAnimations] = useState(
    Array.from({ length: 20 }, () => ({
      scale: new Animated.Value(0.95),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    }))
  );

  const isTablet = width > 768;
  const isLargeScreen = width > 1024;
  const isUltraWide = width > 1400;
  const cardWidth = isUltraWide ? (width - 120) / 4 : isLargeScreen ? (width - 100) / 3 : isTablet ? (width - 80) / 2 : width - 40;
  
  useEffect(() => {
    if (activeTab === 'users' && formData.rank && formData.regt_id_irla_no) {
      const isOfficer = officerRanks.includes(formData.rank);
      setFormData((prev: any) => ({
        ...prev,
        identity: isOfficer ? formData.regt_id_irla_no : formData.regt_id_irla_no
      }));
    }
  }, [formData.rank, formData.regt_id_irla_no, activeTab]);

  useEffect(() => {
    loadData();
    animateOnMount();
  }, [activeTab]);

  const animateOnMount = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.95);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'users':
          const usersData = await getAllUsers();
          setUsers(usersData);
          break;
        case 'ame':
          const ameData = await getAMERecords();
          setAMERecords(ameData);
          break;
        case 'lowMedical':
          const lowMedicalData = await getLowMedicalRecords();
          setLowMedicalRecords(lowMedicalData);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAdd = () => {
    if (activeTab === 'users') {
      Alert.alert(
        '🚫 Action Restricted',
        'Adding new users is not allowed. You can only edit or delete existing users.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setModalType('add');
    setSelectedItem(null);
    setFormData({});
    setShowModal(true);
    animateModal();
  };

  const handleEdit = (item: any) => {
    setModalType('edit');
    setSelectedItem(item);
    
    if (activeTab === 'users') {
      setFormData({
        ...item,
        regt_id_irla_no: item.identity 
      });
    } else {
      setFormData(item);
    }
    
    setShowModal(true);
    animateModal();
  };

  const animateModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDelete = (item: any) => {
    const entityName = activeTab === 'users' ? 'user' : 
                      activeTab === 'ame' ? 'AME record' : 'Low Medical record';
    
    Alert.alert(
      '🗑️ Confirm Delete',
      `Are you sure you want to delete this ${entityName}?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => performDelete(item) 
        }
      ]
    );
  };

  const officerRanks = ['COMDT', '2IC', 'DC', 'AC'];
  const otherRanks = ['SM', 'INSP', 'SI', 'SI/JE', 'ASI', 'HC', 'HC/G', 'CT', 'M/CT',
    'HC/COOK', 'CT/COOK', 'RCT/COOK', 'HC/WC', 'CT/WC', 'RCT/WC', 'HC/WM', 'CT/WM', 'RCT/WM',
    'HC/SK', 'CT/SK', 'RCT/SK', 'CT/BB', 'RCT/BB', 'HC/BB', 'CT(COB)', 'R/CT/COB', 'CT/TM',
    'RCT/TM', 'RCT/CARP', 'HC/DVR', 'CT/DVR', 'SI/RM', 'ASI/RM', 'ASI/RO', 'HC/RO', 'CT/IT',
    'CT/COMN', 'INSP/MIN', 'SI(MIN)', 'ASI/MIN', 'HC(MIN)', 'AC/MO', 'ASI/PH', 'HC/NA', 'CT/KAHAR',
    'SI/GD', 'ASI/GD'
  ];

  const allRanks = [...officerRanks, ...otherRanks];

  const getIdLabel = (rank: string) => {
    return officerRanks.includes(rank) ? 'IRLA Number' : 'Regt ID';
  };

  const performDelete = async (item: any) => {
    try {
      switch (activeTab) {
        case 'users':
          if (item.id !== undefined) {
            deleteUser(item.id);
          }
          break;
        case 'ame':
          if (item.id !== undefined) {
            deleteAMERecord([item.id]);
          }
          break;
        case 'lowMedical':
          deleteLowMedicalRecord(item.id);
          break;
      }
      await loadData();
      Alert.alert('✅ Success', 'Record deleted successfully');
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to delete record');
    }
  };

  const validateForm = () => {
    const fields = getFieldsForActiveTab();
    const requiredFields = fields.filter(field => field.required);
    
    for (const field of requiredFields) {
      if (!formData[field.key] || formData[field.key].toString().trim() === '') {
        Alert.alert('❌ Validation Error', `${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    
    if (activeTab === 'users') {
      const isOfficer = officerRanks.includes(formData.rank);
      formData.identity = formData.regt_id_irla_no; 
    }
    
    try {
      if (modalType === 'add') {
        switch (activeTab) {
          case 'users':
            Alert.alert('Error', 'Adding users is not allowed');
            return;
          case 'ame':
            insertAMERecord(formData);
            break;
          case 'lowMedical':
            insertLowMedicalRecord(formData);
            break;
        }
      } else {
        switch (activeTab) {
          case 'users':
            updateUser(selectedItem.id!, formData);
            break;
          case 'ame':
            updateAMERecord(selectedItem.id, formData);
            break;
          case 'lowMedical':
            updateLowMedicalRecord(selectedItem.id, formData);
            break;
        }
      }
      setShowModal(false);
      await loadData();
      Alert.alert('✅ Success', `Record ${modalType === 'add' ? 'added' : 'updated'} successfully`);
    } catch (error) {
      Alert.alert('❌ Error', `Failed to ${modalType} record`);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = () => {
    const query = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'users':
        return users.filter(user => 
          user.full_name.toLowerCase().includes(query) ||
          user.identity.toLowerCase().includes(query) ||
          user.rank.toLowerCase().includes(query)
        );
      case 'ame':
        return ameRecords.filter(record => 
          record.full_name.toLowerCase().includes(query) ||
          record.personnel_id.toLowerCase().includes(query) ||
          record.rank.toLowerCase().includes(query)
        );
      case 'lowMedical':
        return lowMedicalRecords.filter(record => 
          record.name.toLowerCase().includes(query) ||
          record.personnel_id.toLowerCase().includes(query) ||
          record.rank.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  };

  const renderUserCard = ({ item, index }: { item: User, index: number }) => {
    const isOfficer = officerRanks.includes(item.rank);
    const identityLabel = isOfficer ? 'IRLA No' : 'Regt ID';
    
    return (
      <Animated.View 
        style={[
          styles.card, 
          { 
            width: cardWidth,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardShine} />
          <View style={styles.cardFloatingElements}>
            <View style={[styles.floatingDot, { top: 20, right: 30 }]} />
            <View style={[styles.floatingDot, { bottom: 30, left: 20 }]} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle}>{item.full_name}</Text>
              <Text style={styles.cardSubtitle}>{item.rank}</Text>
            </View>
            <View style={[styles.roleTag, { backgroundColor: getRoleColor(item.role) }]}>
              <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{identityLabel}</Text>
                <Text style={styles.infoValue}>{item.identity}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonIcon}>✏️</Text>
                <Text style={styles.actionButtonText}>Edit</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#f44336', '#da190b']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonIcon}>🗑️</Text>
                <Text style={styles.actionButtonText}>Delete</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderAMECard = ({ item, index }: { item: AMERecord, index: number }) => (
    <Animated.View 
      style={[
        styles.card, 
        { 
          width: cardWidth,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={['#11998e', '#38ef7d', '#a8edea']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardShine} />
        <View style={styles.cardFloatingElements}>
          <View style={[styles.floatingDot, { top: 15, right: 25 }]} />
          <View style={[styles.floatingDot, { bottom: 25, left: 15 }]} />
        </View>
        
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardTitle}>{item.full_name}</Text>
            <Text style={styles.cardSubtitle}>{item.rank} • {item.unit}</Text>
          </View>
          <View style={[styles.roleTag, { backgroundColor: '#2E7D32' }]}>
            <Text style={styles.roleText}>AME</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Serial No</Text>
              <Text style={styles.infoValue}>{item.s_no || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Personnel ID</Text>
              <Text style={styles.infoValue}>{item.personnel_id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>AME Date</Text>
              <Text style={styles.infoValue}>{item.date_of_ame}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Present Category</Text>
              <Text style={styles.infoValue}>{item.present_category_awarded}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blood Group</Text>
              <Text style={styles.infoValue}>{item.blood_group || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{item.age}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>BMI</Text>
              <Text style={styles.infoValue}>{item.bmi || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonIcon}>✏️</Text>
              <Text style={styles.actionButtonText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#f44336', '#da190b']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonIcon}>🗑️</Text>
              <Text style={styles.actionButtonText}>Delete</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderLowMedicalCard = ({ item, index }: { item: LowMedicalRecord, index: number }) => (
    <Animated.View 
      style={[
        styles.card, 
        { 
          width: cardWidth,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={['#ff6b6b', '#ffa500', '#ff9a9e']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardShine} />
        <View style={styles.cardFloatingElements}>
          <View style={[styles.floatingDot, { top: 20, right: 30 }]} />
          <View style={[styles.floatingDot, { bottom: 30, left: 20 }]} />
        </View>
        
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.rank}</Text>
          </View>
          <View style={[styles.roleTag, { backgroundColor: '#D32F2F' }]}>
            <Text style={styles.roleText}>LMC</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Personnel ID</Text>
              <Text style={styles.infoValue}>{item.personnel_id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Medical Category</Text>
              <Text style={styles.infoValue}>{item.medical_category}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Disease/Reason</Text>
              <Text style={styles.infoValue}>{item.disease_reason}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{item.medical_board_due_date || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Board Date</Text>
              <Text style={styles.infoValue}>{item.last_medical_board_date || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category Allotment</Text>
              <Text style={styles.infoValue}>{item.category_allotment_date || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonIcon}>✏️</Text>
              <Text style={styles.actionButtonText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#f44336', '#da190b']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonIcon}>🗑️</Text>
              <Text style={styles.actionButtonText}>Delete</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return '#FF5722';
      case 'doctor': return '#2196F3';
      case 'personnel': return '#4CAF50';
      default: return '#757575';
    }
  };

  const renderModal = () => {
    const fields = getFieldsForActiveTab();
    
    return (
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <BlurView intensity={100} style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>
                  {modalType === 'add' ? '✨ Add New' : '✏️ Edit'} {getTabDisplayName(activeTab)}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowModal(false)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#f44336', '#da190b']}
                    style={styles.closeButtonGradient}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {fields.map((field: FieldConfig, index: number) => (
                <View key={field.key} style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {field.label} {field.required && <Text style={styles.requiredStar}>*</Text>}
                  </Text>
                  
                  {field.key === 'password' ? (
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.passwordInput,
                          field.required && !formData[field.key] && styles.inputRequired
                        ]}
                        value={formData[field.key]?.toString() || ''}
                        onChangeText={(text) => setFormData({...formData, [field.key]: text})}
                        placeholder={field.placeholder}
                        placeholderTextColor="#999"
                        secureTextEntry={!passwordVisible}
                      />
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.passwordToggleText}>
                          {passwordVisible ? '🙈' : '👁️'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : field.type === 'picker' ? (
                    <ScrollView horizontal style={styles.pickerContainer} showsHorizontalScrollIndicator={false}>
                      {field.options?.map((option: string) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.pickerOption,
                            formData[field.key] === option && styles.pickerOptionSelected
                          ]}
                          onPress={() => setFormData({...formData, [field.key]: option})}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            formData[field.key] === option && styles.pickerOptionTextSelected
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <TextInput
                      style={[
                        styles.input,
                        field.multiline && styles.multilineInput,
                        field.required && !formData[field.key] && styles.inputRequired
                      ]}
                      value={formData[field.key]?.toString() || ''}
                      onChangeText={(text) => setFormData({...formData, [field.key]: text})}
                      placeholder={field.placeholder}
                      placeholderTextColor="#999"
                      keyboardType={field.keyboardType || 'default'}
                      secureTextEntry={field.secure || false}
                      multiline={field.multiline || false}
                      numberOfLines={field.multiline ? 4 : 1}
                    />
                  )}
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#757575', '#616161']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#CCCCCC', '#999999'] : ['#4CAF50', '#45a049']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    );
  };

  const getFieldsForActiveTab = (): FieldConfig[] => {
    const selectedRank = formData.rank;
    const idLabel = selectedRank ? getIdLabel(selectedRank) : 'Regt ID/IRLA No';
    
    switch (activeTab) {
      case 'users':
        return [
          { key: 'full_name', label: 'Full Name', placeholder: 'Enter full name', required: true },
          { 
            key: 'rank', 
            label: 'Rank', 
            type: 'picker',
            placeholder: 'Select rank',
            options: allRanks,
            required: true
          },
          { key: 'identity', label: idLabel, placeholder: `Enter ${idLabel}`, required: true },
          { key: 'password', label: 'Password', placeholder: 'Enter password', secure: true, required: true },
          { 
            key: 'role', 
            label: 'Role', 
            type: 'picker',
            placeholder: 'Select role',
            options: ['admin', 'doctor'],
            required: true
          }
        ];
      case 'ame':
        const ameIdLabel = selectedRank ? getIdLabel(selectedRank) : 'IRLA No./Regt. ID';
        return [
          { key: 's_no', label: 'SL No', placeholder: 'Enter serial number', keyboardType: 'numeric' },
          { key: 'personnel_id', label: ameIdLabel, placeholder: `Enter ${ameIdLabel}` },
          { 
            key: 'rank', 
            label: 'Rank', 
            type: 'picker',
            placeholder: 'Select rank',
            options: allRanks
          },
          { key: 'full_name', label: 'Full Name', placeholder: 'Enter full name' },
          { key: 'unit', label: 'Coy', placeholder: 'Enter unit' },
          { key: 'age', label: 'Age', placeholder: 'Enter age', keyboardType: 'numeric' },
          { key: 'height', label: 'Height (cm)', placeholder: 'Enter height', keyboardType: 'numeric' },
          { key: 'weight', label: 'Weight (Kg)', placeholder: 'Enter weight', keyboardType: 'numeric' },
          { key: 'chest', label: 'Chest (cm)', placeholder: 'Enter chest measurement', keyboardType: 'numeric' },
          { key: 'waist', label: 'Waist', placeholder: 'Enter waist measurement', keyboardType: 'numeric' },
          { key: 'hip_ratio', label: 'Hip Ratio', placeholder: 'Enter hip ratio', keyboardType: 'numeric' },
          { key: 'bmi', label: 'BMI', placeholder: 'Enter BMI', keyboardType: 'numeric' },
          { key: 'pulse', label: 'Pulse', placeholder: 'Enter pulse rate', keyboardType: 'numeric' },
          { key: 'blood_group', label: 'Blood Group', placeholder: 'Enter blood group' },
          { key: 'blood_pressure', label: 'Blood Pressure', placeholder: 'Enter blood pressure' },
          { key: 'vision', label: 'Vision', placeholder: 'Enter vision details' },
          { key: 'previous_medical_category', label: 'Previous Medical Category', placeholder: 'Enter previous category' },
          { key: 'date_of_ame', label: 'Date of AME', placeholder: 'YYYY-MM-DD' },
          { key: 'present_category_awarded', label: 'Present Category Awarded', placeholder: 'Enter present category' },
          { key: 'category_reason', label: 'Category Reason', placeholder: 'Enter category reason' },
          { key: 'remarks', label: 'Remarks', placeholder: 'Enter remarks', multiline: true },
        ];
      case 'lowMedical':
        const lmcIdLabel = selectedRank ? getIdLabel(selectedRank) : 'IRLA NO/REGT NO';
        return [
          { key: 'serial_no', label: 'SL NO', placeholder: 'Enter serial number', keyboardType: 'numeric' },
          { key: 'personnel_id', label: lmcIdLabel, placeholder: `Enter ${lmcIdLabel}` },
          { 
            key: 'rank', 
            label: 'Rank', 
            type: 'picker',
            placeholder: 'Select rank',
            options: allRanks
          },
          { key: 'name', label: 'Name', placeholder: 'Enter name' },
          { key: 'disease_reason', label: 'Disease/Reason', placeholder: 'Enter disease or reason' },
          { key: 'medical_category', label: 'Medical Category', placeholder: 'Enter medical category' },
          { key: 'category_allotment_date', label: 'Date of Category Allotment & Further Categorization', placeholder: 'YYYY-MM-DD' },
          { key: 'last_medical_board_date', label: 'Last Medical Board Appear Date', placeholder: 'YYYY-MM-DD' },
          { key: 'medical_board_due_date', label: 'Medical Board Due Date', placeholder: 'YYYY-MM-DD' },
          { key: 'remarks', label: 'Remarks', placeholder: 'Enter remarks', multiline: true },
        ];
      default:
        return [];
    }
  };

  const getTabDisplayName = (tab: TabType) => {
    switch (tab) {
      case 'users': return 'User';
      case 'ame': return 'AME Record';
      case 'lowMedical': return 'Low Medical Record';
      default: return '';
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    switch (activeTab) {
      case 'users':
        return renderUserCard({ item: item as User, index });
      case 'ame':
        return renderAMECard({ item: item as AMERecord, index });
      case 'lowMedical':
        return renderLowMedicalCard({ item: item as LowMedicalRecord, index });
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <View style={styles.backButtonContent}>
              <Text style={styles.backButtonIcon}>←</Text>
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>📋 Record Management</Text>
            <Text style={styles.headerSubtitle}>Manage all records efficiently</Text>
          </View>
          
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {activeTab === 'users' ? users.length : 
                activeTab === 'ame' ? ameRecords.length : 
                lowMedicalRecords.length}
              </Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {[
            { key: 'users', label: '👥 Users', icon: '👥' },
            { key: 'ame', label: '🏥 AME Records', icon: '🏥' },
            { key: 'lowMedical', label: '📊 Low Medical', icon: '📊' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as TabType)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={activeTab === tab.key ? 
                  ['#4CAF50', '#45a049'] : 
                  ['#f5f5f5', '#e0e0e0']
                }
                style={styles.tabButtonGradient}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText
                ]}>
                  {tab.label.split(' ')[1]}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.searchGradient}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${getTabDisplayName(activeTab).toLowerCase()}s...`}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {activeTab !== 'users' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>Add New</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View 
              style={[
                styles.loadingSpinner,
                {
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loadingSpinnerGradient}
              />
            </Animated.View>
            <Text style={styles.loadingText}>Loading records...</Text>
          </View>
        ) : filteredData().length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#f8f9fa', '#e9ecef']}
              style={styles.emptyGradient}
            >
              <Text style={styles.emptyIcon}>
                {searchQuery ? '🔍' : 
                activeTab === 'users' ? '👥' :
                activeTab === 'ame' ? '🏥' : '📊'}
              </Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matches found' : `No ${getTabDisplayName(activeTab).toLowerCase()}s yet`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 
                  'Try adjusting your search terms' : 
                  activeTab === 'users' ? 
                    'Users will appear here when added' :
                    `Start by adding your first ${getTabDisplayName(activeTab).toLowerCase()}`
                }
              </Text>
              {!searchQuery && activeTab !== 'users' && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={handleAdd}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.emptyActionButtonGradient}
                  >
                    <Text style={styles.emptyActionButtonText}>+ Add First Record</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        ) : (
          <FlatList
            data={filteredData()}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${activeTab}-${item.id || index}`}
            numColumns={isUltraWide ? 4 : isLargeScreen ? 3 : isTablet ? 2 : 1}
            key={`${activeTab}-${isUltraWide ? 4 : isLargeScreen ? 3 : isTablet ? 2 : 1}`}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#667eea', '#764ba2']}
                progressBackgroundColor="#ffffff"
              />
            }
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  passwordToggleText: {
    fontSize: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerStats: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tabContainer: {
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabScrollContent: {
    paddingHorizontal: 15,
  },
  tabButton: {
    marginHorizontal: 5,
    borderRadius: 25,
    overflow: 'hidden',
  },
  tabButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'center',
  },
  activeTab: {
    transform: [{ scale: 1.05 }],
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#ffffff',
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    marginRight: 15,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearSearchButton: {
    padding: 5,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#999',
  },
  addButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 20,
    overflow: 'hidden',
  },
  loadingSpinnerGradient: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyGradient: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyActionButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  emptyActionButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  emptyActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  listSeparator: {
    height: 20,
  },
  card: {
    marginBottom: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  cardGradient: {
    padding: 20,
    position: 'relative',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  cardFloatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardContent: {
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 5,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  actionButtonIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  editButton: {},
  deleteButton: {},
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalContent: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    maxHeight: height * 0.60,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#f44336',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  inputRequired: {
    borderColor: '#f44336',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  pickerOption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  pickerOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  pickerOptionTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 5,
  },
  modalButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalContainer: {
    width: width * 0.98, 
    maxWidth: 800, 
    maxHeight: height * 0.95, 
    backgroundColor: '#ffffff',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 20,
  },
  cancelButton: {},
  saveButton: {},
});

export default RecordManagement;