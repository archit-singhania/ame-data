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
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  
  const [editingRemarks, setEditingRemarks] = useState<{[key: string]: boolean}>({});
  const [tempRemarks, setTempRemarks] = useState<{[key: string]: string}>({});

  const handleRemarksEdit = (recordId: string, newRemarks: string) => {
    updateLowMedicalRecord(parseInt(recordId), { remarks: newRemarks });
    
    const updatedRecords = lmcRecords.map(record => 
      record.id?.toString() === recordId ? { ...record, remarks: newRemarks } : record
    );
    const sortedUpdatedRecords = sortRecordsBySerialNo(updatedRecords);
    setLmcRecords(sortedUpdatedRecords);
    
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
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 2000,
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
      const sortedFiltered = sortRecordsBySerialNo(filtered);
      setFilteredRecords(sortedFiltered);
    }
  }, [searchQuery, lmcRecords]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setScreenDimensions(getScreenDimensions());
    });
    
    return () => subscription?.remove();
  }, []);

  const sortRecordsBySerialNo = (records: LowMedicalRecord[]) => {
    return records.sort((a, b) => {
      const serialA = a.serial_no || 0;
      const serialB = b.serial_no || 0;
      return serialA - serialB;
    });
  };

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
      const sortedRecords = sortRecordsBySerialNo(records);
      setLmcRecords(sortedRecords);
    } catch (error) {
      console.error('Error loading LMC records:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    if (!category || category === '-') return ['#64748B', '#94A3B8'];
    
    switch (category?.toLowerCase()) {
      case 'a1': return ['#059669', '#10B981', '#34D399'];
      case 'a2': return ['#0891B2', '#06B6D4', '#22D3EE'];
      case 'b1': return ['#D97706', '#F59E0B', '#FCD34D'];
      case 'b2': return ['#EA580C', '#F97316', '#FB923C'];
      case 'c1': return ['#DC2626', '#EF4444', '#F87171'];
      case 'c2': return ['#BE185D', '#EC4899', '#F472B6'];
      case 'temp': return ['#7C3AED', '#A855F7', '#C084FC'];
      default: return ['#64748B', '#94A3B8'];
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    return dateString;
  };

  const renderRecordItem = ({ item, index }: { item: LowMedicalRecord; index: number }) => {
    const categoryDates = parseCategoryAllotmentDates(item.category_allotment_date);

    return (
      <LinearGradient
        colors={['#DC2626', '#EF4444', '#F87171']}
        style={styles.recordItemWrapper}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
                  outputRange: [0.85, 1],
                })
              }],
              opacity: fadeAnim
            }
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F0FDF9', '#ECFDF5']} 
            style={[
              styles.recordGradient,
              screenDimensions.isSmallScreen && styles.recordGradientSmall,
              screenDimensions.isLargeScreen && styles.recordGradientLarge
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={[
              styles.shineOverlay,
              {
                opacity: shineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1],
                }),
              }
            ]} />

            <View style={[
              styles.recordHeader,
              screenDimensions.isSmallScreen && styles.recordHeaderSmall
            ]}>
              <View style={styles.recordHeaderLeft}>
                <Animated.View
                  style={[
                    {
                      transform: [{ scale: pulseAnim }],
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['#0E7490', '#0891B2', '#06B6D4']} 
                    style={[
                      styles.profileCircle,
                      screenDimensions.isSmallScreen && styles.profileCircleSmall,
                      screenDimensions.isLargeScreen && styles.profileCircleLarge
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[
                      styles.profileInitial,
                      screenDimensions.isSmallScreen && styles.profileInitialSmall,
                      screenDimensions.isLargeScreen && styles.profileInitialLarge
                    ]}>
                      {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                    <Animated.View style={[
                      styles.profileHalo,
                      {
                        opacity: sparkleAnim,
                        transform: [{ scale: sparkleAnim }],
                      }
                    ]} />
                  </LinearGradient>
                </Animated.View>
                <View style={styles.headerInfo}>
                  <Text style={[
                    styles.recordTitle,
                    screenDimensions.isSmallScreen && styles.recordTitleSmall,
                    screenDimensions.isLargeScreen && styles.recordTitleLarge
                  ]}>{item.name || 'Unknown'}</Text>
                  <View style={styles.idContainer}>
                    <LinearGradient
                      colors={['#0f0c29', '#302b63', '#24243e']}
                      style={styles.idBadge}
                    >
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
                    </LinearGradient>
                  </View>
                </View>
              </View>
              <View style={styles.recordHeaderRight}>
                <LinearGradient
                  colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
                  style={styles.serialBadge}
                >
                  <Text style={[
                    styles.serialText,
                    screenDimensions.isLargeScreen && styles.serialTextLarge
                  ]}>#{item.serial_no || '-'}</Text>
                </LinearGradient>
                <LinearGradient
                  colors={['#5f2c82', '#49a09d', '#3f2b96']}
                  style={styles.rankBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[
                    styles.rankText,
                    screenDimensions.isLargeScreen && styles.rankTextLarge
                  ]}>{item.rank || '-'}</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.medicalStatusContainer}>
              <View style={styles.awardedCategorySection}>
                <View style={styles.categoryHeader}>
                  <LinearGradient
                    colors={['#FFD700', '#B8860B', '#000000']}
                    style={styles.categoryIconContainer}
                  >
                    <Text style={styles.categoryIcon}>📊</Text>
                  </LinearGradient>
                  <Text style={[
                    styles.awardedLabel,
                    screenDimensions.isSmallScreen && styles.awardedLabelSmall,
                    screenDimensions.isLargeScreen && styles.awardedLabelLarge,
                  ]}>
                    Category Allotment Dates
                  </Text>
                </View>
                <View style={styles.datesContainer}>
                  {categoryDates.length > 0 ? categoryDates.map((date, idx) => (
                    <LinearGradient
                      key={idx}
                      colors={['#FFD700', '#B8860B', '#000000']}
                      style={[styles.awardedBadge, styles.modernBadge]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
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
                      colors={['#64748B', '#94A3B8', '#CBD5E1']}
                      style={[styles.awardedBadge, styles.modernBadge]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
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
                  { icon: '🩺', label: 'Disease/Reason', value: item.disease_reason || '-', gradient: ['#DC2626', '#EF4444', '#F87171'] },
                  { icon: '📅', label: 'Last Board Date', value: formatDate(item.last_medical_board_date), gradient: ['#FF0080', '#7928CA', '#2E1A47'] },
                  { icon: '⏰', label: 'Due Date', value: formatDate(item.medical_board_due_date), gradient: ['#00F260', '#0575E6', '#021B79'] },
                  { icon: '🏥', label: 'Medical Category', value: item.medical_category || '-', gradient: ['#C2410C', '#EA580C', '#F97316'] },
                ].map((detail, detailIndex) => (
                  <LinearGradient
                    key={detailIndex}
                    colors={detail.gradient as [string, string, string]}
                    style={[
                      styles.detailCard,
                      styles.modernCard,
                      screenDimensions.isSmallScreen && styles.detailCardSmall,
                      screenDimensions.isLargeScreen && styles.detailCardLarge
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardContent}>
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
                    </View>
                    <View style={styles.cardGlow} />
                  </LinearGradient>
                ))}
              </View>
            </View>

            <View style={styles.recordFooter}>
                <LinearGradient
                    colors={['#E2E8F0', '#CBD5E1', '#94A3B8']}
                    style={[styles.footerDivider, { height: 3, marginVertical: 20 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
                
                <LinearGradient
                    colors={['#FAFBFC', '#F8FAFC', '#F1F5F9']}
                    style={[
                    styles.remarksContainer,
                    {
                        borderRadius: 20,
                        padding: 24,
                        marginBottom: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.12,
                        shadowRadius: 16,
                        elevation: 8,
                    }
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: 18 
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <LinearGradient
                        colors={['#6366F1', '#8B5CF6', '#A855F7']}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        >
                        <Text style={{ fontSize: 18 }}>📝</Text>
                        </LinearGradient>
                        <Text style={[
                        styles.footerLabel,
                        screenDimensions.isSmallScreen && styles.footerLabelSmall,
                        screenDimensions.isLargeScreen && styles.footerLabelLarge,
                        { 
                            fontWeight: '800',
                            color: '#1E293B',
                            fontSize: screenDimensions.isSmallScreen ? 17 : screenDimensions.isLargeScreen ? 21 : 19,
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
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 6,
                        }}
                    >
                        <LinearGradient
                        colors={editingRemarks[item.id?.toString() || ''] ? ['#059669', '#10B981', '#34D399'] : ['#3a1c71', '#A7BAC9', '#666']}
                        style={{
                            paddingHorizontal: 18,
                            paddingVertical: 12,
                            borderRadius: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        >
                        <Text style={{ 
                            color: '#FFFFFF', 
                            fontSize: 14, 
                            fontWeight: '700',
                            marginRight: 8,
                        }}>
                            {editingRemarks[item.id?.toString() || ''] ? 'Save' : 'Edit'}
                        </Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                            {editingRemarks[item.id?.toString() || ''] ? '💾' : '✏️'}
                        </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    </View>
                    
                    {editingRemarks[item.id?.toString() || ''] ? (
                    <LinearGradient
                        colors={['#FFFFFF', '#FEFEFE']}
                        style={{
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: '#10B981',
                        shadowColor: '#059669',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 4,
                        }}
                    >
                        <TextInput
                        style={[
                            styles.footerValue,
                            screenDimensions.isSmallScreen && styles.footerValueSmall,
                            screenDimensions.isLargeScreen && styles.footerValueLarge,
                            {
                            padding: 20,
                            minHeight: 120,
                            maxHeight: 220,
                            textAlignVertical: 'top',
                            color: '#1E293B',
                            fontSize: screenDimensions.isSmallScreen ? 15 : screenDimensions.isLargeScreen ? 19 : 17,
                            lineHeight: 26,
                            fontWeight: '500',
                            },
                        ]}
                        value={tempRemarks[item.id?.toString() || ''] || ''}
                        onChangeText={(text) => setTempRemarks(prev => ({ ...prev, [item.id?.toString() || '']: text }))}
                        placeholder="Enter detailed medical remarks, observations, or recommendations..."
                        multiline
                        numberOfLines={6}
                        placeholderTextColor="#94A3B8"
                        selectionColor="#10B981"
                        />
                    </LinearGradient>
                    ) : (
                    <LinearGradient
                        colors={item.remarks && item.remarks !== '-' ? ['#F0FDF4', '#ECFDF5'] : ['#F8FAFC', '#F1F5F9']}
                        style={{
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 2,
                        borderColor: item.remarks && item.remarks !== '-' ? '#A7F3D0' : '#E2E8F0',
                        minHeight: 100,
                        }}
                    >
                        <Text style={[
                        styles.footerValue,
                        screenDimensions.isSmallScreen && styles.footerValueSmall,
                        screenDimensions.isLargeScreen && styles.footerValueLarge,
                        { 
                            textAlign: 'left',
                            color: item.remarks && item.remarks !== '-' ? '#1E293B' : '#94A3B8',
                            fontSize: screenDimensions.isSmallScreen ? 15 : screenDimensions.isLargeScreen ? 19 : 17,
                            lineHeight: 26,
                            fontWeight: item.remarks && item.remarks !== '-' ? '500' : '400',
                            fontStyle: item.remarks && item.remarks !== '-' ? 'normal' : 'italic',
                        },
                        ]}>
                        {item.remarks && item.remarks !== '-' ? item.remarks : 'No medical remarks recorded yet. Click Edit to add observations, treatment notes, or recommendations.'}
                        </Text>
                    </LinearGradient>
                    )}
                </LinearGradient>
                </View>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
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
        colors={['#FFFFFF', '#FEFEFE', '#FDFDFD']}
        style={styles.emptyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[
          styles.floatingIcon,
          {
            transform: [{
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -8],
              })
            }, {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            }],
          }
        ]}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#A855F7']}
            style={styles.iconContainer}
          >
            <Text style={styles.emptyIcon}>🏥</Text>
          </LinearGradient>
        </Animated.View>
        
        <Text style={[
          styles.emptyTitle,
          screenDimensions.isSmallScreen && styles.emptyTitleSmall,
          screenDimensions.isLargeScreen && styles.emptyTitleLarge
        ]}>
          No LMC Records Found
        </Text>
        
        <Text style={[
          styles.emptyMessage,
          screenDimensions.isSmallScreen && styles.emptyMessageSmall,
          screenDimensions.isLargeScreen && styles.emptyMessageLarge
        ]}>
          {searchQuery ? 
            `No records match "${searchQuery}". Try adjusting your search terms.` :
            'No Low Medical Category records have been added yet.'
          }
        </Text>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={['#DC2626', '#EF4444', '#F87171', '#FCA5A5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <LinearGradient
        colors={['#FEF2F2', '#FEE2E2', '#FECACA', '#F87171']}
        style={styles.headerContainer}
      >
        <Animated.View style={[
          styles.headerContent,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }
        ]}>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('DashboardDoctor')}
            style={styles.backButton}
          >
            <LinearGradient
              colors={['#F8FAFC', '#E2E8F0']}
              style={styles.backButtonGradient}
            >
              <Icon name="arrow-left" size={24} color="#1E293B" />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={[
              styles.headerTitle,
              screenDimensions.isSmallScreen && styles.headerTitleSmall,
              screenDimensions.isLargeScreen && styles.headerTitleLarge
            ]}>
              Low Medical Category Overview 
            </Text>
            <Text style={[
              styles.headerSubtitle,
              screenDimensions.isSmallScreen && styles.headerSubtitleSmall,
              screenDimensions.isLargeScreen && styles.headerSubtitleLarge
            ]}>
              {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[
          styles.searchContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          }
        ]}>
          <LinearGradient
            colors={['#FFFFFF', '#FEFEFE']}
            style={styles.searchGradient}
          >
            <Icon name="magnify" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={[
                styles.searchInput,
                screenDimensions.isSmallScreen && styles.searchInputSmall,
                screenDimensions.isLargeScreen && styles.searchInputLarge
              ]}
              placeholder="Search by name, ID, rank, category..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>
      </LinearGradient>

      <FlatList
        data={filteredRecords}
        renderItem={renderRecordItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        style={styles.listContainer}
        contentContainerStyle={[
          styles.listContent,
          filteredRecords.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  recordItemWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 8,
    width: '80%',
    alignSelf: 'center',
    borderRadius: 28,
    padding: 4, 
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
    width: '100%',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center', 
  },
  headerTitle: {
    fontSize: 32, 
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerTitleSmall: { 
    fontSize: 28 
  },
  headerTitleLarge: { 
    fontSize: 36 
  },
  headerSubtitle: {
    fontSize: 18, 
    color: '#3B82F6', 
    fontWeight: '600', 
    textAlign: 'center',
  },
  headerSubtitleSmall: { 
    fontSize: 16
  },
  headerSubtitleLarge: { 
    fontSize: 20 
  },
  searchContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    width: '80%', 
    alignSelf: 'center', 
  },
  backButton: {
    position: 'absolute', 
    left: 0,
    zIndex: 10, 
  },
  listContent: {
    padding: 20,
    alignItems: 'center', 
  },
  medicalStatusContainer: {
    marginBottom: 20,
    alignItems: 'center', 
  },
  awardedCategorySection: {
    marginBottom: 16,
    alignItems: 'center', 
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center', 
  },
  recordItem: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  detailCard: {
    flex: 1,
    width: '48%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'center', 
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center', 
  },
  emptyGradient: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '80%', 
    alignSelf: 'center', 
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  searchInputSmall: { fontSize: 14 },
  searchInputLarge: { fontSize: 18 },
  listContainer: {
    flex: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  itemSeparator: {
    height: 16,
  },
  recordItemSmall: {
    marginBottom: 6,
  },
  recordItemLarge: {
    marginBottom: 12,
  },
  recordItemXLarge: {
    marginBottom: 16,
  },
  recordGradient: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  recordGradientSmall: {
    borderRadius: 20,
    padding: 18,
  },
  recordGradientLarge: {
    borderRadius: 28,
    padding: 28,
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordHeaderSmall: {
    marginBottom: 18,
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  profileCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileCircleSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  profileCircleLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 20,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInitialSmall: { fontSize: 20 },
  profileInitialLarge: { fontSize: 28 },
  profileHalo: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  headerInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  recordTitleSmall: { fontSize: 18 },
  recordTitleLarge: { fontSize: 24 },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recordSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  recordSubtitleSmall: { fontSize: 12 },
  recordSubtitleLarge: { fontSize: 16 },
  serialBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  serialText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  serialTextLarge: { fontSize: 16 },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rankTextLarge: { fontSize: 16 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 16,
  },
  awardedLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  awardedLabelSmall: { fontSize: 14 },
  awardedLabelLarge: { fontSize: 18 },
  awardedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modernBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  awardedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  awardedTextSmall: { fontSize: 12 },
  awardedTextLarge: { fontSize: 16 },
  detailsContainer: {
    marginBottom: 20,
  },
  detailsGridSmall: {
    gap: 8,
  },
  detailsGridLarge: {
    gap: 16,
  },
  detailCardSmall: {
    borderRadius: 12,
    minWidth: '48%',
  },
  detailCardLarge: {
    borderRadius: 20,
    minWidth: '42%',
  },
  modernCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContent: {
    padding: 16,
    alignItems: 'center',
    zIndex: 2,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  detailIconSmall: { fontSize: 20 },
  detailIconLarge: { fontSize: 28 },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
    textAlign: 'center',
  },
  detailLabelSmall: { fontSize: 10 },
  detailLabelLarge: { fontSize: 14 },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  detailValueSmall: { fontSize: 12 },
  detailValueLarge: { fontSize: 16 },
  recordFooter: {
    marginTop: 8,
  },
  footerDivider: {
    borderRadius: 2,
  },
  remarksContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  footerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  footerLabelSmall: { fontSize: 14 },
  footerLabelLarge: { fontSize: 18 },
  footerValue: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 24,
  },
  footerValueSmall: { fontSize: 14 },
  footerValueLarge: { fontSize: 18 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  floatingIcon: {
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyTitleSmall: { fontSize: 20 },
  emptyTitleLarge: { fontSize: 28 },
  emptyMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyMessageSmall: { fontSize: 14 },
  emptyMessageLarge: { fontSize: 18 },
  addButton: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});