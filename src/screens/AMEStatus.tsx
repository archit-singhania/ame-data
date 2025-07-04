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
  TouchableOpacity
} from 'react-native';
import { Button, Card, DataTable, Portal, Dialog, Surface, TextInput, FAB, Chip, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { insertAMERecord, getAMERecords, createAMETable } from '../utils/sqlite';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AMEStatus() {
  const [loading, setLoading] = useState(false);
  const [ameRecords, setAMERecords] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
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
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    initializeData();
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
        'Present Category Awarded',
        'Category Reason',
        'Remarks'
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers]);

      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:T1');
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
            vertical: 'center'
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
        { wch: 20 }, 
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
        { wch: 10 },  
        { wch: 25 }, 
        { wch: 15 },  
        { wch: 25 }, 
        { wch: 18 }, 
        { wch: 15 }   
      ];

      ws['!cols'] = colWidths;

      ws['!rows'] = [{ hpt: 25 }]; 

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AME_Template');

      if (Platform.OS === 'web') {
        const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'AME_Template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileUri = FileSystem.documentDirectory + 'AME_Template.xlsx';
        
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
        
        const defaultValue = '-';

        validatedData.push({
          personnel_id: row['IRLA No./Regt. ID'] || defaultValue,
          rank: row['Rank'] || defaultValue,
          full_name: row['Full Name'] || defaultValue,
          unit: row['Coy'] || defaultValue,
          age: isNaN(parseInt(row['Age'])) ? undefined : parseInt(row['Age']),
          height: isNaN(parseFloat(row['Height (cm)'])) ? undefined : parseFloat(row['Height (cm)']),
          weight: isNaN(parseFloat(row['Weight (Kg)'])) ? undefined : parseFloat(row['Weight (Kg)']),
          chest: isNaN(parseFloat(row['Chest (cm)'])) ? undefined : parseFloat(row['Chest (cm)']),
          waist_hip_ratio: isNaN(parseFloat(row['Waist Hip Ratio'])) ? undefined : parseFloat(row['Waist Hip Ratio']),
          bmi: isNaN(parseFloat(row['BMI'])) ? undefined : parseFloat(row['BMI']),
          pulse: isNaN(parseInt(row['Pulse'])) ? undefined : parseInt(row['Pulse']),
          blood_group: row['Blood Group'] || defaultValue,
          blood_pressure: row['Blood Pressure'] || defaultValue,
          vision: row['Vision'] || defaultValue,
          previous_medical_category: row['Previous Medical Category'] || defaultValue,
          ame_date: row['Date of AME'] || defaultValue,
          present_category_awarded: row['Present Category Awarded'] || defaultValue,
          category_reason: row['Category Reason'] || defaultValue,
          remarks: row['Remarks'] || defaultValue,
          ame_status: 'pending',
        });

        setUploadProgress(30 + (i / jsonData.length) * 50);
      }

      let insertedCount = 0;
      for (const record of validatedData) {
        try {
          await insertAMERecord(record);
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

  const filteredRecords = ameRecords.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    return (
      record.full_name?.toLowerCase().includes(searchLower) ||
      record.personnel_id?.toLowerCase().includes(searchLower)
    );
  });

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fit': return '#4CAF50';
      case 'unfit': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const totalRecords = ameRecords.length;
  const pendingRecords = ameRecords.filter(r => r.ame_status?.toLowerCase() === 'pending').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#134E5E', '#71B280']}
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
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
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
              <Text style={styles.heading}>AME Stats & Health Overview</Text>
              <Text style={styles.subheading}>Annual Medical Examination Status</Text>
            </View>

            <View style={styles.statsGrid}>
              {renderStatsCard('Total Records', totalRecords, '📊', '#2196F3')}
              {renderStatsCard('Pending AME', pendingRecords, '⏳', '#FF9800')}
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

            {ameRecords.length > 0 && (
              <Card style={styles.dataCard}>
                <Card.Title 
                  title="Recent AME Records" 
                  titleStyle={styles.cardTitle}
                  left={(props) => <Icon {...props} name="clipboard-text" size={24} color="#2196F3" />}
                />
                <Card.Content>
                  <View style={styles.searchContainer}>
                    <TextInput
                      mode="outlined"
                      placeholder="Search by Name or IRLA No./Regt. ID"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={styles.searchInput}
                      left={<TextInput.Icon icon="magnify" />}
                      right={searchQuery ? (
                        <TextInput.Icon 
                          icon="close" 
                          onPress={() => setSearchQuery('')}
                          color="#757575"
                        />
                      ) : null}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#2196F3"
                      contentStyle={styles.searchInputContent}
                    />
                    
                    <View style={styles.resultsBadge}>
                      <Text style={styles.resultsCount}>
                        {filteredRecords.length} / {ameRecords.length}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.tableWrapper}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={true} 
                      style={styles.tableScrollView}
                      contentContainerStyle={styles.tableScrollContent}
                    >
                      <View style={styles.tableContainer}>
                        <DataTable style={styles.dataTable}>
                          <DataTable.Header style={styles.tableHeader}>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.serialCell]}>
                              <Text style={styles.headerText}>S.No</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.idCell]}>
                              <Text style={styles.headerText}>IRLA No./Regt. ID</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.rankCell]}>
                              <Text style={styles.headerText}>Rank</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.nameCell]}>
                              <Text style={styles.headerText}>Full Name</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.companyCell]}>
                              <Text style={styles.headerText}>Coy</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>Age</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>Height (cm)</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>Weight (Kg)</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>Chest (cm)</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>WHR</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>BMI</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>Pulse</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>Blood Group</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.wideCell]}>
                              <Text style={styles.headerText}>Blood Pressure</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.standardCell]}>
                              <Text style={styles.headerText}>Vision</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.wideCell]}>
                              <Text style={styles.headerText}>Previous Category</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.wideCell]}>
                              <Text style={styles.headerText}>AME Date</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.wideCell]}>
                              <Text style={styles.headerText}>Present Category</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.wideCell]}>
                              <Text style={styles.headerText}>Category Reason</Text>
                            </DataTable.Title>
                            <DataTable.Title style={[styles.tableHeaderCell, styles.wideCell]}>
                              <Text style={styles.headerText}>Remarks</Text>
                            </DataTable.Title>
                          </DataTable.Header>
                          
                          {filteredRecords.map((record, index) => (
                            <DataTable.Row 
                              key={index} 
                              style={[
                                styles.tableRow,
                                index % 2 === 0 ? styles.evenRow : styles.oddRow
                              ]}
                            >
                              <DataTable.Cell style={[styles.tableCell, styles.serialCell]}>
                                <View style={styles.serialNumberBadge}>
                                  <Text style={styles.serialNumber}>{index + 1}</Text>
                                </View>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.idCell]}>
                                <Text style={[styles.cellText, styles.primaryText]} numberOfLines={2}>
                                  {record.personnel_id}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.rankCell]}>
                                <View style={styles.rankBadge}>
                                  <Text style={styles.rankText}>{record.rank}</Text>
                                </View>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.nameCell]}>
                                <Text style={[styles.cellText, styles.nameText]} numberOfLines={2}>
                                  {record.full_name}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.companyCell]}>
                                <Text style={[styles.cellText, styles.companyText]}>
                                  {record.unit}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <Text style={[styles.cellText, styles.numericText]}>
                                  {record.age}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <Text style={[styles.cellText, styles.numericText]}>
                                  {record.height}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <Text style={[styles.cellText, styles.numericText]}>
                                  {record.weight}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <Text style={[styles.cellText, styles.numericText]}>
                                  {record.chest}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <Text style={[styles.cellText, styles.numericText]}>
                                  {record.waist_hip_ratio}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <View style={styles.bmiBadge}>
                                  <Text style={styles.bmiText}>{record.bmi}</Text>
                                </View>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <Text style={[styles.cellText, styles.numericText]}>
                                  {record.pulse}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <View style={styles.bloodGroupBadge}>
                                  <Text style={styles.bloodGroupText}>{record.blood_group}</Text>
                                </View>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.wideCell]}>
                                <Text style={[styles.cellText, styles.vitalText]} numberOfLines={2}>
                                  {record.blood_pressure}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.standardCell]}>
                                <Text style={[styles.cellText, styles.vitalText]}>
                                  {record.vision}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.wideCell]}>
                                <Text style={[styles.cellText, styles.categoryText]} numberOfLines={2}>
                                  {record.previous_medical_category}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.wideCell]}>
                                <Text style={[styles.cellText, styles.dateText]}>
                                  {record.ame_date}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.wideCell]}>
                                <Text style={[styles.cellText, styles.categoryText]} numberOfLines={2}>
                                  {record.present_category_awarded}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.wideCell]}>
                                <Text style={[styles.cellText, styles.reasonText]} numberOfLines={3}>
                                  {record.category_reason}
                                </Text>
                              </DataTable.Cell>
                              <DataTable.Cell style={[styles.tableCell, styles.wideCell]}>
                                <Text style={[styles.cellText, styles.remarksText]} numberOfLines={3}>
                                  {record.remarks}
                                </Text>
                              </DataTable.Cell>
                            </DataTable.Row>
                          ))}
                        </DataTable>
                      </View>
                    </ScrollView>
                  </View>
                </Card.Content>
              </Card>
            )}

            {ameRecords.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No AME Records Found</Text>
                <Text style={styles.emptySubtext}>
                  Download the template, fill it with AME data, and upload it to get started.
                </Text>
              </View> 
            )}
          </Animated.View>
        </ScrollView>
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
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
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
    width: '48%',
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
    color: '#134E5E',
  },
  buttonLabelOutlined: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
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
    backgroundColor: '#134E5E',
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
  tableCellFixed: {
    minWidth: 120,
    maxWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dataCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 8,
  },
  searchContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    fontSize: 16,
  },
  searchInputContent: {
    paddingHorizontal: 12,
  },
  resultsBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  resultsCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tableWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tableScrollView: {
  },
  tableScrollContent: {
    paddingRight: 16,
  },
  tableContainer: {
    minWidth: 2000,
  },
  dataTable: {
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tableHeaderCell: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1565C0',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 60,
  },
  evenRow: {
    backgroundColor: '#FAFAFA',
  },
  oddRow: {
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serialCell: { width: 60 },
  idCell: { width: 120 },
  rankCell: { width: 80 },
  nameCell: { width: 150 },
  companyCell: { width: 80 },
  standardCell: { width: 100 },
  wideCell: { width: 140 },
  cellText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#424242',
    lineHeight: 18,
  },
  primaryText: {
    fontWeight: '600',
    color: '#1976D2',
  },
  nameText: {
    fontWeight: '500',
    color: '#2E7D32',
  },
  numericText: {
    fontFamily: 'monospace',
    fontWeight: '500',
    color: '#424242',
  },
  vitalText: {
    fontWeight: '500',
    color: '#D32F2F',
  },
  categoryText: {
    fontWeight: '500',
    color: '#F57C00',
  },
  dateText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#7B1FA2',
  },
  reasonText: {
    fontSize: 12,
    color: '#5D4037',
  },
  remarksText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#616161',
  },
  companyText: {
    fontWeight: '600',
    color: '#1976D2',
  },
  serialNumberBadge: {
    backgroundColor: '#E1F5FE',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
  },
  serialNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0277BD',
    textAlign: 'center',
  },
  rankBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
  },
  bmiBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bmiText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    textAlign: 'center',
  },
  bloodGroupBadge: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bloodGroupText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C62828',
    textAlign: 'center',
  },
});