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
import { getAMERecords, createAMETable, updateAMERemarks } from '../utils/sqlite';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export default function AMEStatViewer() {
  const [ameRecords, setAMERecords] = useState<any[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [editingRemarks, setEditingRemarks] = useState<{[key: string]: boolean}>({});
  const [tempRemarks, setTempRemarks] = useState<{[key: string]: string}>({});

  const handleRemarksEdit = (recordId: string, newRemarks: string) => {
    updateAMERemarks(recordId, newRemarks);
    
    const updatedRecords = ameRecords.map(record => 
        record.id === recordId ? { ...record, remarks: newRemarks } : record
    );
    setAMERecords(updatedRecords);
    
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
        setFilteredRecords(ameRecords);
    } else {
        const filtered = ameRecords.filter(record => 
        record.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.personnel_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.rank?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredRecords(filtered);
    }
    }, [searchQuery, ameRecords]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setScreenDimensions(getScreenDimensions());
    });
    
    return () => subscription?.remove();
  }, []);

  const initializeData = async () => {
    try {
      await createAMETable();
      await loadAMERecords();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const loadAMERecords = async () => {
    try {
      const records = await getAMERecords();
      setAMERecords(records);
    } catch (error) {
      console.error('Error loading AME records:', error);
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

  const getBMITextColor = (bmi: string) => {
    if (!bmi || bmi === '-') return '#6B7280';
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return '#6B7280';
    
    if (bmiValue < 18.5) return '#92400E';
    if (bmiValue < 25) return '#166534';
    if (bmiValue < 30) return '#B45309';
    return '#991B1B';
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

  const renderRecordItem = ({ item, index }: { item: any; index: number }) => (
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
                {item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}
              </Text>
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={[
                styles.recordTitle,
                screenDimensions.isSmallScreen && styles.recordTitleSmall,
                screenDimensions.isLargeScreen && styles.recordTitleLarge
              ]}>{item.full_name || 'Unknown'}</Text>
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
              ]}>#{item.s_no || '-'}</Text>
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
            { icon: '🏢', label: 'Coy', value: item.unit || '-', gradient: ['#1F2937', '#374151'] },
            { icon: '🎂', label: 'Age', value: item.age || '-', gradient: ['#4B5563', '#6B7280'] },
            { icon: '🩸', label: 'Blood Group', value: item.blood_group || '-', gradient: ['#166534', '#15803D'] },
            { icon: '⚖️', label: 'BMI', value: item.bmi || '-', isBMI: true, gradient: ['#92400E', '#A16207'] },
          ].map(({ icon, label, value, isBMI, gradient }, index) => (
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
                isBMI && { color: getBMITextColor(item.bmi) },
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
                Previous Medical Category
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getCategoryColor(item.previous_medical_category) },
              ]}>
                <Text style={[
                  styles.statusText,
                  screenDimensions.isSmallScreen && styles.statusTextSmall,
                  screenDimensions.isLargeScreen && styles.statusTextLarge,
                ]}>
                  {item.previous_medical_category || '-'}
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
                  →
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.statusSection}>
              <Text style={[
                styles.statusLabel,
                screenDimensions.isSmallScreen && styles.statusLabelSmall,
                screenDimensions.isLargeScreen && styles.statusLabelLarge,
              ]}>
                Present Category Awarded
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getCategoryColor(item.present_category) },
              ]}>
                <Text style={[
                  styles.statusText,
                  screenDimensions.isSmallScreen && styles.statusTextSmall,
                  screenDimensions.isLargeScreen && styles.statusTextLarge,
                ]}>
                  {item.present_category || '-'}
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
              Category Reason:
            </Text>
            <LinearGradient
              colors={[getCategoryColor(item.awarded_category), `${getCategoryColor(item.awarded_category)}CC`]}
              style={styles.awardedBadge}
            >
              <Text style={[
                styles.awardedText,
                screenDimensions.isSmallScreen && styles.awardedTextSmall,
                screenDimensions.isLargeScreen && styles.awardedTextLarge,
              ]}>
                {item.awarded_category || '-'}
              </Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={[
            styles.detailsGrid,
            screenDimensions.isSmallScreen && styles.detailsGridSmall,
            screenDimensions.isLargeScreen && styles.detailsGridLarge
          ]}>
            {[
              { icon: '📏', label: 'Height', value: item.height ? `${item.height}cm` : '-', gradient: ['#1F2937', '#374151'] },
              { icon: '⚖️', label: 'Weight', value: item.weight ? `${item.weight}kg` : '-', gradient: ['#4B5563', '#6B7280'] },
              { icon: '📐', label: 'Chest', value: item.chest ? `${item.chest}cm` : '-', gradient: ['#166534', '#15803D'] },
              { icon: '📊', label: 'W/H Ratio', value: item.waist_hip_ratio || '-', gradient: ['#92400E', '#A16207'] },
              { icon: '💓', label: 'Pulse', value: item.pulse ? `${item.pulse} bpm` : '-', gradient: ['#991B1B', '#B91C1C'] },
              { icon: '🩸', label: 'BP', value: item.blood_pressure || '-', gradient: ['#581C87', '#7C3AED'] },
              { icon: '👁️', label: 'Vision', value: item.vision || '-', gradient: ['#1F2937', '#374151'] },
              { icon: '📅', label: 'AME Date', value: item.date_of_ame || '-', gradient: ['#4B5563', '#6B7280'] },
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
                    if (editingRemarks[item.id]) {
                        handleRemarksEdit(item.id, tempRemarks[item.id] || item.remarks || '');
                    } else {
                        setEditingRemarks(prev => ({ ...prev, [item.id]: true }));
                        setTempRemarks(prev => ({ ...prev, [item.id]: item.remarks || '' }));
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
                    colors={editingRemarks[item.id] ? ['#166534', '#15803D', '#22C55E'] : ['#92400E', '#A16207', '#D97706']}
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
                        {editingRemarks[item.id] ? 'Save' : 'Edit'}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14 }}>
                        {editingRemarks[item.id] ? '💾' : '✏️'}
                    </Text>
                    </LinearGradient>
                </TouchableOpacity>
                </View>
                
                {editingRemarks[item.id] ? (
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
                    value={tempRemarks[item.id] || ''}
                    onChangeText={(text) => setTempRemarks(prev => ({ ...prev, [item.id]: text }))}
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
                    {item.remarks && item.remarks !== '-' ? item.remarks : 'No medical remarks recorded'}
                    </Text>
                    
                    {(!item.remarks || item.remarks === '-') && (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 8,
                        opacity: 0.7,
                    }}>
                        <Text style={{ fontSize: 12, marginRight: 4 }}>💡</Text>
                        <Text style={{
                        fontSize: 12,
                        color: '#6B7280',
                        fontStyle: 'italic',
                        }}>
                        Tap 'Edit' to add medical observations
                        </Text>
                    </View>
                    )}
                </View>
                )}
            </LinearGradient>
            </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#1F2937', '#374151', '#1F2937']}
        style={[
          styles.gradient,
          screenDimensions.isSmallScreen && { padding: 10 },
          screenDimensions.isLargeScreen && { padding: 30 },
          screenDimensions.isXLargeScreen && { padding: 40 }
        ]}
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
                  outputRange: [0, -25],
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
                  outputRange: [0, 30],
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
              opacity: sparkleAnim,
              transform: [{
                rotate: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}
        />
        
        <View style={styles.contentContainer}>
          <FlatList
            ListHeaderComponent={
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
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.navigate('DashboardDoctor')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#92400E', '#A16207']}
                    style={styles.backButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Icon name="arrow-left" size={20} color="#FFFFFF" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.headerContainer}>
                  <LinearGradient
                    colors={['#F9FAFB', '#F3F4F6']}
                    style={styles.iconContainer}
                  >
                    <Text style={styles.iconText}>👨🏻‍⚕️</Text>
                    <Animated.View 
                      style={[
                        styles.iconGlow,
                        {
                          opacity: sparkleAnim,
                          transform: [{ scale: sparkleAnim }]
                        }
                      ]}
                    />
                  </LinearGradient>
                  <Text style={[
                    styles.heading,
                    screenDimensions.isSmallScreen && { fontSize: 22 },
                    screenDimensions.isLargeScreen && { fontSize: 36 },
                    screenDimensions.isXLargeScreen && { fontSize: 42 }
                  ]}>AME Status Overview</Text>
                  <Text style={[
                    styles.subheading,
                    screenDimensions.isSmallScreen && { fontSize: 14 },
                    screenDimensions.isLargeScreen && { fontSize: 20 },
                    screenDimensions.isXLargeScreen && { fontSize: 24 }
                  ]}>Anthropometric Records & Health Assessment</Text>
                </View>

                <View style={[
                  styles.searchContainer,
                  screenDimensions.isLargeScreen && { 
                    maxWidth: 600,
                    alignSelf: 'center' 
                  }
                ]}>
                  <LinearGradient
                    colors={['#F9FAFB', '#F3F4F6']}
                    style={styles.searchGradient}
                  >
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, IRLA No./Regt ID, rank, or remarks..."
                        placeholderTextColor="#6B7280"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <LinearGradient
                      colors={['#166534', '#15803D']}
                      style={styles.searchIconContainer}
                    >
                      <Icon name="magnify" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </LinearGradient>
                </View>

                <LinearGradient
                    colors={['#F9FAFB', '#F3F4F6']}
                    style={[styles.dataCard, { flexDirection: 'row', alignItems: 'center', padding: 16 }]}
                    >
                    <LinearGradient
                        colors={['#166534', '#15803D']}
                        style={styles.dataCardIcon}
                    >
                        <Icon name="medical-bag" size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[styles.cardTitle, { color: '#1F2937', fontSize: 18, fontWeight: '600' }]}>
                        AME Records ({filteredRecords.length}) 
                    </Text>
                    </LinearGradient>
              </Animated.View>
            }
            data={filteredRecords}
            renderItem={renderRecordItem}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
            numColumns={screenDimensions.isLargeScreen ? 2 : 1}
            key={screenDimensions.isLargeScreen ? 'large' : 'small'}
            columnWrapperStyle={screenDimensions.isLargeScreen ? { justifyContent: 'space-between' } : undefined}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  contentContainer: {
    width: '80%',
    flex: 1,
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  element1: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    top: '10%',
    right: '10%',
  },
  element2: {
    width: 60,
    height: 60,
    backgroundColor: '#92400E',
    top: '60%',
    left: '5%',
  },
  element3: {
    width: 40,
    height: 40,
    backgroundColor: '#166534',
    top: '80%',
    right: '15%',
  },
  content: {
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconText: {
    fontSize: 40,
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F9FAFB',
    opacity: 0.3,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0},
    textShadowRadius: 2,
  },
  subheading: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    opacity: 0.9,
  },
  searchContainer: {
    marginBottom: 20,
    width: '100%',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'transparent',
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataCard: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  dataCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
  },
  recordItem: {
    marginBottom: 20,
    width: '100%',
  },
  recordItemSmall: {
    marginBottom: 16,
  },
  recordItemLarge: {
    width: '48%',
    marginBottom: 24,
  },
  recordItemXLarge: {
    width: '48%',
    marginBottom: 30,
  },
  recordGradient: {
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
    marginBottom: 16,
  },
  recordHeaderSmall: {
    marginBottom: 12,
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordHeaderRight: {
    alignItems: 'flex-end',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    marginRight: 16,
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
  serialBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    borderRadius: 15,
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
    marginBottom: 16,
  },
  quickInfoPillsSmall: {
    marginBottom: 12,
  },
  infoPill: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoPillSmall: {
    borderRadius: 10,
    padding: 10,
  },
  infoPillLarge: {
    borderRadius: 16,
    padding: 16,
  },
  pillIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  pillIconSmall: {
    fontSize: 16,
    marginBottom: 2,
  },
  pillIconLarge: {
    fontSize: 24,
    marginBottom: 6,
  },
  pillLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  pillLabelSmall: {
    fontSize: 10,
  },
  pillLabelLarge: {
    fontSize: 12,
  },
  pillValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pillValueSmall: {
    fontSize: 11,
  },
  pillValueLarge: {
    fontSize: 15,
  },
  medicalStatusContainer: {
    marginBottom: 16,
  },
  medicalStatusBar: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  medicalStatusBarSmall: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  medicalStatusBarLarge: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statusSection: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusLabelSmall: {
    fontSize: 10,
    marginBottom: 4,
  },
  statusLabelLarge: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusTextSmall: {
    fontSize: 12,
  },
  statusTextLarge: {
    fontSize: 16,
  },
  statusArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  arrowTextSmall: {
    fontSize: 14,
  },
  arrowTextLarge: {
    fontSize: 18,
  },
  awardedCategorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  awardedLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginRight: 8,
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
  },
  awardedText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  awardedTextSmall: {
    fontSize: 12,
  },
  awardedTextLarge: {
    fontSize: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailsGridSmall: {
    gap: 8,
  },
  detailsGridLarge: {
    gap: 12,
  },
  detailCard: {
    width: '23%',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  detailCardSmall: {
    width: '48%',
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
  },
  detailCardLarge: {
    width: '23%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  detailIconSmall: {
    fontSize: 14,
  },
  detailIconLarge: {
    fontSize: 20,
  },
  detailLabel: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  detailLabelSmall: {
    fontSize: 8,
  },
  detailLabelLarge: {
    fontSize: 10,
  },
  detailValue: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailValueSmall: {
    fontSize: 9,
  },
  detailValueLarge: {
    fontSize: 12,
  },
  recordFooter: {
    paddingTop: 16,
  },
  footerDivider: {
    height: 1,
    marginBottom: 12,
    borderRadius: 0.5,
  },
  footerItem: {
    marginBottom: 8,
  },
  footerLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  footerLabelSmall: {
    fontSize: 11,
  },
  footerLabelLarge: {
    fontSize: 15,
  },
  footerValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '400',
    lineHeight: 18,
  },
  footerValueSmall: {
    fontSize: 11,
    lineHeight: 16,
  },
  footerValueLarge: {
    fontSize: 15,
    lineHeight: 20,
  },
  remarksContainer: {
  },
  remarksContainerSmall: {
    padding: 16,
    borderRadius: 12,
  },
  remarksContainerLarge: {
    padding: 24,
    borderRadius: 20,
  },
  remarksContainerXLarge: {
    padding: 28,
    borderRadius: 24,
  },
});
