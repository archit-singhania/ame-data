import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  TextInput, 
  FlatList,
  Dimensions, 
  PixelRatio
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getLowMedicalRecords, 
  createLowMedicalTable, 
  updateLowMedicalRecord,
  parseCategoryAllotmentDates
} from '../utils/sqlite';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LowMedicalRecord } from '../utils/sqlite';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export default function LMCStatViewer() {
  const [lmcRecords, setLmcRecords] = useState<LowMedicalRecord[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<LowMedicalRecord[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [editingRemarks, setEditingRemarks] = useState<{[key: string]: boolean}>({});
  const [tempRemarks, setTempRemarks] = useState<{[key: string]: string}>({});

  const handleRemarksEdit = (recordId: string, newRemarks: string) => {
    updateLowMedicalRecord(parseInt(recordId), { remarks: newRemarks });
    
    const updatedRecords = lmcRecords.map(record => 
        record.id?.toString() === recordId ? { ...record, remarks: newRemarks } : record
    );
    setLmcRecords(updatedRecords);
    
    setEditingRemarks(prev => ({ ...prev, [recordId]: false }));
    setTempRemarks(prev => ({ ...prev, [recordId]: '' }));
  };

  const getScreenDimensions = () => {
    const { width, height } = Dimensions.get('window');
    const screenInches = Math.sqrt(width * width + height * height) / PixelRatio.get() / 160;
    
    return {
      width,
      height,
      screenInches,
      isSmallScreen: screenInches < 5,
      isMediumScreen: screenInches >= 5 && screenInches < 8,
      isLargeScreen: screenInches >= 8 && screenInches < 10,
      isXLargeScreen: screenInches >= 10
    };
  };

  const [screenDimensions, setScreenDimensions] = useState(getScreenDimensions());

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
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
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    initializeData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
        setFilteredRecords(lmcRecords);
    } else {
        const filtered = lmcRecords.filter(record => 
        record.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.personnel_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.rank?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.medical_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.disease_reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredRecords(filtered);
    }
    }, [searchQuery, lmcRecords]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setScreenDimensions(getScreenDimensions());
    });
    
    return () => subscription?.remove();
  }, []);

  const initializeData = async () => {
    try {
      await createLowMedicalTable();
      await loadLMCRecords();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const loadLMCRecords = async () => {
    try {
      const records = await getLowMedicalRecords();
      setLmcRecords(records);
    } catch (error) {
      console.error('Error loading LMC records:', error);
    }
  };

  const getRankColor = (rank: string) => {
    if (!rank) return '#6B7280';
    const r = rank.toLowerCase();
    if (r.includes('col') || r.includes('gen')) return '#1F2937';
    if (r.includes('maj') || r.includes('capt')) return '#374151';
    if (r.includes('lt')) return '#4B5563';
    if (r.includes('sub') || r.includes('hav')) return '#6B7280';
    return '#9CA3AF';
  };

  const getCategoryColor = (category: string) => {
    if (!category || category === '-') return '#6B7280';
    
    switch (category?.toLowerCase()) {
      case 'a1': return '#166534';
      case 'a2': return '#15803D';
      case 'b1': return '#92400E';
      case 'b2': return '#A16207';
      case 'c1': return '#991B1B';
      case 'c2': return '#B91C1C';
      case 'temp': return '#581C87';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status || status === '-') return '#6B7280';
    
    switch (status?.toLowerCase()) {
      case 'active': return '#166534';
      case 'inactive': return '#991B1B';
      case 'pending': return '#92400E';
      case 'review': return '#581C87';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    return dateString;
  };

  const calculateDaysUntilDue = (dueDateString: string) => {
    if (!dueDateString || dueDateString === '-') return null;
    
    try {
      const [day, month, year] = dueDateString.split('.').map(Number);
      const dueDate = new Date(year, month - 1, day);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const renderRecordItem = ({ item, index }: { item: LowMedicalRecord; index: number }) => {
    const daysUntilDue = calculateDaysUntilDue(item.medical_board_due_date);
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
    const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 30;
    const categoryDates = parseCategoryAllotmentDates(item.category_allotment_date);

    return (
      <Animated.View 
        style={[
          styles.recordItem,
          screenDimensions.isSmallScreen && styles.recordItemSmall,
          screenDimensions.isLargeScreen && styles.recordItemLarge,
          screenDimensions.isXLargeScreen && styles.recordItemXLarge,
          {
            transform: [{
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={['#F9FAFB', '#F3F4F6', '#E5E7EB']}
          style={[
            styles.recordGradient,
            screenDimensions.isSmallScreen && styles.recordGradientSmall,
            screenDimensions.isLargeScreen && styles.recordGradientLarge
          ]}
        >
          <View style={[
            styles.recordHeader,
            screenDimensions.isSmallScreen && styles.recordHeaderSmall
          ]}>
            <View style={styles.recordHeaderLeft}>
              <LinearGradient
                colors={['#1F2937', '#374151']}
                style={[
                  styles.profileCircle,
                  screenDimensions.isSmallScreen && styles.profileCircleSmall,
                  screenDimensions.isLargeScreen && styles.profileCircleLarge
                ]}
              >
                <Text style={[
                  styles.profileInitial,
                  screenDimensions.isSmallScreen && styles.profileInitialSmall,
                  screenDimensions.isLargeScreen && styles.profileInitialLarge
                ]}>
                  {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </LinearGradient>
              <View style={styles.headerInfo}>
                <Text style={[
                  styles.recordTitle,
                  screenDimensions.isSmallScreen && styles.recordTitleSmall,
                  screenDimensions.isLargeScreen && styles.recordTitleLarge
                ]}>{item.name || 'Unknown'}</Text>
                <View style={styles.idContainer}>
                  <Text style={[
                      styles.recordSubtitle,
                      screenDimensions.isSmallScreen && styles.recordSubtitleSmall,
                      screenDimensions.isLargeScreen && styles.recordSubtitleLarge
                  ]}>
                      {['COMDT', 'comdt', '2IC', '2ic', 'DC', 'dc', 'AC', 'ac'].includes(item.rank?.toLowerCase()) 
                      ? `IRLA No: ${item.personnel_id || 'No ID'}`
                      : `Regt ID: ${item.personnel_id || 'No ID'}`
                      }
                  </Text>
                  </View>
              </View>
            </View>
            <View style={styles.recordHeaderRight}>
              <View style={styles.serialBadge}>
                <Text style={[
                  styles.serialText,
                  screenDimensions.isLargeScreen && styles.serialTextLarge
                ]}>#{item.serial_no || '-'}</Text>
              </View>
              <LinearGradient
                colors={[getRankColor(item.rank), `${getRankColor(item.rank)}CC`]}
                style={styles.rankBadge}
              >
                <Text style={[
                  styles.rankText,
                  screenDimensions.isLargeScreen && styles.rankTextLarge
                ]}>{item.rank || '-'}</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={[
            styles.quickInfoPills,
            screenDimensions.isSmallScreen && styles.quickInfoPillsSmall,
            {
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            },
          ]}>
            {[
              { icon: '🏥', label: 'Category', value: item.medical_category || '-', gradient: ['#166534', '#15803D'] },
              { icon: '⚕️', label: 'Disease/Reason', value: item.disease_reason || '-', gradient: ['#991B1B', '#B91C1C'] },
              { 
                icon: '🕐', 
                label: 'Days Until Due', 
                value: daysUntilDue !== null ? 
                  (isOverdue ? `${Math.abs(daysUntilDue)} overdue` : `${daysUntilDue} days`) : '-',
                gradient: isOverdue ? ['#991B1B', '#B91C1C'] : isDueSoon ? ['#92400E', '#A16207'] : ['#4B5563', '#6B7280']
              },
              { icon: '📊', label: 'Status', value: item.status || '-', gradient: [getStatusColor(item.status), `${getStatusColor(item.status)}CC`] },
            ].map(({ icon, label, value, gradient }, index) => (
              <LinearGradient
                key={index}
                colors={gradient as [string, string, ...string[]]}
                style={[
                  styles.infoPill,
                  screenDimensions.isSmallScreen && styles.infoPillSmall,
                  screenDimensions.isLargeScreen && styles.infoPillLarge,
                  {
                    width: '48%',
                    marginBottom: 12,
                  },
                ]}
              >
                <Text style={[
                  styles.pillIcon,
                  screenDimensions.isSmallScreen && styles.pillIconSmall,
                  screenDimensions.isLargeScreen && styles.pillIconLarge,
                ]}>
                  {icon}
                </Text>
                <Text style={[
                  styles.pillLabel,
                  screenDimensions.isSmallScreen && styles.pillLabelSmall,
                  screenDimensions.isLargeScreen && styles.pillLabelLarge,
                ]}>
                  {label}
                </Text>
                <Text style={[
                  styles.pillValue,
                  screenDimensions.isSmallScreen && styles.pillValueSmall,
                  screenDimensions.isLargeScreen && styles.pillValueLarge,
                ]}>
                  {value}
                </Text>
              </LinearGradient>
            ))}
          </View>

          <View style={styles.medicalStatusContainer}>
            <LinearGradient
              colors={['#166534', '#15803D']}
              style={[
                styles.medicalStatusBar,
                screenDimensions.isSmallScreen && styles.medicalStatusBarSmall,
                screenDimensions.isLargeScreen && styles.medicalStatusBarLarge,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                },
              ]}
            >
              <View style={styles.statusSection}>
                <Text style={[
                  styles.statusLabel,
                  screenDimensions.isSmallScreen && styles.statusLabelSmall,
                  screenDimensions.isLargeScreen && styles.statusLabelLarge,
                ]}>
                  Medical Category
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getCategoryColor(item.medical_category) },
                ]}>
                  <Text style={[
                    styles.statusText,
                    screenDimensions.isSmallScreen && styles.statusTextSmall,
                    screenDimensions.isLargeScreen && styles.statusTextLarge,
                  ]}>
                    {item.medical_category || '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusArrow}>
                <LinearGradient
                  colors={['#92400E', '#A16207']}
                  style={styles.arrowContainer}
                >
                  <Text style={[
                    styles.arrowText,
                    screenDimensions.isSmallScreen && styles.arrowTextSmall,
                    screenDimensions.isLargeScreen && styles.arrowTextLarge,
                  ]}>
                    📅
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.statusSection}>
                <Text style={[
                  styles.statusLabel,
                  screenDimensions.isSmallScreen && styles.statusLabelSmall,
                  screenDimensions.isLargeScreen && styles.statusLabelLarge,
                ]}>
                  Board Due Date
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: isOverdue ? '#991B1B' : isDueSoon ? '#92400E' : '#4B5563' },
                ]}>
                  <Text style={[
                    styles.statusText,
                    screenDimensions.isSmallScreen && styles.statusTextSmall,
                    screenDimensions.isLargeScreen && styles.statusTextLarge,
                  ]}>
                    {formatDate(item.medical_board_due_date)}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.awardedCategorySection}>
              <Text style={[
                styles.awardedLabel,
                screenDimensions.isSmallScreen && styles.awardedLabelSmall,
                screenDimensions.isLargeScreen && styles.awardedLabelLarge,
              ]}>
                Category Allotment Dates:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categoryDates.length > 0 ? categoryDates.map((date, idx) => (
                  <LinearGradient
                    key={idx}
                    colors={['#581C87', '#7C3AED']}
                    style={[styles.awardedBadge, { marginRight: 8, marginBottom: 4 }]}
                  >
                    <Text style={[
                      styles.awardedText,
                      screenDimensions.isSmallScreen && styles.awardedTextSmall,
                      screenDimensions.isLargeScreen && styles.awardedTextLarge,
                    ]}>
                      {date}
                    </Text>
                  </LinearGradient>
                )) : (
                  <LinearGradient
                    colors={['#6B7280', '#9CA3AF']}
                    style={styles.awardedBadge}
                  >
                    <Text style={[
                      styles.awardedText,
                      screenDimensions.isSmallScreen && styles.awardedTextSmall,
                      screenDimensions.isLargeScreen && styles.awardedTextLarge,
                    ]}>
                      No dates recorded
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={[
              styles.detailsGrid,
              screenDimensions.isSmallScreen && styles.detailsGridSmall,
              screenDimensions.isLargeScreen && styles.detailsGridLarge
            ]}>
              {[
                { icon: '🩺', label: 'Disease/Reason', value: item.disease_reason || '-', gradient: ['#991B1B', '#B91C1C'] },
                { icon: '📅', label: 'Last Board Date', value: formatDate(item.last_medical_board_date), gradient: ['#4B5563', '#6B7280'] },
                { icon: '⏰', label: 'Due Date', value: formatDate(item.medical_board_due_date), gradient: ['#92400E', '#A16207'] },
                { icon: '📊', label: 'Status', value: item.status || '-', gradient: [getStatusColor(item.status), `${getStatusColor(item.status)}CC`] },
                { icon: '🏥', label: 'Medical Cat', value: item.medical_category || '-', gradient: [getCategoryColor(item.medical_category), `${getCategoryColor(item.medical_category)}CC`] },
                { icon: '🆔', label: 'Personnel ID', value: item.personnel_id || '-', gradient: ['#1F2937', '#374151'] },
                { icon: '📋', label: 'Serial No', value: item.serial_no?.toString() || '-', gradient: ['#166534', '#15803D'] },
                { icon: '🔄', label: 'Updated', value: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-', gradient: ['#581C87', '#7C3AED'] },
              ].map((detail, index) => (
                <LinearGradient
                  key={index}
                  colors={detail.gradient as [string, string, ...string[]]}
                  style={[
                    styles.detailCard,
                    screenDimensions.isSmallScreen && styles.detailCardSmall,
                    screenDimensions.isLargeScreen && styles.detailCardLarge
                  ]}
                >
                  <Text style={[
                    styles.detailIcon,
                    screenDimensions.isSmallScreen && styles.detailIconSmall,
                    screenDimensions.isLargeScreen && styles.detailIconLarge
                  ]}>{detail.icon}</Text>
                  <Text style={[
                    styles.detailLabel,
                    screenDimensions.isSmallScreen && styles.detailLabelSmall,
                    screenDimensions.isLargeScreen && styles.detailLabelLarge
                  ]}>{detail.label}</Text>
                  <Text style={[
                    styles.detailValue,
                    screenDimensions.isSmallScreen && styles.detailValueSmall,
                    screenDimensions.isLargeScreen && styles.detailValueLarge
                  ]}>{detail.value}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>

          <View style={styles.recordFooter}>
              <LinearGradient
                  colors={['#E5E7EB', '#D1D5DB']}
                  style={[styles.footerDivider, { height: 2, marginVertical: 16 }]}
              />
              
              <LinearGradient
                  colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
                  style={[
                  styles.remarksContainer,
                  {
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                  }
                  ]}
              >
                  <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: 16 
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LinearGradient
                      colors={['#1F2937', '#374151']}
                      style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                      }}
                      >
                      <Text style={{ fontSize: 16 }}>📝</Text>
                      </LinearGradient>
                      <Text style={[
                      styles.footerLabel,
                      screenDimensions.isSmallScreen && styles.footerLabelSmall,
                      screenDimensions.isLargeScreen && styles.footerLabelLarge,
                      { 
                          fontWeight: '700',
                          color: '#1F2937',
                          fontSize: screenDimensions.isSmallScreen ? 16 : screenDimensions.isLargeScreen ? 20 : 18,
                      },
                      ]}>
                      Medical Remarks
                      </Text>
                  </View>
                  
                  <TouchableOpacity
                      onPress={() => {
                      if (editingRemarks[item.id?.toString() || '']) {
                          handleRemarksEdit(item.id?.toString() || '', tempRemarks[item.id?.toString() || ''] || item.remarks || '');
                      } else {
                          setEditingRemarks(prev => ({ ...prev, [item.id?.toString() || '']: true }));
                          setTempRemarks(prev => ({ ...prev, [item.id?.toString() || '']: item.remarks || '' }));
                      }
                      }}
                      style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                      }}
                  >
                      <LinearGradient
                      colors={editingRemarks[item.id?.toString() || ''] ? ['#166534', '#15803D', '#22C55E'] : ['#92400E', '#A16207', '#D97706']}
                      style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                      }}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      >
                      <Text style={{ 
                          color: '#FFFFFF', 
                          fontSize: 13, 
                          fontWeight: '600',
                          marginRight: 6,
                      }}>
                          {editingRemarks[item.id?.toString() || ''] ? 'Save' : 'Edit'}
                      </Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 14 }}>
                          {editingRemarks[item.id?.toString() || ''] ? '💾' : '✏️'}
                      </Text>
                      </LinearGradient>
                  </TouchableOpacity>
                  </View>
                  
                  {editingRemarks[item.id?.toString() || ''] ? (
                  <View style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: '#166534',
                      shadowColor: '#166534',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                  }}>
                      <TextInput
                      style={[
                          styles.footerValue,
                          screenDimensions.isSmallScreen && styles.footerValueSmall,
                          screenDimensions.isLargeScreen && styles.footerValueLarge,
                          {
                          padding: 16,
                          minHeight: 100,
                          maxHeight: 200,
                          textAlignVertical: 'top',
                          color: '#1F2937',
                          fontSize: screenDimensions.isSmallScreen ? 14 : screenDimensions.isLargeScreen ? 18 : 16,
                          lineHeight: 24,
                          fontWeight: '500',
                          },
                      ]}
                      value={tempRemarks[item.id?.toString() || ''] || ''}
                      onChangeText={(text) => setTempRemarks(prev => ({ ...prev, [item.id?.toString() || '']: text }))}
                      placeholder="Enter detailed medical remarks, observations, or recommendations..."
                      multiline
                      numberOfLines={6}
                      placeholderTextColor="#9CA3AF"
                      selectionColor="#166534"
                      />
                  </View>
                  ) : (
                  <View style={{
                      backgroundColor: item.remarks && item.remarks !== '-' ? '#F0FDF4' : '#F9FAFB',
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: item.remarks && item.remarks !== '-' ? '#D1FAE5' : '#E5E7EB',
                      minHeight: 80,
                  }}>
                      <Text style={[
                      styles.footerValue,
                      screenDimensions.isSmallScreen && styles.footerValueSmall,
                      screenDimensions.isLargeScreen && styles.footerValueLarge,
                      { 
                          textAlign: 'left',
                          color: item.remarks && item.remarks !== '-' ? '#1F2937' : '#9CA3AF',
                          fontSize: screenDimensions.isSmallScreen ? 14 : screenDimensions.isLargeScreen ? 18 : 16,
                          lineHeight: 24,
                          fontWeight: item.remarks && item.remarks !== '-' ? '500' : '400',
                          fontStyle: item.remarks && item.remarks !== '-' ? 'normal' : 'italic',
                      },
                      ]}>
                      {item.remarks && item.remarks !== '-' ? item.remarks : 'No medical remarks recorded yet. Click Edit to add observations, treatment notes, or recommendations.'}
                      </Text>
                  </View>
                  )}
              </LinearGradient>
              </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View style={[
      styles.emptyContainer,
      {
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
        opacity: fadeAnim,
      },
    ]}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={styles.emptyGradient}
      >
        <Animated.View style={[
          styles.emptyIconContainer,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
              { scale: pulseAnim },
            ],
          },
        ]}>
          <Text style={styles.emptyIcon}>🏥</Text>
        </Animated.View>
        
        <Text style={styles.emptyTitle}>No LMC Records Found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? 'Try adjusting your search criteria' : 'No Low Medical Category records available'}
        </Text>
        
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => {
            setSearchQuery('');
            loadLMCRecords();
          }}
        >
          <LinearGradient
            colors={['#1F2937', '#374151', '#4B5563']}
            style={styles.emptyButtonGradient}
          >
            <Text style={styles.emptyButtonText}>
              {searchQuery ? 'Clear Search' : 'Refresh'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      <LinearGradient
        colors={['#1F2937', '#374151', '#4B5563']}
        style={styles.header}
      >
        <Animated.View style={[
          styles.headerContent,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            opacity: fadeAnim,
          },
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('DashboardDoctor')}
          >
            <LinearGradient
              colors={['#374151', '#4B5563']}
              style={styles.backButtonGradient}
            >
              <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Animated.Text style={[
              styles.headerTitle,
              {
                transform: [
                  {
                    translateY: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}>
              LMC Statistics
            </Animated.Text>
            <Text style={styles.headerSubtitle}>
              Low Medical Category Records
            </Text>
          </View>
          
          <Animated.View style={[
            styles.headerStats,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}>
            <LinearGradient
              colors={['#166534', '#15803D']}
              style={styles.statsContainer}
            >
              <Text style={styles.statsNumber}>{filteredRecords.length}</Text>
              <Text style={styles.statsLabel}>Records</Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </LinearGradient>

      <Animated.View style={[
        styles.searchContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}>
        <LinearGradient
          colors={['#F8FAFC', '#F1F5F9']}
          style={styles.searchGradient}
        >
          <View style={styles.searchInputContainer}>
            <Icon name="magnify" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, ID, rank, category, disease..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Icon name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[
        styles.listContainer,
        {
          opacity: fadeAnim,
        },
      ]}>
        <FlatList
          data={filteredRecords}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: screenDimensions.isSmallScreen ? 400 : screenDimensions.isLargeScreen ? 600 : 500,
            offset: (screenDimensions.isSmallScreen ? 400 : screenDimensions.isLargeScreen ? 600 : 500) * index,
            index,
          })}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 4,
  },
  headerStats: {
    marginLeft: 16,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchGradient: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recordItem: {
    marginBottom: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  recordItemSmall: {
    marginBottom: 16,
    borderRadius: 16,
  },
  recordItemLarge: {
    marginBottom: 24,
    borderRadius: 24,
  },
  recordItemXLarge: {
    marginBottom: 28,
    borderRadius: 28,
  },
  recordGradient: {
    borderRadius: 20,
    padding: 20,
  },
  recordGradientSmall: {
    borderRadius: 16,
    padding: 16,
  },
  recordGradientLarge: {
    borderRadius: 24,
    padding: 24,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordHeaderSmall: {
    marginBottom: 16,
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  profileCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileCircleLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInitialSmall: {
    fontSize: 16,
  },
  profileInitialLarge: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  recordTitleSmall: {
    fontSize: 16,
  },
  recordTitleLarge: {
    fontSize: 20,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  recordSubtitleSmall: {
    fontSize: 12,
  },
  recordSubtitleLarge: {
    fontSize: 16,
  },
  recordHeaderRight: {
    alignItems: 'flex-end',
  },
  serialBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  serialText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  serialTextLarge: {
    fontSize: 14,
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  rankText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  rankTextLarge: {
    fontSize: 14,
  },
  quickInfoPills: {
    marginBottom: 20,
  },
  quickInfoPillsSmall: {
    marginBottom: 16,
  },
  infoPill: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoPillSmall: {
    borderRadius: 10,
    padding: 10,
  },
  infoPillLarge: {
    borderRadius: 14,
    padding: 14,
  },
  pillIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  pillIconSmall: {
    fontSize: 14,
  },
  pillIconLarge: {
    fontSize: 18,
  },
  pillLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
    textAlign: 'center',
  },
  pillLabelSmall: {
    fontSize: 9,
  },
  pillLabelLarge: {
    fontSize: 11,
  },
  pillValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pillValueSmall: {
    fontSize: 11,
  },
  pillValueLarge: {
    fontSize: 13,
  },
  medicalStatusContainer: {
    marginBottom: 20,
  },
  medicalStatusBar: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  medicalStatusBarSmall: {
    borderRadius: 12,
    padding: 12,
  },
  medicalStatusBarLarge: {
    borderRadius: 18,
    padding: 18,
  },
  statusSection: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  statusLabelSmall: {
    fontSize: 10,
  },
  statusLabelLarge: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusTextSmall: {
    fontSize: 10,
  },
  statusTextLarge: {
    fontSize: 14,
  },
  statusArrow: {
    marginHorizontal: 20,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  arrowText: {
    fontSize: 16,
  },
  arrowTextSmall: {
    fontSize: 14,
  },
  arrowTextLarge: {
    fontSize: 18,
  },
  awardedCategorySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  awardedLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 12,
  },
  awardedLabelSmall: {
    fontSize: 12,
  },
  awardedLabelLarge: {
    fontSize: 16,
  },
  awardedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  awardedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  awardedTextSmall: {
    fontSize: 10,
  },
  awardedTextLarge: {
    fontSize: 14,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailsGridSmall: {
    marginBottom: 16,
  },
  detailsGridLarge: {
    marginBottom: 24,
  },
  detailCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailCardSmall: {
    borderRadius: 10,
    padding: 10,
  },
  detailCardLarge: {
    borderRadius: 14,
    padding: 14,
  },
  detailIcon: {
    fontSize: 16,
    marginBottom: 6,
  },
  detailIconSmall: {
    fontSize: 14,
  },
  detailIconLarge: {
    fontSize: 18,
  },
  detailLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
    textAlign: 'center',
  },
  detailLabelSmall: {
    fontSize: 9,
  },
  detailLabelLarge: {
    fontSize: 11,
  },
  detailValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailValueSmall: {
    fontSize: 11,
  },
  detailValueLarge: {
    fontSize: 13,
  },
  recordFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  footerDivider: {
    borderRadius: 1,
  },
  remarksContainer: {
  },
  footerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  footerLabelSmall: {
    fontSize: 14,
  },
  footerLabelLarge: {
    fontSize: 18,
  },
  footerValue: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  footerValueSmall: {
    fontSize: 12,
  },
  footerValueLarge: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyGradient: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});