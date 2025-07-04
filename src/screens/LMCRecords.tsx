import React, { useState, useRef, useEffect } from 'react';
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
  FlatList
} from 'react-native';
import { Button, Card, DataTable, Portal, Dialog, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { insertLowMedicalRecord, getLowMedicalRecords, createLowMedicalTable } from '../utils/sqlite';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
      setLowMedicalRecords(records);
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
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setUploadProgress(30);

      if (jsonData.length === 0) {
        throw new Error('No data found in the Excel file');
      }

      const validatedData = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        if (!row['IRLA NO/REGT NO'] || !row['NAME']) {
          console.warn(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        validatedData.push({
          serial_no: row['SL NO'] || (i + 1),
          personnel_id: row['IRLA NO/REGT NO'],
          rank: row['RANK'] || '',
          name: row['NAME'] || '',
          disease_reason: row['DISEASE/REASON'] || '',
          medical_category: row['MEDICAL CATEGORY'] || '',
          category_allotment_date: row['DATE OF CATEGORY ALLOTMENT & FURTHER CATEGORIZATION'] || '',
          last_medical_board_date: row['LAST MEDICAL BOARD APPEAR DATE'] || '',
          medical_board_due_date: row['MEDICAL BOARD DUE DATE'] || '',
          remarks: row['REMARKS'] || '',
          status: 'active', 
        });

        setUploadProgress(30 + (i / jsonData.length) * 50);
      }

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

  const renderRecordItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{item.name}</Text>
        <Text style={styles.recordId}>{item.personnel_id}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.recordScroll}>
        <View style={styles.recordDetails}>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>SL NO:</Text>
            <Text style={styles.fieldValue}>{item.serial_no}</Text>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>RANK:</Text>
            <Text style={styles.fieldValue}>{item.rank}</Text>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>DISEASE/REASON:</Text>
            <Text style={styles.fieldValue} numberOfLines={0}>{item.disease_reason}</Text>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>MEDICAL CATEGORY:</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.medical_category) }]}>
              <Text style={styles.categoryText}>{item.medical_category}</Text>
            </View>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>CATEGORY ALLOTMENT DATE:</Text>
            <Text style={styles.fieldValue} numberOfLines={0}>{item.category_allotment_date}</Text>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>LAST MEDICAL BOARD DATE:</Text>
            <Text style={styles.fieldValue}>{item.last_medical_board_date}</Text>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>MEDICAL BOARD DUE DATE:</Text>
            <Text style={styles.fieldValue}>{item.medical_board_due_date}</Text>
          </View>
          <View style={styles.recordField}>
            <Text style={styles.fieldLabel}>REMARKS:</Text>
            <Text style={styles.fieldValue} numberOfLines={0}>{item.remarks}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'a1': return '#4CAF50';
      case 'a2': return '#8BC34A';
      case 'b1': return '#FFC107';
      case 'b2': return '#FF9800';
      case 'c1': return '#FF5722';
      case 'c2': return '#F44336';
      case 'temp': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const totalRecords = lowMedicalRecords.length;
  const activeRecords = lowMedicalRecords.filter(r => r.status?.toLowerCase() === 'active').length;
  const dueSoonRecords = lowMedicalRecords.filter(r => {
    if (!r.medical_board_due_date) return false;
    const dueDate = new Date(r.medical_board_due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  }).length;

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
        <View style={styles.scrollContent}>
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
              {renderStatsCard('Due Soon', dueSoonRecords, '⏰', '#FFA502')}
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
              <FlatList
                data={filteredRecords}
                renderItem={renderRecordItem}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={true}
                style={styles.recordsList}
                ItemSeparatorComponent={() => <View style={styles.recordSeparator} />}
                contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
              />
            )}

            {filteredRecords.length === 0 && lowMedicalRecords.length > 0 && (
              <FlatList
                data={[]}
                renderItem={() => null}
                ListEmptyComponent={() => (
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
                contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
              />
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
        </View>
        
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Dashboard')}
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
    width: 80,
    height: 80,
    top: '8%',
    left: '10%',
  },
  element2: {
    width: 60,
    height: 60,
    top: '15%',
    right: '15%',
  },
  scrollContent: {
    flex: 1,
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
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconText: {
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
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  buttonLabelOutlined: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  dataCard: {
    width: '100%',
    borderRadius: 15,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardTitle: {
    color: '#8B0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tableHeader: {
    color: '#8B0000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableCell: {
    color: '#333',
    fontSize: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  progressContainer: {
    alignItems: 'center',
    padding: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B0000',
    borderRadius: 4,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
  },
  backButton: {
    alignSelf: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  recordItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginVertical: 5,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B0000',
    flex: 1,
  },
  recordId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recordScroll: {
    flexGrow: 0,
  },
  recordDetails: {
    flexDirection: 'row',
    minWidth: 1200, 
  },
  recordField: {
    marginRight: 20,
    minWidth: 150,
    maxWidth: 200,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
  },
  recordSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  }
});