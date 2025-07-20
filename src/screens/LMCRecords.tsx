import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  Alert,
  Platform,
  TouchableOpacity,
  TextInput, 
  FlatList,
  Dimensions
} from 'react-native';
import { Button, Card, DataTable, Portal, Dialog, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { insertLowMedicalRecord, getLowMedicalRecords, createLowMedicalTable, clearAllLowMedicalRecords } from '../utils/sqlite';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isLargeTablet = width >= 1024;

export default function LMCRecords() {
  const [loading, setLoading] = useState(false);
  const [lowMedicalRecords, setLowMedicalRecords] = useState<any[]>([]);
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

  const deleteAllRecords = async () => {
    Alert.alert(
      'Delete All Records',
      'Are you sure you want to delete all Low Medical Category records? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await clearAllLowMedicalRecords();
              await loadLowMedicalRecords();
              setLoading(false);
              Alert.alert('Success', 'All Low Medical Category records have been deleted.');
            } catch (error) {
              console.error('Error deleting all records:', error);
              setLoading(false);
              Alert.alert('Error', 'Failed to delete all records');
            }
          }
        }
      ]
    );
  };

  const getColumnsPerRow = () => {
    if (isLargeTablet) return 3;
    if (isTablet) return 2;
    return 3;
  };

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
      setFilteredRecords(lowMedicalRecords);
    } else {
      const filtered = lowMedicalRecords.filter(record => 
        record.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.personnel_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecords(filtered);
    }
  }, [searchQuery, lowMedicalRecords]);

  const initializeData = async () => {
    try {
      await createLowMedicalTable();
      await loadLowMedicalRecords();
    } catch (error) {
      console.error('Error initializing data:', error);
      Alert.alert('Error', 'Failed to initialize database');
    }
  };

  const loadLowMedicalRecords = async () => {
    try {
      const records = await getLowMedicalRecords();
      const sortedRecords = records.sort((a, b) => {
        const serialA = Number(a.serial_no) || 0;
        const serialB = Number(b.serial_no) || 0;
        return serialA - serialB;
      });
      setLowMedicalRecords(sortedRecords);
    } catch (error) {
      console.error('Error loading Low Medical records:', error);
      Alert.alert('Error', 'Failed to load Low Medical records');
    }
  };

  const downloadTemplate = async () => {
    try {
      setDialogType('download');
      setShowDialog(true);

      const headers = [
        'SL NO',
        'IRLA NO/REGT NO',
        'RANK',
        'NAME',
        'DISEASE/REASON',
        'MEDICAL CATEGORY',
        'DATE OF CATEGORY ALLOTMENT & FURTHER CATEGORIZATION',
        'LAST MEDICAL BOARD APPEAR DATE',
        'MEDICAL BOARD DUE DATE',
        'REMARKS'
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers]);

      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:J1');
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
            fgColor: { rgb: 'E6E6FA' } 
            }
        };
      }

      const colWidths = [
        { wch: 8 },   
        { wch: 18 },  
        { wch: 12 },  
        { wch: 25 },  
        { wch: 30 }, 
        { wch: 35 }, 
        { wch: 80 }, 
        { wch: 40 }, 
        { wch: 30 },  
        { wch: 25 }   
       ];

        ws['!cols'] = colWidths;

      ws['!rows'] = [{ hpt: 60 }]; 

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Low_Medical_Category_Template');

      if (Platform.OS === 'web') {
        const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Low_Medical_Category_Template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileUri = FileSystem.documentDirectory + 'Low_Medical_Category_Template.xlsx';
        
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

  const processDateField = (cellData: any) => {
    if (!cellData || cellData === '') return [];
    
    let rawText = '';
    if (cellData.w) {
      rawText = cellData.w.toString();
    } else if (cellData.v) {
      rawText = cellData.v.toString();
    } else {
      return [];
    }
    
    const cleanText = rawText.replace(/\*\*/g, '').trim(); 
    const allDates = new Set<string>();
    
    const datePatterns = [
      /(\d{1,2}\.\d{1,2}\.\d{2,4})/g,  
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,  
      /(\d{1,2}-\d{1,2}-\d{2,4})/g,    
      /(\d{2,4}-\d{1,2}-\d{1,2})/g    
    ];
    
    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const dateStr = match[1].trim();
        if (dateStr.length >= 6) {
          allDates.add(dateStr);
        }
      }
      pattern.lastIndex = 0; 
    }
    
    if (allDates.size === 0) {
      const splitParts = cleanText.split(/[\s,;|&\n\r]+/);
      for (const part of splitParts) {
        const trimmed = part.trim();
        if (trimmed.length >= 6 && /\d+[.\/-]\d+[.\/-]\d+/.test(trimmed)) {
          allDates.add(trimmed);
        }
      }
    }
    
    const result = Array.from(allDates).filter((date): date is string => 
      typeof date === 'string' && date.length >= 6
    );
    
    return result;
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

      const workbook = XLSX.read(fileData, { type: 'base64' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
      const jsonData: any[] = [];

      const categoryDatesMap: { [key: number]: string[] } = {};
      
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const categoryCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 6 })];
        if (categoryCell && categoryCell.v) {
          const dateValue = categoryCell.v.toString().trim();
          if (dateValue && dateValue.length >= 6) {
            let recordRow = R;
            while (recordRow >= range.s.r + 1) {
              const nameCell = worksheet[XLSX.utils.encode_cell({ r: recordRow, c: 3 })]; 
              const idCell = worksheet[XLSX.utils.encode_cell({ r: recordRow, c: 1 })]; 
              
              if (nameCell && nameCell.v && idCell && idCell.v) {
                if (!categoryDatesMap[recordRow]) {
                  categoryDatesMap[recordRow] = [];
                }
                categoryDatesMap[recordRow].push(dateValue);
                break;
              }
              recordRow--;
            }
          }
        }
      }

      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const getCell = (C: number) => worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
        
        const nameCell = getCell(3);
        const idCell = getCell(1);
        
        if (!nameCell || !nameCell.v || !idCell || !idCell.v) {
          continue;
        }

        const row: any = {};
        row['SL NO'] = getCell(0)?.v ?? '';
        row['IRLA NO/REGT NO'] = idCell.v;
        row['RANK'] = getCell(2)?.v ?? '';
        row['NAME'] = nameCell.v;
        row['DISEASE/REASON'] = getCell(4)?.v ?? '';
        row['MEDICAL CATEGORY'] = getCell(5)?.v ?? '';

        const recordDates = categoryDatesMap[R] || [];
        
        const currentRowDate = getCell(6)?.v;
        if (currentRowDate && currentRowDate.toString().trim()) {
          const dateStr = currentRowDate.toString().trim();
          if (dateStr.length >= 6 && !recordDates.includes(dateStr)) {
            recordDates.push(dateStr);
          }
        }

        row['DATE OF CATEGORY ALLOTMENT & FURTHER CATEGORIZATION'] = recordDates;
        row['LAST MEDICAL BOARD APPEAR DATE'] = getCell(7)?.v ?? '';
        row['MEDICAL BOARD DUE DATE'] = getCell(8)?.v ?? '';
        row['REMARKS'] = getCell(9)?.v ?? '';

        jsonData.push(row);
      }

      if (jsonData.length === 0) {
        throw new Error('No data found in the Excel file');
      }

      const validatedData: any[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        if (!row['IRLA NO/REGT NO'] || !row['NAME']) {
          continue;
        }

        const categoryDates = Array.isArray(row['DATE OF CATEGORY ALLOTMENT & FURTHER CATEGORIZATION'])
          ? row['DATE OF CATEGORY ALLOTMENT & FURTHER CATEGORIZATION']
          : [];

        validatedData.push({
          serial_no: row['SL NO'] || (i + 1),
          personnel_id: row['IRLA NO/REGT NO'],
          rank: row['RANK'] || '',
          name: row['NAME'] || '',
          disease_reason: row['DISEASE/REASON'] || '',
          medical_category: row['MEDICAL CATEGORY'] || '',
          category_allotment_date: JSON.stringify(categoryDates),
          last_medical_board_date: row['LAST MEDICAL BOARD APPEAR DATE'] || '',
          medical_board_due_date: row['MEDICAL BOARD DUE DATE'] || '',
          remarks: row['REMARKS'] || '',
          status: 'active',
        });
        
        setUploadProgress(30 + (i / jsonData.length) * 50);
      }

      validatedData.sort((a, b) => {
        const serialA = parseInt(a.serial_no) || 0;
        const serialB = parseInt(b.serial_no) || 0;
        return serialA - serialB;
      });

      let insertedCount = 0;
      for (const record of validatedData) {
        try {
          await insertLowMedicalRecord(record);
          insertedCount++;
        } catch (error) {
          console.error('Error inserting record:', error);
        }
      }

      setUploadProgress(100);
      await loadLowMedicalRecords();

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
    <Surface style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <Text style={styles.statsIcon}>{icon}</Text>
        <View style={styles.statsText}>
          <Text style={styles.statsValue}>{value}</Text>
          <Text style={styles.statsTitle}>{title}</Text>
        </View>
      </View>
    </Surface>
  );

  const renderCategoryDates = (dateString: string) => {
    try {
      if (!dateString || dateString === 'null' || dateString === 'undefined' || 
          dateString.trim() === '' || dateString === '[]') {
        return <Text style={styles.fieldValue}>No dates available</Text>;
      }

      let dates: string[] = [];
      
      try {
        const parsed = JSON.parse(dateString);
        if (Array.isArray(parsed)) {
          dates = parsed.filter(d => d && d.toString().trim().length > 0);
        } else if (typeof parsed === 'string' && parsed.trim()) {
          dates = [parsed.trim()];
        }
      } catch {
        const allDatePatterns = [
          /(\d{1,2}\.\d{1,2}\.\d{4})/g,
          /(\d{1,2}\.\d{1,2}\.\d{2})/g,
          /(\d{1,2}\/\d{1,2}\/\d{4})/g,
          /(\d{1,2}\/\d{1,2}\/\d{2})/g,
          /(\d{1,2}-\d{1,2}-\d{4})/g,
          /(\d{1,2}-\d{1,2}-\d{2})/g,
          /(\d{4}-\d{1,2}-\d{1,2})/g
        ];
        
        const foundDates = new Set();
        for (const pattern of allDatePatterns) {
          let match;
          while ((match = pattern.exec(dateString)) !== null) {
            foundDates.add(match[1]);
          }
          pattern.lastIndex = 0;
        }
        
        dates = Array.from(foundDates) as string[];
        
        if (dates.length === 0) {
          dates = dateString.split(/[,;|\n&\s]+/)
            .map(date => date.trim())
            .filter(date => date && date.length >= 6);
        }
      }

      if (dates.length === 0) {
        return <Text style={styles.fieldValue}>No valid dates found</Text>;
      }

      const uniqueDates = [...new Set(dates)];

      return (
        <View style={styles.datesContainer}>
          <View style={styles.datesGrid}>
            {uniqueDates.map((date, index) => (
              <View key={`date-${index}-${date}`} style={styles.dateChip}>
                <Text style={styles.dateChipText}>{date}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    } catch (error) {
      console.error('Error rendering category dates:', error);
      return <Text style={styles.fieldValue}>Error processing dates</Text>;
    }
  };

  const renderRecordItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{item.name}</Text>
        <Text style={styles.recordId}>
          {['COMDT', '2IC', 'DC', 'AC'].includes(item.rank?.toUpperCase())
            ? `IRLA No: ${item.personnel_id}`
            : `Regt ID: ${item.personnel_id}`}
        </Text>
      </View>

      <View style={styles.recordDetailsWrapper}>
        <View style={styles.recordFieldRow}>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>SL NO:</Text>
            <Text style={styles.fieldValue}>{item.serial_no}</Text>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>RANK:</Text>
            <Text style={[styles.fieldValue, styles.highlightValue]}>{item.rank}</Text>
          </View>
        </View>

        <View style={styles.recordField}>
          <Text style={styles.fieldLabel}>DISEASE / REASON:</Text>
          <Text style={styles.fieldValue}>{item.disease_reason}</Text>
        </View>

        <View style={styles.recordField}>
          <Text style={styles.fieldLabel}>MEDICAL CATEGORY:</Text>
          <View style={[styles.categoryBadge, { backgroundColor: '#FF5722' }]}>
            <Text style={styles.categoryText}>{item.medical_category}</Text>
          </View>
        </View>

        <View style={styles.recordField}>
          <Text style={styles.fieldLabel}>CATEGORY ALLOTMENT DATES:</Text>
          {renderCategoryDates(item.category_allotment_dates || item.category_allotment_date)}
        </View>

        <View style={styles.recordFieldRow}>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>LAST MEDICAL BOARD:</Text>
            <Text style={styles.fieldValue}>{item.last_medical_board_date}</Text>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>DUE DATE:</Text>
            <Text style={styles.fieldValue}>{item.medical_board_due_date}</Text>
          </View>
        </View>

        <View style={styles.recordField}>
          <Text style={styles.fieldLabel}>REMARKS:</Text>
          <Text style={styles.fieldValue}>{item.remarks}</Text>
        </View>
      </View>
    </View>
  );

  const totalRecords = lowMedicalRecords.length;
  const activeRecords = lowMedicalRecords.filter(r => r.status?.toLowerCase() === 'active').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#8B0000', '#DC143C']}
        style={styles.gradient}
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
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
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
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>🏥</Text>
              </View>
              <Text style={styles.heading}>Low Medical Category Records</Text>
              <Text style={styles.subheading}>Medical Board & Category Management</Text>
            </View>

            <View style={styles.statsGrid}>
              {renderStatsCard('Total Records', totalRecords, '📊', '#FF6B6B')}
              {renderStatsCard('Active Records', activeRecords, '🔴', '#FF4757')}
            </View>

            <View style={styles.actionContainer}>
              <Button
                mode="contained"
                onPress={downloadTemplate}
                style={styles.actionButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                icon="download"
              >
                Download Template
              </Button>

              <Button
                mode="outlined"
                onPress={selectFile}
                style={styles.actionButtonOutlined}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabelOutlined}
                icon="upload"
              >
                Upload Excel File
              </Button>

              <Button
                mode="outlined"
                onPress={deleteAllRecords}
                style={[styles.deleteButton]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.deleteButtonLabel}
                icon="delete"
                disabled={lowMedicalRecords.length === 0}
              >
                Delete All Records
              </Button>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or IRLA NO/REGT NO..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Text style={styles.searchIcon}>🔍</Text>
            </View>

            <View style={[styles.dataCard, { flexDirection: 'row', alignItems: 'center', padding: 16 }]}>
              <Icon name="account-alert" size={24} color="#D32F2F" style={{ marginRight: 12 }} />
              <Text style={[styles.cardTitle, { color: '#D32F2F', fontSize: 18, fontWeight: '600' }]}>
                Low Medical Category Records ({filteredRecords.length})
              </Text>
            </View>


            {filteredRecords.length > 0 && (
              <View style={styles.recordsContainer}>
                {filteredRecords.map((item, index) => (
                  <View key={index}>
                    {renderRecordItem({ item, index })}
                    {index < filteredRecords.length - 1 && <View style={styles.recordSeparator} />}
                  </View>
                ))}
              </View>
            )}

            {filteredRecords.length === 0 && lowMedicalRecords.length > 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>
                  {lowMedicalRecords.length === 0 ? '📋' : '🔍'}
                </Text>
                <Text style={styles.emptyText}>
                  {lowMedicalRecords.length === 0 
                    ? 'No Low Medical Category Records Found' 
                    : 'No Records Found'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {lowMedicalRecords.length === 0
                    ? 'Download the template, fill it with low medical category data, and upload it to get started.'
                    : 'No records match your search criteria. Try a different search term.'}
                </Text>
              </View>
            )}

            {lowMedicalRecords.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No Low Medical Category Records Found</Text>
                <Text style={styles.emptySubtext}>
                  Download the template, fill it with low medical category data, and upload it to get started.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
        
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('DashboardAdmin')}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        <Portal>
          <Dialog visible={showDialog} dismissable={false}>
            <Dialog.Title>
              {dialogType === 'download' ? 'Downloading Template...' : 'Uploading Data...'}
            </Dialog.Title>
            <Dialog.Content>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${dialogType === 'download' ? 100 : uploadProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {dialogType === 'download' ? 'Preparing template...' : `${Math.round(uploadProgress)}% complete`}
                </Text>
              </View>
            </Dialog.Content>
          </Dialog>
        </Portal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  recordHeader: {
    marginBottom: 18,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FFE5E5',
    alignItems: 'center', 
  },
  recordTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 6,
    textAlign: 'center', 
  },
  recordId: {
    fontSize: 15,
    color: '#DC143C',
    fontWeight: '600',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'center', 
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    textAlign: 'center',
  },
  recordItem: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#8B0000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#DC143C',
    width: '100%',
    alignSelf: 'center',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  recordField: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB6C1',
    alignItems: 'center', 
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center', 
  },
  fieldValue: {
    fontSize: 14,
    color: '#2C2C2C',
    flexWrap: 'wrap',
    lineHeight: 20,
    textAlign: 'center', 
    paddingHorizontal: 4,
  },
  categoryBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignSelf: 'center', 
    marginTop: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  recordSeparator: {
    height: 2,
    backgroundColor: '#FFE5E5',
    marginVertical: isTablet ? 12 : 8,
    borderRadius: 1,
    shadowColor: '#8B0000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  datesContainer: {
    flex: 1,
    marginTop: 6,
    padding: 10,
    backgroundColor: '#FEFEFE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    alignItems: 'center', 
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  dateChip: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DC143C',
    marginBottom: 4,
    shadowColor: '#8B0000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordsContainer: {
    width: '80%',
    alignSelf: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  highlightValue: {
    color: '#DC143C',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dateChipText: {
    color: '#8B0000',
    fontSize: 12,
    fontWeight: '700',
  },
  recordFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  dataCard: {
    width: '80%',
    alignSelf: 'center',
    borderRadius: 15,
    elevation: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 4,
    borderTopColor: '#8B0000',
    shadowColor: '#8B0000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  recordDetailsWrapper: {
    flexDirection: 'column',
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingHorizontal: isTablet ? 20 : 15,
    marginBottom: 20,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFE5E5',
    shadowColor: '#8B0000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    width: '80%',
    alignSelf: 'center',
  },
  searchInput: {
    flex: 1,
    height: isTablet ? 60 : 50,
    fontSize: isTablet ? 18 : 16,
    color: '#333',
    fontWeight: '500',
  },
  searchIcon: {
    fontSize: isTablet ? 24 : 20,
    marginLeft: 10,
    color: '#8B0000',
  },
  categoryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  dateItem: {
    fontSize: isTablet ? 14 : 12,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: isTablet ? 20 : 16,
  },
  dateBullet: {
    color: '#8B0000',
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  recordDetails: {
    flexDirection: 'row',
    minWidth: isLargeTablet ? 2000 : isTablet ? 1600 : 1400,
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: isTablet ? 30 : 20,
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  element1: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    top: '8%',
    left: '10%',
  },
  element2: {
    width: isTablet ? 80 : 60,
    height: isTablet ? 80 : 60,
    top: '15%',
    right: '15%',
  },
  scrollContent: {
    flex: 1,
    paddingTop: isTablet ? 80 : 60,
    paddingBottom: isTablet ? 60 : 40,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: isTablet ? 80 : 60,
    paddingBottom: isTablet ? 60 : 40,
  },
  recordsList: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    maxWidth: isLargeTablet ? 1200 : isTablet ? 900 : 800,
    alignSelf: 'center',
    minHeight: height - 140
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: isTablet ? 40 : 30,
  },
  iconContainer: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    borderRadius: isTablet ? 50 : 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconText: {
    fontSize: isTablet ? 48 : 36,
  },
  heading: {
    fontSize: isLargeTablet ? 36 : isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subheading: {
    fontSize: isTablet ? 20 : 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? 20 : 15,
  },
  statsIcon: {
    fontSize: isTablet ? 32 : 24,
    marginRight: 15,
  },
  statsText: {
    flex: 1,
  },
  statsValue: {
    fontSize: isTablet ? 28 : 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsTitle: {
    fontSize: isTablet ? 16 : 12,
    color: '#666',
    marginTop: 2,
  },
  actionContainer: {
    width: '100%',
    marginBottom: isTablet ? 40 : 30,
    alignItems: 'center',
    flexDirection: isLargeTablet ? 'row' : 'column',
    justifyContent: isLargeTablet ? 'space-around' : 'center',
  },
  actionButton: {
    backgroundColor: '#FFCC80',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: isLargeTablet ? 0 : 15,
    width: isLargeTablet ? '28%' : isTablet ? '60%' : '80%',
  },
  actionButtonOutlined: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    borderRadius: 25,
    marginVertical: isLargeTablet ? 0 : 6,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    width: isLargeTablet ? '28%' : isTablet ? '60%' : '80%',
  },
  buttonContent: {
    height: isTablet ? 60 : 50,
  },
  buttonLabel: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  buttonLabelOutlined: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#FFA000',
  },
  deleteButton: {
    borderColor: '#FF9800',
    borderWidth: 2,
    borderRadius: 25,
    marginVertical: isLargeTablet ? 0 : 6,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    width: isLargeTablet ? '28%' : isTablet ? '60%' : '80%',
  },
  deleteButtonLabel: {
    color: '#F8F8FF',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  cardTitle: {
    color: '#8B0000',
    fontSize: isTablet ? 22 : 18,
    fontWeight: 'bold',
  },
  tableHeader: {
    color: '#8B0000',
    fontWeight: 'bold',
    fontSize: isTablet ? 16 : 14,
  },
  tableCell: {
    color: '#333',
    fontSize: isTablet ? 14 : 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 80 : 60,
  },
  emptyIcon: {
    fontSize: isTablet ? 96 : 64,
    marginBottom: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: isTablet ? 28 : 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: isTablet ? 18 : 14,
    textAlign: 'center',
    paddingHorizontal: isTablet ? 60 : 40,
    lineHeight: isTablet ? 26 : 20,
  },
  progressContainer: {
    alignItems: 'center',
    padding: isTablet ? 30 : 20,
  },
  progressBar: {
    width: '100%',
    height: isTablet ? 12 : 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: isTablet ? 6 : 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B0000',
    borderRadius: isTablet ? 6 : 4,
  },
  progressText: {
    color: '#666',
    fontSize: isTablet ? 18 : 14,
  },
  backButton: {
    alignSelf: 'center',
    marginBottom: 20,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 18 : 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: isTablet ? 20 : 16,
    fontWeight: 'bold',
  },
  recordScroll: {
    flexGrow: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: isTablet ? 40 : 30,
  },
  statsCard: {
    width: width < 400 ? '100%' : (isLargeTablet ? '31%' : isTablet ? '48%' : '31%'),
    marginBottom: 15,
    borderRadius: 15,
    borderLeftWidth: 4,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});