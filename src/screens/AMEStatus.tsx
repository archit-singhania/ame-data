import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Alert,
  Platform,
  TouchableOpacity,
  TextInput, 
  FlatList,
  Dimensions, 
  PixelRatio
} from 'react-native';
import { Button, Card, DataTable, Portal, Dialog, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { insertAMERecord, getAMERecords, createAMETable, deleteAMERecords } from '../utils/sqlite';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AMERecords() {
  const [loading, setLoading] = useState(false);
  const [ameRecords, setAMERecords] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
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
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
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
        record.unit?.toLowerCase().includes(searchQuery.toLowerCase())
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
      Alert.alert('Error', 'Failed to initialize database');
    }
  };

  const loadAMERecords = async () => {
    try {
      const records = await getAMERecords();
      setAMERecords(records);
    } catch (error) {
      console.error('Error loading AME records:', error);
      Alert.alert('Error', 'Failed to load AME records');
    }
  };

  const deleteAllRecords = async () => {
    Alert.alert(
      'Delete All Records',
      'Are you sure you want to delete all AME records? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAMERecords();
              await loadAMERecords();
              setLoading(false);
              Alert.alert('Success', 'All AME records have been deleted.');
            } catch (error) {
              console.error('Error deleting records:', error);
              setLoading(false);
              Alert.alert('Error', 'Failed to delete records');
            }
          }
        }
      ]
    );
  };

  const downloadTemplate = async () => {
    try {
      setDialogType('download');
      setShowDialog(true);

      const headers = [
        'S.No',
        'IRLA No./Regt. ID',
        'Rank',
        'Full Name',
        'Coy',
        'Age',
        'Height (cm)',
        'Weight (Kg)',
        'Chest (cm)',
        'Waist Hip Ratio',
        'BMI',
        'Pulse',
        'Blood Group',
        'Blood Pressure',
        'Vision',
        'Previous Medical Category',
        'Date of AME',
        'Present Category',
        'Awarded Category',
        'Reason',
        'Remarks'
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers]);

      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:U1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellRef]) continue;
        
        ws[cellRef].s = {
          font: { 
            bold: true, 
            sz: 18 
          },
          alignment: { 
            horizontal: 'center',
            vertical: 'center',
            wrapText: true
          },
          fill: {
            fgColor: { rgb: 'E8F4FD' } 
          }
        };
      }

      const colWidths = [
        { wch: 8 },   
        { wch: 18 },  
        { wch: 12 },  
        { wch: 25 },  
        { wch: 8 },  
        { wch: 8 },  
        { wch: 12 },  
        { wch: 12 },  
        { wch: 12 },  
        { wch: 15 }, 
        { wch: 8 },  
        { wch: 8 },  
        { wch: 12 },  
        { wch: 15 },  
        { wch: 12 }, 
        { wch: 25 },  
        { wch: 15 }, 
        { wch: 20 },  
        { wch: 20 },  
        { wch: 30 },  
        { wch: 30 }  
      ];

      ws['!cols'] = colWidths;
      ws['!rows'] = [{ hpt: 60 }]; 

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AME_Records_Template');

      if (Platform.OS === 'web') {
        const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'AME_Records_Template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileUri = FileSystem.documentDirectory + 'AME_Records_Template.xlsx';
        
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        await Sharing.shareAsync(fileUri);
      }

      setTimeout(() => {
        setShowDialog(false);
      }, 2000);
    } catch (error) {
      console.error('Error preparing template:', error);
      setShowDialog(false);
      Alert.alert('Error', 'Failed to prepare template');
    }
  };

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setSelectedFile(result);
      Alert.alert(
        'File Selected',
        `Selected: ${result.assets[0].name}\n\nWould you like to upload this file?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upload', onPress: () => uploadExcelFile(result.assets[0]) }
        ]
      );
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const uploadExcelFile = async (file: any) => {
    try {
      setLoading(true);
      setDialogType('upload');
      setShowDialog(true);
      setUploadProgress(0);

      const response = await fetch(file.uri);
      const blob = await response.blob();
      const fileReader = new FileReader();

      const fileData = await new Promise((resolve, reject) => {
        fileReader.onload = (e) => {
          const data = e.target?.result;
          if (typeof data === 'string') {
            resolve(data.split(',')[1]); 
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        fileReader.onerror = reject;
        fileReader.readAsDataURL(blob);
      });
      
      const workbook = XLSX.read(fileData, { 
        type: 'base64',
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });

      setUploadProgress(30);

      if (jsonData.length === 0) {
        throw new Error('No data found in the Excel file');
      }

      const validatedData = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
      
        if (!row['IRLA No./Regt. ID'] && !row['Full Name']) {
          continue;
        }

        let dateOfAME = row['Date of AME'] || '';
        
        if (dateOfAME instanceof Date) {
          dateOfAME = dateOfAME.toISOString().split('T')[0]; 
        } else if (typeof dateOfAME === 'number') {
          const excelDate = new Date((dateOfAME - 25569) * 86400 * 1000);
          dateOfAME = excelDate.toISOString().split('T')[0];
        } else if (typeof dateOfAME === 'string') {
          dateOfAME = dateOfAME.trim();
        }

        validatedData.push({
          serial_no: row['S.No'] || '',
          irla_no: row['IRLA No./Regt. ID'] || '',
          rank: row['Rank'] || '',
          full_name: row['Full Name'] || '',
          coy: row['Coy'] || '',
          age: row['Age'] || '',
          height: row['Height (cm)'] || '',
          weight: row['Weight (Kg)'] || '',
          chest: row['Chest (cm)'] || '',
          waist_hip_ratio: row['Waist Hip Ratio'] || '',
          bmi: row['BMI'] || '',
          pulse: row['Pulse'] || '',
          blood_group: row['Blood Group'] || '',
          blood_pressure: row['Blood Pressure'] || '',
          vision: row['Vision'] || '',
          previous_medical_category: row['Previous Medical Category'] || '',
          date_of_ame: dateOfAME,
          present_category: row['Present Category'] || '',
          awarded_category: row['Awarded Category'] || '',
          reason: row['Reason'] || '',
          remarks: row['Remarks'] || '',
          status: 'active',
        });

        setUploadProgress(30 + (i / jsonData.length) * 50);
      }

      let insertedCount = 0;
      for (const record of validatedData) {
        try {
          await insertAMERecord({
            s_no: record.serial_no,
            personnel_id: record.irla_no,
            unit: record.coy,
            rank: record.rank,
            full_name: record.full_name,
            age: record.age,
            height: record.height,
            weight: record.weight,
            chest: record.chest,
            waist_hip_ratio: record.waist_hip_ratio,
            bmi: record.bmi,
            pulse: record.pulse,
            blood_group: record.blood_group,
            blood_pressure: record.blood_pressure,
            vision: record.vision,
            previous_medical_category: record.previous_medical_category,
            date_of_ame: record.date_of_ame,
            present_category_awarded: record.present_category,
            category_reason: record.reason,
            remarks: record.remarks,
          });
          insertedCount++;
        } catch (error) {
          console.error('Error inserting record:', error);
        }
      }

      setUploadProgress(100);
      await loadAMERecords();

      setTimeout(() => {
        setShowDialog(false);
        setLoading(false);
        Alert.alert(
          'Upload Complete',
          `Successfully uploaded ${insertedCount} out of ${validatedData.length} records.`
        );
      }, 1000);

    } catch (error) {
      console.error('Error uploading file:', error);
      setShowDialog(false);
      setLoading(false);
      if (error instanceof Error) {
        Alert.alert('Error', `Failed to upload file: ${error.message}`);
      } else {
        Alert.alert('Error', 'Failed to upload file due to an unknown error');
      }
    }
  };

  const renderStatsCard = (title: string, value: number, icon: string, color: string) => (
    <Surface style={[
      styles.statsCard, 
      { borderLeftColor: color },
      screenDimensions.isSmallScreen && styles.statsCardSmall,
      screenDimensions.isLargeScreen && styles.statsCardLarge,
      screenDimensions.isXLargeScreen && styles.statsCardXLarge
    ]}>
      <View style={styles.statsContent}>
        <Text style={[
          styles.statsIcon,
          screenDimensions.isSmallScreen && styles.statsIconSmall,
          screenDimensions.isLargeScreen && styles.statsIconLarge
        ]}>{icon}</Text>
        <View style={styles.statsText}>
          <Text style={[
            styles.statsValue,
            screenDimensions.isSmallScreen && styles.statsValueSmall,
            screenDimensions.isLargeScreen && styles.statsValueLarge
          ]}>{value}</Text>
          <Text style={[
            styles.statsTitle,
            screenDimensions.isSmallScreen && styles.statsTitleSmall,
            screenDimensions.isLargeScreen && styles.statsTitleLarge
          ]}>{title}</Text>
        </View>
      </View>
    </Surface>
  );

  const getRankColor = (rank: string) => {
    if (!rank) return '#9E9E9E';
    const r = rank.toLowerCase();
    if (r.includes('col') || r.includes('gen')) return '#1565C0';
    if (r.includes('maj') || r.includes('capt')) return '#2E7D32';
    if (r.includes('lt')) return '#F57C00';
    if (r.includes('sub') || r.includes('hav')) return '#7B1FA2';
    return '#424242';
  };

  const getBMITextColor = (bmi: string) => {
    if (!bmi || bmi === '-') return '#666';
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return '#666';
    
    if (bmiValue < 18.5) return '#FF9800';
    if (bmiValue < 25) return '#4CAF50';
    if (bmiValue < 30) return '#FF5722';
    return '#F44336';
  };

  const renderRecordItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View 
      style={[
        styles.recordItem,
        screenDimensions.isSmallScreen && styles.recordItemSmall,
        screenDimensions.isLargeScreen && styles.recordItemLarge,
        screenDimensions.isXLargeScreen && styles.recordItemXLarge,
        { width: screenDimensions.isXLargeScreen ? "32%" : screenDimensions.isLargeScreen ? "48%" : "90%" },
        {
          transform: [{
            scale: new Animated.Value(1)
          }]
        }
      ]}
    >
      <LinearGradient
        colors={['#D1D5DB', '#E5E7EB', '#F9FAFB']}
        style={[
          styles.recordGradient,
          screenDimensions.isSmallScreen && styles.recordGradientSmall,
          screenDimensions.isLargeScreen && styles.recordGradientLarge,
        ]}
      >
        <View style={[
          styles.recordHeader,
          screenDimensions.isSmallScreen && styles.recordHeaderSmall,
        ]}>
          <View style={[
            styles.recordHeaderLeft,
            screenDimensions.isSmallScreen && styles.recordHeaderLeftSmall,
            screenDimensions.isLargeScreen && styles.recordHeaderLeftLarge,
            screenDimensions.isXLargeScreen && styles.recordHeaderLeftXLarge
          ]}>
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
            <View style={[
              styles.headerInfo,
              screenDimensions.isSmallScreen && styles.headerInfoSmall,
              screenDimensions.isLargeScreen && styles.headerInfoLarge,
              screenDimensions.isXLargeScreen && styles.headerInfoXLarge
            ]}>
              <Text style={[
                styles.recordTitle,
                screenDimensions.isSmallScreen && styles.recordTitleSmall,
                screenDimensions.isLargeScreen && styles.recordTitleLarge
              ]}>{item.full_name || 'Unknown'}</Text>
              <Text style={[
                styles.recordSubtitle,
                screenDimensions.isSmallScreen && styles.recordSubtitleSmall,
                screenDimensions.isLargeScreen && styles.recordSubtitleLarge
              ]}>
                {['COMDT', 'comdt', '2IC', '2ic', 'DC', 'dc', 'AC', 'ac'].includes((item.rank || '').toLowerCase())
                  ? `IRLA No: ${item.personnel_id || 'No ID'}`
                  : `Regt ID: ${item.personnel_id || 'No ID'}`}
              </Text>
            </View>
          </View>
          <View style={[
            styles.recordHeaderRight,
            screenDimensions.isSmallScreen && styles.recordHeaderRightSmall,
            screenDimensions.isLargeScreen && styles.recordHeaderRightLarge,
            screenDimensions.isXLargeScreen && styles.recordHeaderRightXLarge
          ]}>
            <View style={[
              styles.serialBadge,
              screenDimensions.isSmallScreen && styles.serialBadgeSmall,
              screenDimensions.isLargeScreen && styles.serialBadgeLarge,
              screenDimensions.isXLargeScreen && styles.serialBadgeXLarge
            ]}>
              <Text style={[
                styles.serialText,
                screenDimensions.isSmallScreen && styles.serialTextSmall,
                screenDimensions.isLargeScreen && styles.serialTextLarge,
                screenDimensions.isXLargeScreen && styles.serialTextXLarge
              ]}>#{item.s_no || '-'}</Text>
            </View>
            <LinearGradient
              colors={[getRankColor(item.rank), `${getRankColor(item.rank)}CC`]}
              style={[
                styles.rankBadge,
                screenDimensions.isSmallScreen && styles.rankBadgeSmall,
                screenDimensions.isLargeScreen && styles.rankBadgeLarge,
                screenDimensions.isXLargeScreen && styles.rankBadgeXLarge
              ]}
            >
              <Text style={[
                styles.rankText,
                screenDimensions.isSmallScreen && styles.rankTextSmall,
                screenDimensions.isLargeScreen && styles.rankTextLarge,
                screenDimensions.isXLargeScreen && styles.rankTextXLarge
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
            width: screenDimensions.isSmallScreen ? '95%' : '70%',
            alignSelf: 'center',
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
                { color: '#FFFFFF' }
              ]}>
                {label}
              </Text>
              <Text style={[
                styles.pillValue,
                screenDimensions.isSmallScreen && styles.pillValueSmall,
                screenDimensions.isLargeScreen && styles.pillValueLarge,
                isBMI && { color: getBMITextColor(item.bmi) },
                { color: '#FFFFFF' },
              ]}>
                {value}
              </Text>
            </LinearGradient>
          ))}
        </View>

        <View style={[
          styles.medicalStatusContainer,
          screenDimensions.isSmallScreen && styles.medicalStatusContainerSmall,
          screenDimensions.isLargeScreen && styles.medicalStatusContainerLarge,
          screenDimensions.isXLargeScreen && styles.medicalStatusContainerXLarge
        ]}>
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
                width: screenDimensions.isSmallScreen ? '95%' : '70%',
                alignSelf: 'center',
              },
            ]}
          >
            <View style={[
              styles.statusSection,
              screenDimensions.isSmallScreen && styles.statusSectionSmall,
              screenDimensions.isLargeScreen && styles.statusSectionLarge,
              screenDimensions.isXLargeScreen && styles.statusSectionXLarge
            ]}>
              <Text style={[
                styles.statusLabel,
                screenDimensions.isSmallScreen && styles.statusLabelSmall,
                screenDimensions.isLargeScreen && styles.statusLabelLarge,
                { color: '#FFFFFF' , width: screenDimensions.isSmallScreen ? '95%' : '70%', alignSelf: 'center' }
              ]}>
                Previous Medical Category
              </Text>
              <View style={[
                styles.statusBadge,
                screenDimensions.isSmallScreen && styles.statusBadgeSmall,
                screenDimensions.isLargeScreen && styles.statusBadgeLarge,
                screenDimensions.isXLargeScreen && styles.statusBadgeXLarge,
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

            <View style={[
              styles.statusArrow,
              screenDimensions.isSmallScreen && styles.statusArrowSmall,
              screenDimensions.isLargeScreen && styles.statusArrowLarge,
              screenDimensions.isXLargeScreen && styles.statusArrowXLarge
            ]}>
              <LinearGradient
                colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
                style={[
                  styles.arrowContainer,
                  screenDimensions.isSmallScreen && styles.arrowContainerSmall,
                  screenDimensions.isLargeScreen && styles.arrowContainerLarge,
                  screenDimensions.isXLargeScreen && styles.arrowContainerXLarge
                ]}
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

            <View style={styles.statusSection} >
              <Text style={[
                styles.statusLabel,
                screenDimensions.isSmallScreen && styles.statusLabelSmall,
                screenDimensions.isLargeScreen && styles.statusLabelLarge,
                { color: '#FFFFFF' , width: screenDimensions.isSmallScreen ? '95%' : '70%', alignSelf: 'center' }
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

          <View style={[
            styles.awardedCategorySection,
            screenDimensions.isSmallScreen && styles.awardedCategorySectionSmall,
            screenDimensions.isLargeScreen && styles.awardedCategorySectionLarge,
            screenDimensions.isXLargeScreen && styles.awardedCategorySectionXLarge
          ]}>
            <Text style={[
              styles.awardedLabel,
              screenDimensions.isSmallScreen && styles.awardedLabelSmall,
              screenDimensions.isLargeScreen && styles.awardedLabelLarge,
            ]}>
              Category Reason:
            </Text>
            <LinearGradient
              colors={[getCategoryColor(item.awarded_category), `${getCategoryColor(item.awarded_category)}CC`]}
              style={[
                styles.awardedBadge,
                screenDimensions.isSmallScreen && styles.awardedBadgeSmall,
                screenDimensions.isLargeScreen && styles.awardedBadgeLarge,
                screenDimensions.isXLargeScreen && styles.awardedBadgeXLarge
              ]}
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

        <View style={[
          styles.detailsContainer,
          screenDimensions.isSmallScreen && styles.detailsContainerSmall,
          screenDimensions.isLargeScreen && styles.detailsContainerLarge,
          screenDimensions.isXLargeScreen && styles.detailsContainerXLarge
        ]}>
          <View style={[
            styles.detailsGrid,
            screenDimensions.isSmallScreen && styles.detailsGridSmall,
            screenDimensions.isLargeScreen && styles.detailsGridLarge,
            { width: screenDimensions.isSmallScreen ? '95%' : '70%', alignSelf: 'center' }
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
                  screenDimensions.isLargeScreen && styles.detailLabelLarge,
                  { color: '#FFFFFF' }
                ]}>{detail.label}</Text>
                <Text style={[
                  styles.detailValue,
                  screenDimensions.isSmallScreen && styles.detailValueSmall,
                  screenDimensions.isLargeScreen && styles.detailValueLarge,
                  { color: '#FFFFFF' }
                ]}>{detail.value}</Text>
              </LinearGradient>
            ))}
          </View>
        </View>

          <LinearGradient
            colors={['#E5E7EB', '#D1D5DB']}
            style={[
              styles.medicalRemarksSection,
              screenDimensions.isSmallScreen && styles.medicalRemarksSectionSmall,
              screenDimensions.isLargeScreen && styles.medicalRemarksSectionLarge,
              screenDimensions.isXLargeScreen && styles.medicalRemarksSectionXLarge
            ]}
          >
            <Text style={[
              styles.medicalRemarksTitle,
              screenDimensions.isSmallScreen && styles.medicalRemarksTitleSmall,
              screenDimensions.isLargeScreen && styles.medicalRemarksTitleLarge,
              screenDimensions.isXLargeScreen && styles.medicalRemarksTitleXLarge
            ]}>
              Medical Remarks
            </Text>
            <Text style={[
              styles.medicalRemarksText,
              screenDimensions.isSmallScreen && styles.medicalRemarksTextSmall,
              screenDimensions.isLargeScreen && styles.medicalRemarksTextLarge,
              screenDimensions.isXLargeScreen && styles.medicalRemarksTextXLarge
            ]}>
              {item.remarks || 'No remarks available'}
            </Text>
          </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );

  const getCategoryColor = (category: string) => {
    if (!category || category === '-') return '#9E9E9E'; 
    
    switch (category?.toLowerCase()) {
      case 'a1': return '#2E7D32';
      case 'a2': return '#388E3C';
      case 'b1': return '#F57C00';
      case 'b2': return '#FF9800';
      case 'c1': return '#D32F2F';
      case 'c2': return '#F44336';
      case 'temp': return '#7B1FA2';
      default: return '#9E9E9E'; 
    }
  };

  const getBMIColor = (bmi: string) => {
    if (!bmi || bmi === '-') return '#9E9E9E'; 
    
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return '#9E9E9E'; 
    
    if (bmiValue < 18.5) return '#FF9800'; 
    if (bmiValue < 25) return '#4CAF50'; 
    if (bmiValue < 30) return '#FF5722'; 
    return '#F44336'; 
  };

  const totalRecords = ameRecords.length;
  const activeRecords = ameRecords.filter(r => r.status?.toLowerCase() === 'active').length;
  const dueSoonRecords = ameRecords.filter(r => {
    if (!r.date_of_ame) return false;
    const ameDate = new Date(r.date_of_ame);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - ameDate.getFullYear()) * 12 + (today.getMonth() - ameDate.getMonth());
    return monthsDiff >= 11; 
  }).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#1565C0', '#42A5F5']}
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
            screenDimensions.isSmallScreen && styles.element1Small,
            screenDimensions.isLargeScreen && styles.element1Large,
            screenDimensions.isXLargeScreen && styles.element1XLarge,
            {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                })
              }]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.element2,
            screenDimensions.isSmallScreen && styles.element2Small,
            screenDimensions.isLargeScreen && styles.element2Large,
            screenDimensions.isXLargeScreen && styles.element2XLarge,
            {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                })
              }]
            }
          ]}
        />
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
            <View style={[
              styles.headerContainer,
              screenDimensions.isSmallScreen && styles.headerContainerSmall,
              screenDimensions.isMediumScreen && styles.headerContainerMedium,
              screenDimensions.isLargeScreen && styles.headerContainerLarge,
              screenDimensions.isXLargeScreen && styles.headerContainerXLarge
            ]}>
              <View style={[
                styles.iconContainer,
                screenDimensions.isSmallScreen && styles.iconContainerSmall,
                screenDimensions.isMediumScreen && styles.iconContainerMedium,
                screenDimensions.isLargeScreen && styles.iconContainerLarge,
                screenDimensions.isXLargeScreen && styles.iconContainerXLarge
              ]}>
                <Text style={[
                  styles.iconText,
                  screenDimensions.isSmallScreen && styles.iconTextSmall,
                  screenDimensions.isMediumScreen && styles.iconTextMedium,
                  screenDimensions.isLargeScreen && styles.iconTextLarge,
                  screenDimensions.isXLargeScreen && styles.iconTextXLarge
                ]}>⚕️</Text>
              </View>
              <Text style={[
                styles.heading,
                screenDimensions.isSmallScreen && { fontSize: 22 },
                screenDimensions.isMediumScreen && { fontSize: 26 },
                screenDimensions.isLargeScreen && { fontSize: 36 },
                screenDimensions.isXLargeScreen && { fontSize: 42 }
              ]}>Annual Medical Examination Records</Text>
              <Text style={[
                styles.subheading,
                screenDimensions.isSmallScreen && { fontSize: 14 },
                screenDimensions.isMediumScreen && { fontSize: 16 },
                screenDimensions.isLargeScreen && { fontSize: 20 },
                screenDimensions.isXLargeScreen && { fontSize: 24 }
              ]}>Health Assessment & Medical Fitness</Text>
            </View>

            <View style={[
              styles.statsGrid,
              screenDimensions.isSmallScreen && { flexDirection: 'column' },
              screenDimensions.isMediumScreen && { flexDirection: 'row', flexWrap: 'wrap' },
              screenDimensions.isLargeScreen && { justifyContent: 'space-around' },
              screenDimensions.isXLargeScreen && { justifyContent: 'space-between', paddingHorizontal: 20 }
            ]}>
              {renderStatsCard('Total Records', totalRecords, '📊', '#2196F3')}
              {renderStatsCard('Active Records', activeRecords, '🔵', '#1976D2')}
              {renderStatsCard('Due Soon', dueSoonRecords, '⏰', '#FF9800')}
            </View>

            <View style={[
              styles.actionContainer,
              screenDimensions.isSmallScreen && styles.actionContainerSmall,
              screenDimensions.isMediumScreen && styles.actionContainerMedium,
              screenDimensions.isLargeScreen && styles.actionContainerLarge,
              screenDimensions.isXLargeScreen && styles.actionContainerXLarge
            ]}>
              <View style={[
                styles.actionRow,
                screenDimensions.isSmallScreen && styles.actionRowSmall,
                screenDimensions.isMediumScreen && styles.actionRowMedium,
                screenDimensions.isLargeScreen && styles.actionRowLarge,
                screenDimensions.isXLargeScreen && styles.actionRowXLarge
              ]}>
                <Button
                  mode="contained"
                  onPress={downloadTemplate}
                  style={[styles.actionButton, styles.primaryButton]}
                  contentStyle={[
                    styles.buttonContent,
                    screenDimensions.isSmallScreen && styles.buttonContentSmall,
                    screenDimensions.isMediumScreen && styles.buttonContentMedium,
                    screenDimensions.isLargeScreen && styles.buttonContentLarge,
                    screenDimensions.isXLargeScreen && styles.buttonContentXLarge
                  ]}
                  labelStyle={[
                    styles.buttonLabel,
                    screenDimensions.isSmallScreen && styles.buttonLabelSmall,
                    screenDimensions.isMediumScreen && styles.buttonLabelMedium,
                    screenDimensions.isLargeScreen && styles.buttonLabelLarge,
                    screenDimensions.isXLargeScreen && styles.buttonLabelXLarge
                  ]}
                  icon="download"
                >
                  Download Template
                </Button>

                <Button
                  mode="outlined"
                  onPress={selectFile}
                  style={[styles.actionButtonOutlined, styles.uploadButton]}
                  contentStyle={[
                    styles.buttonContent,
                    screenDimensions.isSmallScreen && styles.buttonContentSmall,
                    screenDimensions.isMediumScreen && styles.buttonContentMedium,
                    screenDimensions.isLargeScreen && styles.buttonContentLarge,
                    screenDimensions.isXLargeScreen && styles.buttonContentXLarge
                  ]}
                  labelStyle={[
                    styles.buttonLabelOutlined,
                    screenDimensions.isSmallScreen && styles.buttonLabelSmall,
                    screenDimensions.isMediumScreen && styles.buttonLabelMedium,
                    screenDimensions.isLargeScreen && styles.buttonLabelLarge,
                    screenDimensions.isXLargeScreen && styles.buttonLabelXLarge
                  ]}
                  icon="upload"
                >
                  Upload Excel
                </Button>
              </View>

              {ameRecords.length > 0 && (
                <Button
                  mode="contained"
                  onPress={deleteAllRecords}
                  style={[
                    styles.actionButton, 
                    styles.deleteButton, 
                    { alignSelf: 'center' },
                    screenDimensions.isSmallScreen && { minWidth: 180 },
                    screenDimensions.isMediumScreen && { minWidth: 220 },
                    screenDimensions.isLargeScreen && { minWidth: 280 },
                    screenDimensions.isXLargeScreen && { minWidth: 320 }
                  ]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.deleteButtonLabel}
                  icon="delete-sweep"
                >
                  Delete All Records
                </Button>
              )}
            </View>

            <View style={[
              styles.searchContainer,
              screenDimensions.isSmallScreen && styles.searchContainerSmall,
              screenDimensions.isMediumScreen && styles.searchContainerMedium,
              screenDimensions.isLargeScreen && styles.searchContainerLarge,
              screenDimensions.isXLargeScreen && styles.searchContainerXLarge
            ]}>
              <TextInput
                style={[
                  styles.searchInput,
                  screenDimensions.isSmallScreen && styles.searchInputSmall,
                  screenDimensions.isMediumScreen && styles.searchInputMedium,
                  screenDimensions.isLargeScreen && styles.searchInputLarge,
                  screenDimensions.isXLargeScreen && styles.searchInputXLarge
                ]}
                placeholder="Search by name, IRLA No., or rank..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Text style={[
                styles.searchIcon,
                screenDimensions.isSmallScreen && styles.searchIconSmall,
                screenDimensions.isMediumScreen && styles.searchIconMedium,
                screenDimensions.isLargeScreen && styles.searchIconLarge,
                screenDimensions.isXLargeScreen && styles.searchIconXLarge
              ]}>🔍</Text>
            </View>

            <View style={[
              styles.dataCard,
              screenDimensions.isSmallScreen && styles.dataCardSmall,
              screenDimensions.isMediumScreen && styles.dataCardMedium,
              screenDimensions.isLargeScreen && styles.dataCardLarge,
              screenDimensions.isXLargeScreen && styles.dataCardXLarge,
              { flexDirection: 'row', alignItems: 'center' }
            ]}>
              <Icon name="medical-bag" size={
                screenDimensions.isSmallScreen ? 20 : 
                screenDimensions.isMediumScreen ? 22 : 
                screenDimensions.isLargeScreen ? 28 : 
                screenDimensions.isXLargeScreen ? 32 : 24
              } color="#1565C0" style={{ marginRight: 12 }} />
              <Text style={[
                styles.cardTitle,
                screenDimensions.isSmallScreen && styles.cardTitleSmall,
                screenDimensions.isMediumScreen && styles.cardTitleMedium,
                screenDimensions.isLargeScreen && styles.cardTitleLarge,
                screenDimensions.isXLargeScreen && styles.cardTitleXLarge,
                { color: '#1565C0', fontWeight: '600' }
              ]}>
                AME Records ({filteredRecords.length})
              </Text>
            </View>
          </Animated.View>
          }
          data={filteredRecords}
          renderItem={renderRecordItem}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
          numColumns={
            screenDimensions.isSmallScreen ? 1 : 
            screenDimensions.isMediumScreen ? 1 : 
            screenDimensions.isLargeScreen ? 2 : 
            screenDimensions.isXLargeScreen ? 3 : 1
          }
          key={`${screenDimensions.isSmallScreen}-${screenDimensions.isMediumScreen}-${screenDimensions.isLargeScreen}-${screenDimensions.isXLargeScreen}`}
          ListEmptyComponent={() => (
            <View style={[
              styles.emptyContainer,
              screenDimensions.isSmallScreen && styles.emptyContainerSmall,
              screenDimensions.isMediumScreen && styles.emptyContainerMedium,
              screenDimensions.isLargeScreen && styles.emptyContainerLarge,
              screenDimensions.isXLargeScreen && styles.emptyContainerXLarge
            ]}>
              <Text style={[
                styles.emptyIcon,
                screenDimensions.isSmallScreen && styles.emptyIconSmall,
                screenDimensions.isMediumScreen && styles.emptyIconMedium,
                screenDimensions.isLargeScreen && styles.emptyIconLarge,
                screenDimensions.isXLargeScreen && styles.emptyIconXLarge
              ]}>
                {ameRecords.length === 0 ? '📋' : '🔍'}
              </Text>
              <Text style={[
                styles.emptyText,
                screenDimensions.isSmallScreen && styles.emptyTextSmall,
                screenDimensions.isMediumScreen && styles.emptyTextMedium,
                screenDimensions.isLargeScreen && styles.emptyTextLarge,
                screenDimensions.isXLargeScreen && styles.emptyTextXLarge
              ]}>
                {ameRecords.length === 0 
                  ? 'No AME Records Found' 
                  : 'No Records Found'}
              </Text>
              <Text style={[
                styles.emptySubtext,
                screenDimensions.isSmallScreen && styles.emptySubtextSmall,
                screenDimensions.isMediumScreen && styles.emptySubtextMedium,
                screenDimensions.isLargeScreen && styles.emptySubtextLarge,
                screenDimensions.isXLargeScreen && styles.emptySubtextXLarge
              ]}>
                {ameRecords.length === 0
                  ? 'Download the template, fill it with AME data, and upload it to get started.'
                  : 'No records match your search criteria. Try a different search term.'}
              </Text>
            </View>
          )}
        />

        <Portal>
          <Dialog visible={showDialog} dismissable={false}>
            <Dialog.Title>
              {dialogType === 'download' ? 'Downloading Template...' : 'Uploading Data...'}
            </Dialog.Title>
            <Dialog.Content>
              <View style={[
                styles.progressContainer,
                screenDimensions.isSmallScreen && styles.progressContainerSmall,
                screenDimensions.isMediumScreen && styles.progressContainerMedium,
                screenDimensions.isLargeScreen && styles.progressContainerLarge,
                screenDimensions.isXLargeScreen && styles.progressContainerXLarge
              ]}>
                <View style={[
                  styles.progressBar,
                  screenDimensions.isSmallScreen && styles.progressBarSmall,
                  screenDimensions.isMediumScreen && styles.progressBarMedium,
                  screenDimensions.isLargeScreen && styles.progressBarLarge,
                  screenDimensions.isXLargeScreen && styles.progressBarXLarge
                ]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${dialogType === 'download' ? 100 : uploadProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.progressText,
                  screenDimensions.isSmallScreen && styles.progressTextSmall,
                  screenDimensions.isMediumScreen && styles.progressTextMedium,
                  screenDimensions.isLargeScreen && styles.progressTextLarge,
                  screenDimensions.isXLargeScreen && styles.progressTextXLarge
                ]}>
                  {dialogType === 'download' ? 'Preparing template...' : `${Math.round(uploadProgress)}% complete`}
                </Text>
              </View>
            </Dialog.Content>
          </Dialog>
        </Portal>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('DashboardAdmin')}
          style={[
            styles.bottomBackButton,
            screenDimensions.isSmallScreen && styles.bottomBackButtonSmall,
            screenDimensions.isMediumScreen && styles.bottomBackButtonMedium,
            screenDimensions.isLargeScreen && styles.bottomBackButtonLarge,
            screenDimensions.isXLargeScreen && styles.bottomBackButtonXLarge
          ]}
        >
          <Text style={[
            styles.bottomBackButtonText,
            screenDimensions.isSmallScreen && styles.bottomBackButtonTextSmall,
            screenDimensions.isMediumScreen && styles.bottomBackButtonTextMedium,
            screenDimensions.isLargeScreen && styles.bottomBackButtonTextLarge,
            screenDimensions.isXLargeScreen && styles.bottomBackButtonTextXLarge
          ]}>
            ← Back to Dashboard
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomButtonContainerSmall: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bottomButtonContainerLarge: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomButtonContainerXLarge: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  bottomBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 180, 
    width: '30%',
    maxWidth: 300,
    alignSelf: 'center',
    marginTop: 20,
    alignItems: 'center',
  justifyContent: 'center',
  },
  bottomBackButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 160,
    width: '80%',
  },
  bottomBackButtonMedium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 180,
    width: '60%',
  },
  bottomBackButtonLarge: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 220,
    width: '40%',
  },
  bottomBackButtonXLarge: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    minWidth: 260,
    width: '30%',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignSelf: 'center',
    width: '70%',
    gap: 12,
    marginBottom: 20, 
  },
  detailCard: {
    borderRadius: 16,
    paddingVertical: 8, 
    paddingHorizontal: 10,
    minHeight: 70,
    width: '47%',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '600',
    opacity: 0.95,
  },
  detailValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 1,
  },
  detailsGridSmall: {
    gap: 4,
  },
  detailsGridLarge: {
    gap: 12,
    marginTop: 20,
  },
  detailCardSmall: {
    padding: 6,
    minHeight: 45,
    minWidth: '22%',
    maxWidth: '22%',
  },
  detailCardLarge: {
    padding: 16,
    minHeight: 70,
    minWidth: '23%',
    maxWidth: '23%',
  },
  detailIconSmall: {
    fontSize: 16,
  },
  detailIconLarge: {
    fontSize: 24,
  },
  detailLabelSmall: {
    fontSize: 10,
  },
  detailLabelLarge: {
    fontSize: 12,
  },
  detailValueSmall: {
    fontSize: 11,
  },
  detailValueLarge: {
    fontSize: 15,
  },
  statsCardSmall: {
    width: '100%',
    marginBottom: 10,
  },
  statsIconSmall: {
    fontSize: 20,
    marginRight: 10,
  },
  statsValueSmall: {
    fontSize: 16,
  },
  statsTitleSmall: {
    fontSize: 10,
  },
  recordItemSmall: {
    marginHorizontal: 8,
    marginVertical: 6,
    width: '95%',
    alignSelf: 'center',
  },
  recordGradientSmall: {
    padding: 12,
  },
  recordHeaderSmall: {
    marginBottom: 12,
  },
  profileCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileInitialSmall: {
    fontSize: 16,
  },
  recordTitleSmall: {
    fontSize: 16,
  },
  recordSubtitleSmall: {
    fontSize: 12,
  },
  quickInfoPillsSmall: {
    flexDirection: 'column',
    gap: 8,
  },
  infoPillSmall: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  pillIconSmall: {
    fontSize: 14,
  },
  pillLabelSmall: {
    fontSize: 9,
  },
  pillValueSmall: {
    fontSize: 11,
  },
  medicalStatusBarSmall: {
    flexDirection: 'column',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  
  statusLabelSmall: {
    fontSize: 10,
  },
  statusTextSmall: {
    fontSize: 10,
  },
  arrowTextSmall: {
    fontSize: 16,
  },
  awardedLabelSmall: {
    fontSize: 12,
  },
  awardedTextSmall: {
    fontSize: 12,
  },
  footerLabelSmall: {
    fontSize: 10,
  },
  footerValueSmall: {
    fontSize: 12,
  },
  statsCardLarge: {
    width: '22%',
    marginBottom: 20,
  },
  statsIconLarge: {
    fontSize: 32,
    marginRight: 20,
  },
  statsValueLarge: {
    fontSize: 28,
  },
  statsTitleLarge: {
    fontSize: 16,
  },
  recordItemLarge: {
    marginHorizontal: 24,
    marginVertical: 12,
    width: '92%', 
    alignSelf: 'center',
  },
  recordGradientLarge: {
    padding: 28,
  },
  profileCircleLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  profileInitialLarge: {
    fontSize: 28,
  },
  recordTitleLarge: {
    fontSize: 22,
  },
  recordSubtitleLarge: {
    fontSize: 16,
  },
  infoPillLarge: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  pillIconLarge: {
    fontSize: 20,
  },
  pillLabelLarge: {
    fontSize: 12,
  },
  pillValueLarge: {
    fontSize: 16,
  },
  medicalStatusBarLarge: {
    padding: 20,
    borderRadius: 20,
  },
  statusLabelLarge: {
    fontSize: 16,
  },
  statusTextLarge: {
    fontSize: 16,
  },
  arrowTextLarge: {
    fontSize: 24,
  },
  awardedLabelLarge: {
    fontSize: 18,
  },
  awardedTextLarge: {
    fontSize: 16,
  },
  footerLabelLarge: {
    fontSize: 16,
  },
  footerValueLarge: {
    fontSize: 18,
  },
  statsCardXLarge: {
    width: '18%',
    marginBottom: 25,
  },
  recordItemXLarge: {
    marginHorizontal: 32,
    marginVertical: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '90%',
  },
  medicalStatusContainer: {
    marginBottom: 16,
  },
  medicalStatusContainerSmall: {
    marginVertical: 12,
  },
  medicalStatusContainerLarge: {
    marginVertical: 20,
  },
  medicalStatusContainerXLarge: {
    marginVertical: 24,
  },
  awardedCategorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
  },
  awardedCategorySectionSmall: {
    marginTop: 12,
  },
  awardedCategorySectionLarge: {
    marginTop: 20,
  },
  awardedCategorySectionXLarge: {
    marginTop: 24,
  },
  awardedLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 10,
  },
  awardedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  awardedBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 6,
    minWidth: 60,
  },
  awardedBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 10,
    minWidth: 100,
  },
  awardedBadgeXLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginLeft: 12,
    minWidth: 120,
  },
  awardedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: '#FFFFFF',
    width: '95%', 
    alignSelf: 'center', 
  },
  recordGradient: {
    borderRadius: 20,
    padding: 20,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#1565C0',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerInfoSmall: {
    marginLeft: 8,
  },
  headerInfoLarge: {
    marginLeft: 16,
  },
  headerInfoXLarge: {
    marginLeft: 20,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  recordSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recordHeaderRight: {
    alignItems: 'flex-end',
  },
  recordHeaderRightSmall: {
    alignItems: 'center',
  },
  recordHeaderRightLarge: {
    alignItems: 'flex-end',
  },
  recordHeaderRightXLarge: {
    alignItems: 'flex-end',
  },
  serialBadge: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  serialBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    minWidth: 32,
  },
  serialBadgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
    minWidth: 50,
  },
  serialBadgeXLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 60,
  },
  serialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B1FA2',
  },
  serialTextSmall: {
    fontSize: 10,
  },
  serialTextLarge: {
    fontSize: 14,
  },
  serialTextXLarge: {
    fontSize: 16,
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  rankBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 50,
  },
  rankBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
  },
  rankBadgeXLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rankTextSmall: {
    fontSize: 10,
  },
  rankTextLarge: {
    fontSize: 14,
  },
  rankTextXLarge: {
    fontSize: 16,
  },
  quickInfoPills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  medicalRemarksSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    width: '70%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medicalRemarksSectionSmall: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
    width: '85%',
  },
  medicalRemarksSectionLarge: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    width: '60%',
  },
  medicalRemarksSectionXLarge: {
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
    marginBottom: 24,
    width: '50%',
  },
  medicalRemarksTitle: {
    fontWeight: '800',
    fontSize: 17,
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  medicalRemarksTitleSmall: {
    fontSize: 14,
    marginBottom: 6,
  },
  medicalRemarksTitleLarge: {
    fontSize: 20,
    marginBottom: 10,
  },
  medicalRemarksTitleXLarge: {
    fontSize: 24,
    marginBottom: 12,
  },
  medicalRemarksText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 24,
    fontWeight: '500',
  },
  medicalRemarksTextSmall: {
    fontSize: 12,
    lineHeight: 18,
  },
  medicalRemarksTextLarge: {
    fontSize: 18,
    lineHeight: 28,
  },
  medicalRemarksTextXLarge: {
    fontSize: 22,
    lineHeight: 32,
  },
  infoPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  pillLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  pillValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  medicalStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusSection: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    minWidth: 50,
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 10,
    minWidth: 80,
  },
  statusBadgeXLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    minWidth: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusArrow: {
    marginHorizontal: 16,
    alignItems: 'center',
    flex: 1,
  },
  statusArrowSmall: {
    marginHorizontal: 8,
  },
  statusArrowLarge: {
    marginHorizontal: 16,
  },
  statusArrowXLarge: {
    marginHorizontal: 20,
  },
  statusSectionSmall: {
    paddingHorizontal: 8,
  },
  statusSectionLarge: {
    paddingHorizontal: 16,
  },
  statusSectionXLarge: {
    paddingHorizontal: 20,
  },
  arrowText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 16,
    marginTop: 16,
    overflow: 'visible',
    minHeight: 200,
  },
  detailsContainerSmall: {
    marginTop: 12,
  },
  detailsContainerLarge: {
    marginTop: 20,
  },
  detailsContainerXLarge: {
    marginTop: 24,
  },
  recordFooter: {
    marginTop: 8,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  footerItem: {
    marginBottom: 8,
  },
  footerLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  measurementItem: {
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  vitalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vitalItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    marginBottom: 12,
  },
  categoryItemLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  categoryItemValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  ameInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  ameInfoItem: {
    flex: 1,
  },
  ameInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  ameInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textAlign: 'center',
  },
  additionalInfoGrid: {
    gap: 12,
  },
  additionalInfoItem: {
    marginBottom: 8,
  },
  additionalInfoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  additionalInfoValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1565C0',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 12
  },
  actionRowSmall: {
    gap: 8,
    flexDirection: 'column',
  },
  actionRowMedium: {
    gap: 10,
  },
  actionRowLarge: {
    gap: 16,
  },
  actionRowXLarge: {
    gap: 20,
  },
  primaryButton: {
    flex: 0.48,
  },
  uploadButton: {
    flex: 0.48,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recordTitleContainer: {
    flex: 1,
  },
  recordBadges: {
    flexDirection: 'row',
    marginTop: 8,
  },
  idBadge: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  idText: {
    color: '#7B1FA2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordNumber: {
    backgroundColor: 'rgba(21, 101, 192, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  recordNumberText: {
    color: '#1565C0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  quickInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  quickInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  medicalInfoGrid: {
    gap: 15,
  },
  medicalInfoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1565C0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 12,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vitalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  assessmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assessmentItem: {
    flex: 1,
    marginRight: 10,
  },
  assessmentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  assessmentValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  element1: {
    width: 60,
    height: 60,
    top: 100,
    right: 30,
  },
  element1Small: {
    width: 40,
    height: 40,
    top: 80,
    right: 20,
  },
  element1Large: {
    width: 80,
    height: 80,
    top: 120,
    right: 40,
  },
  element1XLarge: {
    width: 100,
    height: 100,
    top: 140,
    right: 50,
  },
  element2: {
    width: 40,
    height: 40,
    top: 200,
    left: 20,
  },
  element2Small: {
    width: 30,
    height: 30,
    top: 160,
    left: 15,
  },
  element2Large: {
    width: 60,
    height: 60,
    top: 240,
    left: 30,
  },
  element2XLarge: {
    width: 80,
    height: 80,
    top: 280,
    left: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  recordsList: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerContainerSmall: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  headerContainerMedium: {
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  headerContainerLarge: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContainerXLarge: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainerSmall: {
    width: 48,
    height: 48,
  },
  iconContainerMedium: {
    width: 54,
    height: 54,
  },
  iconContainerLarge: {
    width: 72,
    height: 72,
  },
  iconContainerXLarge: {
    width: 84,
    height: 84,
  },
  iconText: {
    fontSize: 28,
  },
  iconTextSmall: {
    fontSize: 22,
  },
  iconTextMedium: {
    fontSize: 25,
  },
  iconTextLarge: {
    fontSize: 32,
  },
  iconTextXLarge: {
    fontSize: 36,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  statsCard: {
    width: '31%',
    marginBottom: 15,
    borderRadius: 15,
    borderLeftWidth: 4,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  statsIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  statsText: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionContainer: {
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionContainerSmall: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionContainerMedium: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionContainerLarge: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionContainerXLarge: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 15,
  },
  actionButtonOutlined: {
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  buttonContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonContentSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonContentMedium: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  buttonContentLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonContentXLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonLabel: {
    color: '#1565C0',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonLabelSmall: {
    fontSize: 12,
  },
  buttonLabelMedium: {
    fontSize: 13,
  },
  buttonLabelLarge: {
    fontSize: 16,
  },
  buttonLabelXLarge: {
    fontSize: 18,
  },
  buttonLabelOutlined: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainerSmall: {
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  searchContainerMedium: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  searchContainerLarge: {
    paddingHorizontal: 24,
    marginVertical: 20,
  },
  searchContainerXLarge: {
    paddingHorizontal: 32,
    marginVertical: 24,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
   searchInputSmall: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 44,
  },
  searchInputMedium: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
    height: 48,
  },
  searchInputLarge: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 56,
  },
  searchInputXLarge: {
    fontSize: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    height: 64,
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  searchIconSmall: {
    fontSize: 16,
  },
  searchIconMedium: {
    fontSize: 18,
  },
  searchIconLarge: {
    fontSize: 24,
  },
  searchIconXLarge: {
    fontSize: 28,
  },
  dataCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16
  },
  dataCardSmall: {
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  dataCardMedium: {
    padding: 14,
    marginHorizontal: 14,
    marginVertical: 7,
  },
  dataCardLarge: {
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  dataCardXLarge: {
    padding: 24,
    marginHorizontal: 24,
    marginVertical: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1565C0',
  },
  cardTitleSmall: {
    fontSize: 14,
  },
  cardTitleMedium: {
    fontSize: 16,
  },
  cardTitleLarge: {
    fontSize: 22,
  },
  cardTitleXLarge: {
    fontSize: 26,
  },
  recordId: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordScroll: {
    maxHeight: 200,
  },
  recordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recordField: {
    width: '48%',
    marginBottom: 12,
    marginRight: '2%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bmiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bmiText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bloodGroupBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bloodGroupText: {
    color: '#1565C0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyContainerSmall: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyContainerMedium: {
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  emptyContainerLarge: {
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  emptyContainerXLarge: {
    paddingHorizontal: 48,
    paddingVertical: 56,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyIconSmall: {
    fontSize: 48,
  },
  emptyIconMedium: {
    fontSize: 56,
  },
  emptyIconLarge: {
    fontSize: 72,
  },
  emptyIconXLarge: {
    fontSize: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyTextSmall: {
    fontSize: 16,
  },
  emptyTextMedium: {
    fontSize: 18,
  },
  emptyTextLarge: {
    fontSize: 24,
  },
  emptyTextXLarge: {
    fontSize: 28,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptySubtextSmall: {
    fontSize: 12,
  },
  emptySubtextMedium: {
    fontSize: 13,
  },
  emptySubtextLarge: {
    fontSize: 16,
  },
  emptySubtextXLarge: {
    fontSize: 18,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  progressContainerSmall: {
    paddingVertical: 12,
  },
  progressContainerMedium: {
    paddingVertical: 14,
  },
  progressContainerLarge: {
    paddingVertical: 20,
  },
  progressContainerXLarge: {
    paddingVertical: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBarSmall: {
    height: 6,
  },
  progressBarMedium: {
    height: 7,
  },
  progressBarLarge: {
    height: 10,
  },
  progressBarXLarge: {
    height: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1565C0',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressTextSmall: {
    fontSize: 12,
  },
  progressTextMedium: {
    fontSize: 13,
  },
  progressTextLarge: {
    fontSize: 16,
  },
  progressTextXLarge: {
    fontSize: 18,
  },
  bottomBackButtonText: {
    color: '#1565C0',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBackButtonTextSmall: {
    fontSize: 14,
  },
  bottomBackButtonTextMedium: {
    fontSize: 16,
  },
  bottomBackButtonTextLarge: {
    fontSize: 18,
  },
  bottomBackButtonTextXLarge: {
    fontSize: 20,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainerSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  arrowContainerLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  arrowContainerXLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  remarksContainer: {
  },
  recordHeaderLeftSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordHeaderLeftLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordHeaderLeftXLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});