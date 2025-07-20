import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  Animated,
  Easing,
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ImageBackground,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  getAMERecords,
  getAMEStatistics,
  getLowMedicalRecords,
  getLowMedicalStatistics,
  AMERecord,
  LowMedicalRecord,
  parseCategoryAllotmentDates
} from '../utils/sqlite';
import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart
} from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

interface ReportCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  shadowColor: string;
  count?: number;
  percentage?: number;
  onPress: () => void;
}

interface ReportsProps {
  navigation: any; 
}

const Reports: React.FC<ReportsProps> = ({ navigation }) => {
  const [ameStats, setAmeStats] = useState<any>({});
  const [lmcStats, setLmcStats] = useState<any>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatedValue] = useState(new Animated.Value(0));
  const [cardAnimation] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmingType, setConfirmingType] = useState<'ame' | 'lmc'>('ame');
  const [analyticsData, setAnalyticsData] = useState<{
    ageDistribution: Array<{ range: string; count: number; percentage: string }>;
    heightDistribution: Array<{ range: string; count: number; percentage: string }>;
    weightDistribution: Array<{ range: string; count: number; percentage: string }>;
    bmiDistribution: Array<{ category: string; count: number; percentage: string }>;
    bloodGroupDistribution: Array<{ group: string; count: number; percentage: string }>;
    companyDistribution: Array<{ company: string; count: number; percentage: string }>;
    pulseDistribution: Array<{ range: string; count: number; percentage: string }>;
    visionDistribution: Array<{ vision: string; count: number; percentage: string }>;
    waistHipRatioDistribution: Array<{ range: string; count: number; percentage: string }>;
    chestDistribution: Array<{ range: string; count: number; percentage: string }>;
    bloodPressureDistribution: Array<{ category: string; count: number; percentage: string }>;
  }>({
    ageDistribution: [],
    heightDistribution: [],
    weightDistribution: [],
    bmiDistribution: [],
    bloodGroupDistribution: [],
    companyDistribution: [],
    pulseDistribution: [],
    visionDistribution: [],
    waistHipRatioDistribution: [],
    chestDistribution: [],
    bloodPressureDistribution: []
  });

  const getHeaderPadding = () => {
    if (width < 350) return { horizontal: 15, vertical: 15 };
    if (width < 500) return { horizontal: 20, vertical: 20 };
    if (width < 800) return { horizontal: 25, vertical: 25 };
    return { horizontal: 30, vertical: 25 };
  };

  const getButtonSizes = () => {
    if (width < 350) return { backIcon: 24, downloadIcon: 16, buttonPadding: 6 };
    if (width < 500) return { backIcon: 26, downloadIcon: 18, buttonPadding: 8 };
    if (width < 800) return { backIcon: 28, downloadIcon: 20, buttonPadding: 10 };
    return { backIcon: 30, downloadIcon: 22, buttonPadding: 12 };
  };

  const getFontSizes = () => {
    if (width < 350) return { title: 16, button: 12 };
    if (width < 500) return { title: 18, button: 14 };
    if (width < 800) return { title: 20, button: 16 };
    return { title: 24, button: 18 };
  };

  const buttonSizes = getButtonSizes();
  const fontSizes = getFontSizes();
  const padding = getHeaderPadding();

  const handleAnalyticsPress = async () => {
    setShowAnalytics(true);
    await processAMEAnalytics();
  };

  const AnalyticsButton = () => {
    const buttonScale = cardAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    return (
      <Animated.View 
        style={[
          styles.analyticsButtonContainer,
          { transform: [{ scale: buttonScale }] }
        ]}
      >
        <TouchableOpacity
          style={styles.analyticsButton}
          onPress={handleAnalyticsPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2', '#6B73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.analyticsButtonGradient}
          >
            <View style={styles.analyticsButtonContent}>
              <View style={styles.analyticsButtonIcon}>
                <Ionicons name="analytics" size={28} color="#fff" />
              </View>
              <View style={styles.analyticsButtonText}>
                <Text style={styles.analyticsButtonTitle}>Advanced Analytics</Text>
                <Text style={styles.analyticsButtonSubtitle}>
                  Comprehensive data visualization & insights
                </Text>
              </View>
              <View style={styles.analyticsButtonArrow}>
                <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadStatistics();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const calculateDateDifference = (dateString: string) => {
    if (!dateString || dateString === '-' || dateString.trim() === '' || 
        dateString === '0000-00-00' || dateString === 'Not Set' || 
        dateString === 'Pending') {
      return null;
    }
    
    try {
      let targetDate;
      
      if (dateString.includes('.')) {
        const [day, month, year] = dateString.split('.').map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          return null;
        }
        targetDate = new Date(year, month - 1, day);
      } else {
        targetDate = new Date(dateString);
      }
      
      if (isNaN(targetDate.getTime())) {
        return null;
      }
      
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      const timeDiff = targetDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff;
    } catch (error) {
      console.error('Error calculating date difference:', error);
      return null;
    }
  };

  const isAMEPending = (record: AMERecord) => {
    return !record.date_of_ame || 
          record.date_of_ame === '-' || 
          record.date_of_ame.trim() === '' ||
          record.date_of_ame === '0000-00-00' ||
          record.date_of_ame === 'Not Set' ||
          record.date_of_ame === 'Pending';
  };

  const isAMEDueSoon = (record: AMERecord) => {
    if (isAMEPending(record)) return false;
    
    const daysDiff = calculateDateDifference(record.date_of_ame);
    if (daysDiff === null) return false;
    
    return daysDiff >= 0 && daysDiff <= 30;
  };

  const hasValidBoardDates = (record: LowMedicalRecord) => {
    const extractDate = (dateString: string) => {
      if (!dateString || dateString === '-' || dateString.trim() === '' || 
          dateString === '0000-00-00' || dateString === 'Not Set' || dateString === 'Pending') {
        return null;
      }
      
      const dateRegex = /\*?\*?(\d{1,2}\.\d{1,2}\.\d{2,4})/;
      const match = dateString.match(dateRegex);
      if (match) {
        return match[1];
      }
      
      if (dateString.includes('.') && dateString.split('.').length === 3) {
        return dateString;
      }
      
      return null;
    };

    const lastBoardDate = extractDate(record.last_medical_board_date);
    const nextBoardDate = extractDate(record.medical_board_due_date);
    
    return lastBoardDate || nextBoardDate;
  };

  const sanitizeChartData = (value: any) => {
    if (value === null || value === undefined || value === '' || value === '-') {
      return 0;
    }
    const num = parseFloat(value);
    return isNaN(num) || !isFinite(num) ? 0 : Math.max(num, 0);
  };

  const processAMEAnalytics = async () => {
    try {
      const ameRecords = await getAMERecords();
      
      const ageGroups = {
        '18-24': 0,
        '25-30': 0,
        '31-35': 0,
        '36-40': 0,
        '41-45': 0,
        '46-50': 0,
        '51-54': 0,
        '55 and above': 0
      };

      ameRecords.forEach(record => {
        const age = sanitizeChartData(record.age);

        if (age >= 18 && age <= 24) ageGroups['18-24']++;
        else if (age >= 25 && age <= 30) ageGroups['25-30']++;
        else if (age >= 31 && age <= 35) ageGroups['31-35']++;
        else if (age >= 36 && age <= 40) ageGroups['36-40']++;
        else if (age >= 41 && age <= 45) ageGroups['41-45']++;
        else if (age >= 46 && age <= 50) ageGroups['46-50']++;
        else if (age >= 51 && age <= 54) ageGroups['51-54']++;  
        else if (age >= 55) ageGroups['55 and above']++;
      });

      
      const heightGroups = { '150-160': 0, '161-170': 0, '171-180': 0, '181-190': 0, '190+': 0 };
      ameRecords.forEach(record => {
        const height = sanitizeChartData(record.height);
        if (height >= 150 && height <= 160) heightGroups['150-160']++;
        else if (height >= 161 && height <= 170) heightGroups['161-170']++;
        else if (height >= 171 && height <= 180) heightGroups['171-180']++;
        else if (height >= 181 && height <= 190) heightGroups['181-190']++;
        else if (height > 190) heightGroups['190+']++;
      });
      
      const weightGroups = { '50-60': 0, '61-70': 0, '71-80': 0, '81-90': 0, '90+': 0 };
      ameRecords.forEach(record => {
        const weight = sanitizeChartData(record.weight);
        if (weight >= 50 && weight <= 60) weightGroups['50-60']++;
        else if (weight >= 61 && weight <= 70) weightGroups['61-70']++;
        else if (weight >= 71 && weight <= 80) weightGroups['71-80']++;
        else if (weight >= 81 && weight <= 90) weightGroups['81-90']++;
        else if (weight > 90) weightGroups['90+']++;
      });
      
      const bmiGroups = { 'Underweight': 0, 'Normal': 0, 'Overweight': 0, 'Obese': 0 };
      ameRecords.forEach(record => {
        const height = sanitizeChartData(record.height) / 100;
        const weight = sanitizeChartData(record.weight);
        
        if (height > 0 && weight > 0) {
          const bmi = weight / (height * height);
          if (bmi < 18.5) bmiGroups['Underweight']++;
          else if (bmi >= 18.5 && bmi < 25) bmiGroups['Normal']++;
          else if (bmi >= 25 && bmi < 30) bmiGroups['Overweight']++;
          else if (bmi >= 30) bmiGroups['Obese']++;
        }
      });
      
      
      const bloodGroups: { [key: string]: number } = {};
      ameRecords.forEach(record => {
        const bg = record.blood_group || 'Unknown';
        bloodGroups[bg] = (bloodGroups[bg] || 0) + 1;
      });
      
      const companyGroups: { [key: string]: number } = {};
      ameRecords.forEach(record => {
        let company = record.unit || 'Unknown';
        
        company = company.trim().toUpperCase();
        
        company = company.replace(/\s*COY\s*/g, ' COY')
                        .replace(/\s*COMPANY\s*/g, ' COY')
                        .replace(/\s*-\s*/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
        
        companyGroups[company] = (companyGroups[company] || 0) + 1;
      });

      const sortedCompanies = Object.entries(companyGroups)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15);

      const finalCompanyGroups = Object.fromEntries(sortedCompanies);
      
      const pulseGroups = { '60-70': 0, '71-80': 0, '81-90': 0, '91-100': 0, '100+': 0 };
      ameRecords.forEach(record => {
        const pulse = sanitizeChartData(record.pulse);
        if (pulse >= 60 && pulse <= 70) pulseGroups['60-70']++;
        else if (pulse >= 71 && pulse <= 80) pulseGroups['71-80']++;
        else if (pulse >= 81 && pulse <= 90) pulseGroups['81-90']++;
        else if (pulse >= 91 && pulse <= 100) pulseGroups['91-100']++;
        else if (pulse > 100) pulseGroups['100+']++;
      });
      
      const visionGroups: { [key: string]: number } = {};
      ameRecords.forEach(record => {
        const vision = record.vision || 'Unknown';
        visionGroups[vision] = (visionGroups[vision] || 0) + 1;
      });
      
      const whrGroups = { '0.7-0.8': 0, '0.81-0.9': 0, '0.91-1.0': 0, '1.0+': 0 };
      ameRecords.forEach(record => {
        const whr = sanitizeChartData(record.waist_hip_ratio);
        if (whr >= 0.7 && whr <= 0.8) whrGroups['0.7-0.8']++;
        else if (whr >= 0.81 && whr <= 0.9) whrGroups['0.81-0.9']++;
        else if (whr >= 0.91 && whr <= 1.0) whrGroups['0.91-1.0']++;
        else if (whr > 1.0) whrGroups['1.0+']++;
      });
      
      const chestGroups = { '80-90': 0, '91-100': 0, '101-110': 0, '111-120': 0, '120+': 0 };
      ameRecords.forEach(record => {
        const chest = sanitizeChartData(record.chest);
        if (chest >= 80 && chest <= 90) chestGroups['80-90']++;
        else if (chest >= 91 && chest <= 100) chestGroups['91-100']++;
        else if (chest >= 101 && chest <= 110) chestGroups['101-110']++;
        else if (chest >= 111 && chest <= 120) chestGroups['111-120']++;
        else if (chest > 120) chestGroups['120+']++;
      });
      
      const bpGroups = { 'Normal': 0, 'High Normal': 0, 'Stage 1': 0, 'Stage 2': 0, 'Unknown': 0 };
      ameRecords.forEach(record => {
        const bp = record.blood_pressure || 'Unknown';
        if (bp === 'Unknown' || bp === '-' || bp.trim() === '') {
          bpGroups['Unknown']++;
        } else {
          if (bp.includes('120') || bp.includes('80')) bpGroups['Normal']++;
          else if (bp.includes('130') || bp.includes('85')) bpGroups['High Normal']++;
          else if (bp.includes('140') || bp.includes('90')) bpGroups['Stage 1']++;
          else if (bp.includes('160') || bp.includes('100')) bpGroups['Stage 2']++;
          else bpGroups['Unknown']++;
        }
      });
      
      setAnalyticsData({
        ageDistribution: Object.entries(ageGroups).map(([range, count]) => ({ range, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        heightDistribution: Object.entries(heightGroups).map(([range, count]) => ({ range, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        weightDistribution: Object.entries(weightGroups).map(([range, count]) => ({ range, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        bmiDistribution: Object.entries(bmiGroups).map(([category, count]) => ({ category, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        bloodGroupDistribution: Object.entries(bloodGroups).map(([group, count]) => ({ group, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        companyDistribution: Object.entries(companyGroups).map(([company, count]) => ({ company, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        pulseDistribution: Object.entries(pulseGroups).map(([range, count]) => ({ range, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        visionDistribution: Object.entries(visionGroups).map(([vision, count]) => ({ vision, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        waistHipRatioDistribution: Object.entries(whrGroups).map(([range, count]) => ({ range, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        chestDistribution: Object.entries(chestGroups).map(([range, count]) => ({ range, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) })),
        bloodPressureDistribution: Object.entries(bpGroups).map(([category, count]) => ({ category, count, percentage: ((count / ameRecords.length) * 100).toFixed(1) }))
      });
    } catch (error) {
      console.error('Error processing AME analytics:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      try {
        const ameStats = await getAMEStatistics();
        const ameRecords = await getAMERecords();
        const dueSoon = ameRecords.filter(record => isAMEDueSoon(record)).length;
        
        setAmeStats({
          total: ameStats.total,
          dueSoon: dueSoon
        });
      } catch (ameError) {
        console.error('Error loading AME statistics:', ameError);
        setAmeStats({ total: 0, dueSoon: 0 });
      }
      
      try {
        const lmcStats = await getLowMedicalStatistics();
        const lmcRecords = await getLowMedicalRecords();
        const withBoardDates = lmcRecords.filter(record => hasValidBoardDates(record)).length;
        const dueSoon = lmcRecords.filter(record => isLMCBoardDueSoon(record)).length; 
        
        setLmcStats({
          total: lmcStats.total,
          nextBoard: withBoardDates,
          dueSoon: dueSoon 
        });
      } catch (lmcError) {
        console.error('Error loading LMC statistics:', lmcError);
        setLmcStats({ total: 0, nextBoard: 0, dueSoon: 0 }); 
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportPress = async (reportType: string) => {
    setLoading(true);
    try {
      let data: any[] = [];

      switch (reportType) {
        case 'ame_due_soon': {
          const ameRecords = await getAMERecords();
          data = ameRecords.filter((record: AMERecord) => {
            const daysDiff = calculateDateDifference(record.date_of_ame);
            return daysDiff !== null && daysDiff >= 0 && daysDiff <= 30;
          });
          break;
        }
        case 'lmc_status': {
          try {
            const lmcRecords = await getLowMedicalRecords();
            data = lmcRecords.filter((record: LowMedicalRecord) => hasValidBoardDates(record));
          } catch (error) {
            console.error('Error filtering LMC records:', error);
            data = [];
          }
          break;
        }
        default:
          data = [];
      }

      setReportData(data);
      setSelectedReport(reportType);
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      const data = reportData;
      let htmlContent = '';
      
      if (reportType.startsWith('ame_')) {
        htmlContent = generateAMEReportHTML(data as AMERecord[], reportType);
      } else {
        htmlContent = generateLMCReportHTML(data as LowMedicalRecord[], reportType);
      }
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      const fileName = `MedTrack_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri);
      } else {
        Alert.alert('Success', `Report saved to ${newUri}`);
      }
    } catch (error) {
      console.error('Error generating PDF report:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  const generateAMEReportHTML = (data: AMERecord[], reportType: string): string => {
    const timestamp = new Date().toLocaleString();
    const reportTitle = reportType.replace('_', ' ').toUpperCase();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MedTrack AME Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .title { 
            font-size: 24px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 10px;
          }
          .subtitle { 
            font-size: 14px; 
            color: #666; 
            margin-bottom: 5px;
          }
          .record { 
            margin-bottom: 20px; 
            padding: 15px; 
            border: 1px solid #ddd; 
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .record-header { 
            font-weight: bold; 
            font-size: 14px; 
            color: #333; 
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .field { 
            margin-bottom: 5px; 
          }
          .field-label { 
            font-weight: bold; 
            color: #555; 
          }
          .field-value { 
            color: #333; 
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
          }
          .col { 
            flex: 1; 
            margin-right: 15px;
          }
          .col:last-child { 
            margin-right: 0;
          }
          .summary { 
            background-color: #e8f4f8; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px;
          }
          @media print {
            body { margin: 0; }
            .record { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">MEDTRACK - AME REPORT</div>
          <div class="subtitle">Generated: ${timestamp}</div>
          <div class="subtitle">Report Type: ${reportTitle}</div>
        </div>
        
        <div class="summary">
          <strong>Total Records: ${data.length}</strong>
        </div>
        
        ${data.map((record, index) => `
          <div class="record">
            <div class="record-header">
              ${index + 1}. ${record.full_name} (${record.personnel_id})
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">Rank:</span> 
                  <span class="field-value">${record.rank || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Company:</span> 
                  <span class="field-value">${record.unit || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Age:</span> 
                  <span class="field-value">${record.age || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">Height:</span> 
                  <span class="field-value">${record.height || 'N/A'} cm</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Weight:</span> 
                  <span class="field-value">${record.weight || 'N/A'} kg</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Chest:</span> 
                  <span class="field-value">${record.chest || 'N/A'} cm</span>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">Waist-Hip Ratio:</span> 
                  <span class="field-value">${record.waist_hip_ratio || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">BMI:</span> 
                  <span class="field-value">${record.bmi || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Pulse:</span> 
                  <span class="field-value">${record.pulse || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">Blood Group:</span> 
                  <span class="field-value">${record.blood_group || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Blood Pressure:</span> 
                  <span class="field-value">${record.blood_pressure || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Vision:</span> 
                  <span class="field-value">${record.vision || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">Previous Category:</span> 
                  <span class="field-value">${record.previous_medical_category || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">AME Date:</span> 
                  <span class="field-value">${record.date_of_ame || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">Present Category:</span> 
                  <span class="field-value">${record.present_category_awarded || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Category Reason:</span> 
                  <span class="field-value">${record.category_reason || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="field">
              <span class="field-label">Remarks:</span> 
              <span class="field-value">${record.remarks || 'N/A'}</span>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    
    return htmlContent;
  };

  const generateLMCReportHTML = (data: LowMedicalRecord[], reportType: string): string => {
    const timestamp = new Date().toLocaleString();
    const reportTitle = reportType.replace('_', ' ').toUpperCase();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MedTrack LMC Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .title { 
            font-size: 24px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 10px;
          }
          .subtitle { 
            font-size: 14px; 
            color: #666; 
            margin-bottom: 5px;
          }
          .record { 
            margin-bottom: 20px; 
            padding: 15px; 
            border: 1px solid #ddd; 
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .record-header { 
            font-weight: bold; 
            font-size: 14px; 
            color: #333; 
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .field { 
            margin-bottom: 8px; 
          }
          .field-label { 
            font-weight: bold; 
            color: #555; 
          }
          .field-value { 
            color: #333; 
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
          }
          .col { 
            flex: 1; 
            margin-right: 15px;
          }
          .col:last-child { 
            margin-right: 0;
          }
          .summary { 
            background-color: #e8f4f8; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px;
          }
          @media print {
            body { margin: 0; }
            .record { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">MEDTRACK - LMC REPORT</div>
          <div class="subtitle">Generated: ${timestamp}</div>
          <div class="subtitle">Report Type: ${reportTitle}</div>
        </div>
        
        <div class="summary">
          <strong>Total Records: ${data.length}</strong>
        </div>
        
        ${data.map((record, index) => `
          <div class="record">
            <div class="record-header">
              ${index + 1}. ${record.name} (${record.personnel_id})
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">SL NO:</span> 
                  <span class="field-value">${record.serial_no || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Rank:</span> 
                  <span class="field-value">${record.rank || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="field">
              <span class="field-label">Disease/Reason:</span> 
              <span class="field-value">${record.disease_reason || 'N/A'}</span>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">Medical Category:</span> 
                  <span class="field-value">${record.medical_category || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Category Allotment Dates:</span> 
                  <span class="field-value">${record.category_allotment_date || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="field">
                  <span class="field-label">Last Medical Board Date:</span> 
                  <span class="field-value">${record.last_medical_board_date || 'N/A'}</span>
                </div>
              </div>
              <div class="col">
                <div class="field">
                  <span class="field-label">Medical Board Due Date:</span> 
                  <span class="field-value">${record.medical_board_due_date || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="field">
              <span class="field-label">Remarks:</span> 
              <span class="field-value">${record.remarks || 'N/A'}</span>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    
    return htmlContent;
  };

  const generateAnalyticsReport = async () => {
    try {
      const htmlContent = generateAnalyticsReportHTML();
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      const fileName = `Visual_Analytics_${new Date().toISOString().split('T')[0]}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri);
      } else {
        Alert.alert('Success', `Analytics report saved to ${newUri}`);
      }
    } catch (error) {
      console.error('Error generating analytics PDF:', error);
      Alert.alert('Error', 'Failed to generate analytics PDF');
    }
  };

  const generateAnalyticsReportHTML = (): string => {
    const timestamp = new Date().toLocaleString();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MedTrack Analytics Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .title { 
            font-size: 24px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 10px;
          }
          .subtitle { 
            font-size: 14px; 
            color: #666; 
            margin-bottom: 5px;
          }
          .section { 
            margin-bottom: 30px; 
            padding: 20px; 
            border: 1px solid #ddd; 
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 15px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 5px;
          }
          .data-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
            padding: 8px;
            background-color: #fff;
            border-radius: 4px;
          }
          .data-label { 
            font-weight: bold; 
            color: #555; 
          }
          .data-value { 
            color: #333; 
          }
          .percentage-age { color: #8E44AD; font-weight: bold; }         
          .percentage-height { color: #2E86C1; font-weight: bold; }       
          .percentage-weight { color: #117A65; font-weight: bold; }       
          .percentage-bmi { color: #B03A2E; font-weight: bold; }          
          .percentage-blood { color: #663399; font-weight: bold; }        
          .percentage-pulse { color: #CA6F1E; font-weight: bold; }        
          .percentage-vision { color: #008080; font-weight: bold; }       
          .percentage-chest { color: #9A031E; font-weight: bold; }        
          .percentage-bp { color: #7D3C98; font-weight: bold; }           
          .percentage-waist { color: #A0522D; font-weight: bold; }        
          .percentage-coy { color: #9C2542; font-weight: bold; }          
          .summary { 
            background-color: #e8f4f8; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px;
          }
          .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px;
          }
          @media print {
            body { margin: 0; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">MEDTRACK - ADVANCED ANALYTICS REPORT</div>
          <div class="subtitle">Generated: ${timestamp}</div>
          <div class="subtitle">Comprehensive Medical Data Analysis</div>
        </div>
        
        <div class="summary">
          <strong>Report Summary:</strong> This report provides detailed analytics on medical examination data including demographic distributions, physical measurements, and health indicators.
        </div>
        
        <div class="grid">
          <div class="section">
            <div class="section-title">Age Distribution</div>
            ${analyticsData.ageDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.range} years:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-age">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Height Distribution</div>
            ${analyticsData.heightDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.range} cm:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-height">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Weight Distribution</div>
            ${analyticsData.weightDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.range} kg:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-weight">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">BMI Distribution</div>
            ${analyticsData.bmiDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.category}:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-bmi">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Blood Group Distribution</div>
            ${analyticsData.bloodGroupDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.group}:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-blood">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Pulse Distribution</div>
            ${analyticsData.pulseDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.range} bpm:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-pulse">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Vision Distribution</div>
            ${analyticsData.visionDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.vision}:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-vision">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Chest Distribution</div>
            ${analyticsData.chestDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.range} cm:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-chest">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Blood Pressure Distribution</div>
            ${analyticsData.bloodPressureDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.category}:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-bp">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Waist-Hip Ratio Distribution</div>
            ${analyticsData.waistHipRatioDistribution.map(item => `
              <div class="data-row">
                <span class="data-label">${item.range}:</span>
                <span class="data-value">${item.count} records</span>
                <span class="percentage-waist">(${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Top Companies/Units</div>
          ${analyticsData.companyDistribution.slice(0, 10).map(item => `
            <div class="data-row">
              <span class="data-label">${item.company}:</span>
              <span class="data-value">${item.count} personnel</span>
              <span class="percentage-coy">(${item.percentage}%)</span>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;
    
    return htmlContent;
  };

  const getAMEStatusText = (dateString: string) => {
    if (!dateString || dateString === '-' || dateString.trim() === '' ||
        dateString === '0000-00-00' || dateString === 'Not Set' || dateString === 'Pending') {
      return 'Not Set';
    }

    try {
      let targetDate;
      if (dateString.includes('.')) {
        const [day, month, year] = dateString.split('.').map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          return 'Invalid date';
        }
        targetDate = new Date(year, month - 1, day);
      } else {
        targetDate = new Date(dateString);
      }

      if (isNaN(targetDate.getTime())) {
        return 'Invalid date';
      }

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      const timeDiff = targetDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff < 0) {
        return 'Done';
      }

      if (daysDiff >= 0 && daysDiff <= 30) {
        if (daysDiff === 0) {
          return 'Due Today';
        }
        return `Due in ${daysDiff} days`;
      }

      return null;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getAMEStatusColor = (dateString: string) => {
    const status = getAMEStatusText(dateString);
    if (status === 'Not Set') return '#FF6B6B';
    if (status === 'Done') return '#4ECDC4';
    if (status && status.includes('Due')) return '#FFE66D';
    return '#A8E6CF';
  };

  const generateCompleteAMETableHTML = (data: AMERecord[]): string => {
    const timestamp = new Date().toLocaleString();
    
    const sortedData = [...data].sort((a, b) => {
        const serialA = parseInt(a.s_no?.toString() || '0') || 0;
        const serialB = parseInt(b.s_no?.toString() || '0') || 0;
        return serialA - serialB;
    });
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <title>Complete AME Table - MedTrack</title>
        <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 15px; 
              font-size: 10px; 
              line-height: 1.3;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .title { 
              font-size: 20px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 8px;
            }
            .subtitle { 
              font-size: 12px; 
              color: #666; 
              margin-bottom: 5px;
            }
            .table-container {
              width: 100%;
              overflow-x: auto;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              font-size: 8px;
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 3px 4px; 
              text-align: left;
              word-wrap: break-word;
              overflow: hidden;
              font-size: 7px;
              line-height: 1.1;
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
              font-size: 7px;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .summary { 
              background-color: #e8f4f8; 
              padding: 10px; 
              border-radius: 5px; 
              margin-bottom: 15px;
              font-size: 11px;
            }
            .ame-table th:nth-child(1), .ame-table td:nth-child(1) { width: 4%; }  
            .ame-table th:nth-child(2), .ame-table td:nth-child(2) { width: 8%; }  
            .ame-table th:nth-child(3), .ame-table td:nth-child(3) { width: 12%; } 
            .ame-table th:nth-child(4), .ame-table td:nth-child(4) { width: 6%; }  
            .ame-table th:nth-child(5), .ame-table td:nth-child(5) { width: 8%; }   
            .ame-table th:nth-child(6), .ame-table td:nth-child(6) { width: 4%; }   
            .ame-table th:nth-child(7), .ame-table td:nth-child(7) { width: 5%; }   
            .ame-table th:nth-child(8), .ame-table td:nth-child(8) { width: 5%; }   
            .ame-table th:nth-child(9), .ame-table td:nth-child(9) { width: 5%; }   
            .ame-table th:nth-child(10), .ame-table td:nth-child(10) { width: 5%; } 
            .ame-table th:nth-child(11), .ame-table td:nth-child(11) { width: 4%; } 
            .ame-table th:nth-child(12), .ame-table td:nth-child(12) { width: 5%; } 
            .ame-table th:nth-child(13), .ame-table td:nth-child(13) { width: 5%; } 
            .ame-table th:nth-child(14), .ame-table td:nth-child(14) { width: 7%; } 
            .ame-table th:nth-child(15), .ame-table td:nth-child(15) { width: 6%; } 
            .ame-table th:nth-child(16), .ame-table td:nth-child(16) { width: 6%; } 
            .ame-table th:nth-child(17), .ame-table td:nth-child(17) { width: 7%; } 
            .ame-table th:nth-child(18), .ame-table td:nth-child(18) { width: 6%; } 
            .ame-table th:nth-child(19), .ame-table td:nth-child(19) { width: 8%; }  
            .ame-table th:nth-child(20), .ame-table td:nth-child(20) { width: 10%; } 
            @media print {
              body { margin: 0; font-size: 6px; }
              table { font-size: 6px; }
              th, td { padding: 2px 3px; font-size: 6px; }
            }
        </style>
        </head>
        <body>
        <div class="header">
            <div class="title">MEDTRACK - COMPLETE AME RECORDS TABLE</div>
            <div class="subtitle">Generated: ${timestamp}</div>
        </div>
        
        <div class="summary">
            <strong>Total AME Records: ${data.length}</strong>
        </div>
        
        <div class="table-container">
            <table class="ame-table">
            <thead>
                <tr>
                  <th>S.No</th>
                  <th>Regt ID/IRLA No</th>
                  <th>Name</th>
                  <th>Rank</th>
                  <th>Unit</th>
                  <th>Age</th>
                  <th>Height</th>
                  <th>Weight</th>
                  <th>Chest</th>
                  <th>WHR</th>
                  <th>BMI</th>
                  <th>Pulse</th>
                  <th>Blood Group</th>
                  <th>Blood Pressure</th>
                  <th>Vision</th>
                  <th>Previous Category</th>
                  <th>AME Date</th>
                  <th>Present Category</th>
                  <th>Category Reason</th>
                  <th>Remarks</th>
                </tr>
            </thead>
            <tbody>
              ${sortedData.map((record, index) => `
              <tr>
                  <td>${record.s_no}</td>
                  <td>${record.personnel_id || '-'}</td>
                  <td>${record.full_name || '-'}</td>
                  <td>${record.rank || '-'}</td>
                  <td>${record.unit || '-'}</td>
                  <td>${record.age || '-'}</td>
                  <td>${record.height || '-'}</td>
                  <td>${record.weight || '-'}</td>
                  <td>${record.chest || '-'}</td>
                  <td>${record.waist_hip_ratio || '-'}</td>
                  <td>${record.bmi || '-'}</td>
                  <td>${record.pulse || '-'}</td>
                  <td>${record.blood_group || '-'}</td>
                  <td>${record.blood_pressure || '-'}</td>
                  <td>${record.vision || '-'}</td>
                  <td>${record.previous_medical_category || '-'}</td>
                  <td>${record.date_of_ame || '-'}</td>
                  <td>${record.present_category_awarded || '-'}</td>
                  <td>${record.category_reason || '-'}</td>
                  <td>${record.remarks || '-'}</td>
              </tr>
              `).join('')}
            </tbody>
            </table>
        </div>
        </body>
        </html>
    `;
    };

    const generateCompleteLMCTableHTML = (data: LowMedicalRecord[]): string => {
      const timestamp = new Date().toLocaleString();
      
      const sortedData = [...data].sort((a, b) => {
          const serialA = parseInt(a.serial_no?.toString() || '0') || 0;
          const serialB = parseInt(b.serial_no?.toString() || '0') || 0;
          return serialA - serialB;
      });
    
      return `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <title>Complete LMC Table - MedTrack</title>
        <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 15px; 
              font-size: 11px; 
              line-height: 1.3;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .title { 
              font-size: 20px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 8px;
            }
            .subtitle { 
              font-size: 12px; 
              color: #666; 
              margin-bottom: 5px;
            }
            .table-container {
              width: 100%;
              overflow-x: auto;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              font-size: 8px;
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 3px 4px; 
              text-align: left;
              word-wrap: break-word;
              overflow: hidden;
              font-size: 7px;
              line-height: 1.1;
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
              font-size: 7px;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .summary { 
              background-color: #e8f4f8; 
              padding: 10px; 
              border-radius: 5px; 
              margin-bottom: 15px;
              font-size: 11px;
            }
            .lmc-table th:nth-child(1), .lmc-table td:nth-child(1) { width: 6%; }   
            .lmc-table th:nth-child(2), .lmc-table td:nth-child(2) { width: 12%; }  
            .lmc-table th:nth-child(3), .lmc-table td:nth-child(3) { width: 15%; }   
            .lmc-table th:nth-child(4), .lmc-table td:nth-child(4) { width: 8%; }    
            .lmc-table th:nth-child(5), .lmc-table td:nth-child(5) { width: 30%; }   
            .lmc-table th:nth-child(6), .lmc-table td:nth-child(6) { width: 10%; }   
            .lmc-table th:nth-child(7), .lmc-table td:nth-child(7) { width: 12%; }   
            .lmc-table th:nth-child(8), .lmc-table td:nth-child(8) { width: 12%; }   
            .lmc-table th:nth-child(9), .lmc-table td:nth-child(9) { width: 12%; }   
            .lmc-table th:nth-child(10), .lmc-table td:nth-child(10) { width: 10%; }
            @media print {
              body { margin: 0; font-size: 6px; }
              table { font-size: 6px; }
              th, td { padding: 2px 3px; font-size: 6px; }
            }
        </style>
        </head>
        <body>
        <div class="header">
            <div class="title">MEDTRACK - COMPLETE LMC RECORDS TABLE</div>
            <div class="subtitle">Generated: ${timestamp}</div>
        </div>
        
        <div class="summary">
            <strong>Total LMC Records: ${data.length}</strong>
        </div>
        
        <div class="table-container">
            <table class="lmc-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Regt ID/IRLA No</th>
                <th>Name</th>
                <th>Rank</th>
                <th>Disease/Reason</th>
                <th>Medical Category</th>
                <th>Category Allotment Date</th>
                <th>Last Medical Board Date</th>
                <th>Medical Board Due Date</th>
                <th>Remarks</th>
              </tr>
          </thead>
          <tbody>
            ${sortedData.map((record, index) => `
            <tr>
                <td>${record.serial_no}</td>
                <td>${record.personnel_id || '-'}</td>
                <td>${record.name || '-'}</td>
                <td>${record.rank || '-'}</td>
                <td>${record.disease_reason || '-'}</td>
                <td>${record.medical_category || '-'}</td>
                <td>${(() => {
                  if (!record.category_allotment_date || record.category_allotment_date === '[]') {
                    return '-';
                  }
                  
                  try {
                    const parsedDates = JSON.parse(record.category_allotment_date);
                    if (Array.isArray(parsedDates) && parsedDates.length > 0) {
                      return parsedDates.filter(date => date && date.trim()).join(', ');
                    }
                  } catch (e) {
                    const dates = parseCategoryAllotmentDates(record.category_allotment_date);
                    if (dates.length > 0) {
                      return dates.join(', ');
                    }
                  }
                  
                  return record.category_allotment_date || '-';
                })()}</td>
                <td>${record.last_medical_board_date || '-'}</td>
                <td>${record.medical_board_due_date || '-'}</td>
                <td>${record.remarks || '-'}</td>
            </tr>
            `).join('')}
        </tbody>
            </table>
        </div>
        </body>
        </html>
    `;
  };

  const generateCompleteTablePDF = async (data: any[], tableType: 'ame' | 'lmc') => {
    try {
        let htmlContent = '';
        
        if (tableType === 'ame') {
        htmlContent = generateCompleteAMETableHTML(data as AMERecord[]);
        } else {
        htmlContent = generateCompleteLMCTableHTML(data as LowMedicalRecord[]);
        }
        
        const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        });
        
        const fileName = `MedTrack_Complete_${tableType.toUpperCase()}_Table_${new Date().toISOString().split('T')[0]}.pdf`;
        const newUri = FileSystem.documentDirectory + fileName;
        
        await FileSystem.moveAsync({
        from: uri,
        to: newUri,
        });
        
        if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri);
        } else {
        Alert.alert('Success', `PDF saved to ${newUri}`);
        }
    } catch (error) {
        console.error('Error generating complete table PDF:', error);
        Alert.alert('Error', 'Failed to generate PDF');
    }
    };

  const generateExcelReport = async (data: any[], tableType: 'ame' | 'lmc') => {
    try {
        let worksheetData: any[] = [];
        let sortedData: any[] = [];
        
        if (tableType === 'ame') {
            sortedData = [...data].sort((a, b) => {
                const serialA = parseInt(a.s_no?.toString() || '0') || 0;
                const serialB = parseInt(b.s_no?.toString() || '0') || 0;
                return serialA - serialB;
            });
            
            const headers = [
                'S.No', 'Regt ID/IRLA No', 'Full Name', 'Rank', 'Unit', 'Age', 'Height (cm)', 
                'Weight (kg)', 'Chest (cm)', 'Waist-Hip Ratio', 'BMI', 'Pulse', 
                'Blood Group', 'Blood Pressure', 'Vision', 'Previous Category', 
                'AME Date', 'Present Category', 'Category Reason', 'Remarks'
            ];
            
            worksheetData = [
                headers,
                ...sortedData.map((record: AMERecord, index: number) => [
                    record.s_no || (index + 1),  
                    record.personnel_id || '', 
                    record.full_name || '',
                    record.rank || '',
                    record.unit || '',
                    record.age || '',
                    record.height || '',
                    record.weight || '',
                    record.chest || '',
                    record.waist_hip_ratio || '',
                    record.bmi || '',
                    record.pulse || '',
                    record.blood_group || '',
                    record.blood_pressure || '',
                    record.vision || '',
                    record.previous_medical_category || '',
                    record.date_of_ame || '',
                    record.present_category_awarded || '',
                    record.category_reason || '',
                    record.remarks || ''
                ])
            ];
        } else {
            sortedData = [...data].sort((a, b) => {
                const serialA = parseInt(a.serial_no?.toString() || '0') || 0;
                const serialB = parseInt(b.serial_no?.toString() || '0') || 0;
                return serialA - serialB;
            });
            
            const headers = [
                'Serial No', 'Regt ID/IRLA No', 'Name', 'Rank', 'Disease/Reason', 
                'Medical Category', 'Category Allotment Dates', 'Last Medical Board Date', 
                'Medical Board Due Date', 'Remarks'
            ];
            
            worksheetData = [
                headers,
                ...sortedData.map((record: LowMedicalRecord, index: number) => {
                  let categoryDates = '';
                  if (!record.category_allotment_date || record.category_allotment_date === '[]') {
                      categoryDates = '';
                  } else {
                      try {
                          const parsedDates = JSON.parse(record.category_allotment_date);
                          if (Array.isArray(parsedDates) && parsedDates.length > 0) {
                              categoryDates = parsedDates.filter(date => date && date.trim()).join(', ');
                          }
                      } catch (e) {
                          const dates = parseCategoryAllotmentDates(record.category_allotment_date);
                          if (dates.length > 0) {
                              categoryDates = dates.join(', ');
                          } else {
                              categoryDates = record.category_allotment_date || '';
                          }
                      }
                  }
                  
                  return [
                      record.serial_no || (index + 1),
                      record.personnel_id || '',
                      record.name || '',
                      record.rank || '',
                      record.disease_reason || '',
                      record.medical_category || '',
                      categoryDates,  
                      record.last_medical_board_date || '',
                      record.medical_board_due_date || '',
                      record.remarks || ''
                  ];
              })
            ];
        }
        
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        
        const columnWidths = tableType === 'ame' ? [
            { wch: 8 },   
            { wch: 15 },  
            { wch: 35 },  
            { wch: 12 },  
            { wch: 10 }, 
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
            { wch: 18 }, 
            { wch: 15 }, 
            { wch: 18 }, 
            { wch: 20 }, 
            { wch: 25 }  
        ] : [
            { wch: 10 },  
            { wch: 18 },  
            { wch: 30 },  
            { wch: 12 },  
            { wch: 120 }, 
            { wch: 22 },  
            { wch: 35 },  
            { wch: 22 },  
            { wch: 22 },  
            { wch: 25 }   
        ];

        ws['!cols'] = columnWidths;
        
        if (tableType === 'lmc') {
            const diseaseReasonCol = 'E'; 
            for (let i = 2; i <= sortedData.length + 1; i++) {
                const cellAddress = `${diseaseReasonCol}${i}`;
                if (!ws[cellAddress]) ws[cellAddress] = {};
                ws[cellAddress].s = {
                    alignment: { wrapText: true, vertical: 'top' }
                };
            }
        }
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `${tableType.toUpperCase()} Records`);
        
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        
        const fileName = `MedTrack_Complete_${tableType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
        const fileUri = FileSystem.documentDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
        });
        
        if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        } else {
        Alert.alert('Success', `Excel file saved to ${fileUri}`);
        }
        
    } catch (error) {
        console.error('Error generating Excel report:', error);
        Alert.alert('Error', 'Failed to generate Excel report');
    }
  };

  const downloadCompleteTable = async (tableType: 'ame' | 'lmc', format: 'pdf' | 'excel') => {
    setLoading(true);
    try {
        let data: any[] = [];
        
        if (tableType === 'ame') {
        data = await getAMERecords();
        } else {
        data = await getLowMedicalRecords();
        }

        if (format === 'excel') {
        await generateExcelReport(data, tableType);
        } else {
        await generateCompleteTablePDF(data, tableType);
        }
        
    } catch (error) {
        console.error('Error downloading complete table:', error);
        Alert.alert('Error', `Failed to download ${tableType.toUpperCase()} table`);
    } finally {
        setLoading(false);
    }
    };

  const handleCompleteTableDownload = async (tableType: 'ame' | 'lmc') => {
    try {
        Alert.alert(
        'Download Format',
        'Choose your preferred download format:',
        [
            {
            text: 'Cancel',
            style: 'cancel'
            },
            {
            text: 'Excel (.xlsx)',
            onPress: () => downloadCompleteTable(tableType, 'excel')
            },
            {
            text: 'PDF',
            onPress: () => downloadCompleteTable(tableType, 'pdf')
            }
        ],
        { cancelable: true }
        );
    } catch (error) {
        console.error('Error in handleCompleteTableDownload:', error);
        Alert.alert('Error', 'Failed to initiate download');
    }
  };

  const reportCards: ReportCard[] = [
    {
      id: 'ame_due_soon',
      title: 'AME Due Soon',
      subtitle: `${ameStats.dueSoon || 0} upcoming within 30 days`, 
      icon: 'time-outline',
      gradient: ['#FF6B6B', '#FF8E53', '#FF6B9D'],
      shadowColor: '#FF6B6B',
      count: ameStats.dueSoon,
      onPress: () => handleReportPress('ame_due_soon'),
    },
    {
      id: 'lmc_status',
      title: 'Medical Board Schedule', 
      subtitle: `${lmcStats.nextBoard || 0} records with board dates${lmcStats.dueSoon ? ` • ${lmcStats.dueSoon} due within 30 days` : ''}`,
      icon: 'medical-outline',
      gradient: ['#4ECDC4', '#44A08D', '#096DD9'],
      shadowColor: '#4ECDC4',
      count: lmcStats.nextBoard,
      onPress: () => handleReportPress('lmc_status'),
    },
    {
        id: 'ame_complete_table',
        title: 'Complete AME Data',
        subtitle: `Download all ${ameStats.total || 0} AME records`,
        icon: 'download-outline',
        gradient: ['#667eea', '#764ba2', '#f093fb'],
        shadowColor: '#667eea',
        count: ameStats.total,
        onPress: () => handleCompleteTableDownload('ame'),
    },
    {
        id: 'lmc_complete_table', 
        title: 'Complete LMC Data',
        subtitle: `Download all ${lmcStats.total || 0} LMC records`,
        icon: 'download-outline',
        gradient: ['#f093fb', '#f5576c', '#4facfe'],
        shadowColor: '#f093fb',
        count: lmcStats.total,
        onPress: () => handleCompleteTableDownload('lmc'),
    },
  ];

  const isLMCBoardDueSoon = (record: LowMedicalRecord) => {
    const extractDate = (dateString: string) => {
      if (!dateString || dateString === '-' || dateString.trim() === '' ||
          dateString === '0000-00-00' || dateString === 'Not Set' || dateString === 'Pending') {
        return null;
      }
      const dateRegex = /\*?\*?(\d{1,2}\.\d{1,2}\.\d{2,4})/;
      const match = dateString.match(dateRegex);
      if (match) {
        return match[1];
      }
      if (dateString.includes('.') && dateString.split('.').length === 3) {
        return dateString;
      }
      return null;
    };

    const dueDateString = extractDate(record.medical_board_due_date);
    if (!dueDateString) return false;
    
    const daysDiff = calculateDateDifference(dueDateString);
    if (daysDiff === null) return false;
    
    return daysDiff >= 0 && daysDiff <= 30;
  };

  const getLMCBoardStatusText = (dateString: string) => {
    const extractDate = (dateString: string) => {
      if (!dateString || dateString === '-' || dateString.trim() === '' ||
          dateString === '0000-00-00' || dateString === 'Not Set' || dateString === 'Pending') {
        return null;
      }
      
      const dateRegex = /\*?\*?(\d{1,2}\.\d{1,2}\.\d{2,4})/;
      const match = dateString.match(dateRegex);
      if (match) {
        return match[1];
      }
      
      if (dateString.includes('.') && dateString.split('.').length === 3) {
        return dateString;
      }
      
      return null;
    };

    const extractedDate = extractDate(dateString);
    if (!extractedDate) {
      return 'Not Set';
    }

    try {
      let targetDate;
      if (extractedDate.includes('.')) {
        const parts = extractedDate.split('.');
        let [day, month, year] = parts.map(Number);
        
        if (year < 100) {
          year += 2000;
        }
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          return 'Invalid date';
        }
        targetDate = new Date(year, month - 1, day);
      } else {
        targetDate = new Date(extractedDate);
      }

      if (isNaN(targetDate.getTime())) {
        return 'Invalid date';
      }

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      const timeDiff = targetDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff < 0) {
        return 'Done';
      }

      if (daysDiff === 0) {
        return 'Due Today';
      } else if (daysDiff <= 30) {
        return `Due in ${daysDiff} days`;
      } else if (daysDiff <= 365) {
        return `Due in ${daysDiff} days`;
      } else {
        const years = Math.floor(daysDiff / 365);
        const remainingDays = daysDiff % 365;
        if (remainingDays === 0) {
          return years === 1 ? 'Due in 1 year' : `Due in ${years} years`;
        } else {
          return `Due in ${years} year${years > 1 ? 's' : ''} ${remainingDays} days`;
        }
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getLMCBoardStatusColor = (dateString: string) => {
    const status = getLMCBoardStatusText(dateString);
    if (status === 'Not Set') return '#FF6B6B';
    if (status === 'Done') return '#4ECDC4';
    if (status === 'Due Today') return '#FF8C00';
    if (status && status.includes('Due in')) return '#FFE66D';
    return '#A8E6CF';
  };

  const renderReportCard = (item: ReportCard, index: number) => {
    const cardScale = cardAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    const cardOpacity = cardAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const cardTranslateY = cardAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.reportCard,
          {
            transform: [
              { scale: cardScale },
              { translateY: cardTranslateY }
            ],
            opacity: cardOpacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={item.onPress}
          activeOpacity={0.9}
          style={styles.cardTouchable}
        >
          <LinearGradient
            colors={item.gradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <BlurView style={styles.cardIconContainer}>
                  <Ionicons name={item.icon as any} size={32} color="#fff" />
                </BlurView>
                <View style={styles.cardStats}>
                  <Text style={styles.cardCount}>{item.count}</Text>
                  <Text style={styles.cardCountLabel}>Records</Text>
                </View>
              </View>
              
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.cardFooter}>
                <BlurView style={styles.cardAction}>
                  <Text style={styles.cardActionText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                </BlurView>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const processChartData = (data: any[], labelKey: string, valueKey: string) => {
    const filteredData = data.filter(item => {
      const value = item[valueKey];
      return value !== undefined && value !== null && !isNaN(value) && isFinite(value) && value >= 0;
    });
    
    if (filteredData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0]
        }]
      };
    }
    
    return {
      labels: filteredData.map((item: any) => item[labelKey].toString()),
      datasets: [{
        data: filteredData.map((item: any) => Math.max(parseFloat(item[valueKey]) || 0, 0))
      }]
    };
  };

  const processPieData = (data: any[], labelKey: string, valueKey: string) => {
    const premiumColors = [
      '#D4AF37', 
      '#C0C0C0', 
      '#8C7853', 
      '#6A0572', 
      '#34568B', 
      '#009688', 
      '#E07A5F', 
      '#FFB400', 
      '#B76E79', 
      '#3E2723', 
      '#607D8B',
      '#008080', 
      '#4B0082', 
      '#708090', 
      '#800000', 
      '#2C3E50', 
      '#A0522D', 
    ];

    const filteredData = data.filter(item => {
      const value = item[valueKey];
      return value !== undefined && value !== null && !isNaN(value) && isFinite(value) && value > 0;
    });

    if (filteredData.length === 0) {
      return [{
        name: 'No Data',
        population: 1,
        color: '#FF6B6B',
        legendFontColor: '#fff',
        legendFontSize: 12,
      }];
    }

    return filteredData.map((item: any, index: number) => {
      const label = item[labelKey].toString().toLowerCase();
      const value = Math.max(parseFloat(item[valueKey]) || 0, 1);

      let color = premiumColors[index % premiumColors.length];

      if (label.includes('obese')) color = '#FF6B6B';           
      else if (label.includes('overweight')) color = '#FFA500'; 
      else if (label.includes('normal')) color = '#4CAF50';     

      return {
        name: item[labelKey].toString(),
        population: value,
        color,
        legendFontColor: '#fff',
        legendFontSize: 12,
      };
    });
  };

  const ChartSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={{ overflow: 'hidden' }}> 
        {children}
      </View>
    </View>
  );

  const getChartWidth = () => {
    const padding = width < 350 ? 10 : width < 500 ? 15 : 20; 
    const minWidth = 320;
    const maxWidth = width > 800 ? 750 : width - 30;
    
    let calculatedWidth = width - padding;
    
    if (calculatedWidth < minWidth) {
      calculatedWidth = minWidth;
    } else if (calculatedWidth > maxWidth) {
      calculatedWidth = maxWidth;
    }
    
    return calculatedWidth;
  };

  const getChartHeight = () => {
    if (width < 350) return 220; 
    if (width < 500) return 250; 
    if (width < 800) return 280; 
    return 300; 
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: '#1e1e2e',
    backgroundGradientTo: '#2a2a3a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#4ECDC4"
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: 'bold'
    },
    fillShadowGradient: '#4ECDC4',
    fillShadowGradientOpacity: 0.3,
    strokeWidth: 3,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    showValuesOnTopOfBars: true,
    formatYLabel: (value: any) => Math.round(value).toString()
  };

  const processVisionProgressData = (distribution: { vision: string; count: number }[]) => {
    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const labels: string[] = [];
    const data: number[] = [];
    const percentages: { label: string; percent: number }[] = [];

    distribution.forEach(item => {
      const percent = total > 0 ? (item.count / total) * 100 : 0;
      labels.push(item.vision);
      data.push(percent / 100); 
      percentages.push({
        label: item.vision,
        percent: Math.round(percent),
      });
    });

    return { labels, data, percentages };
  };

  const { labels, data, percentages } = processVisionProgressData(analyticsData.visionDistribution);

  const renderAnalyticsModal = () => {
    return (
      <Modal
        visible={showAnalytics}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalytics(false)}
      >
        <View style={styles.analyticsModalContainer}>
          <LinearGradient
            colors={['#0F0F23', '#1A1A2E', '#16213E']}
            style={styles.analyticsModalGradient}
          >
            <StatusBar barStyle="light-content" />
            
            <View style={styles.analyticsModalContent}>
              <View style={[styles.analyticsModalHeader, { 
                paddingHorizontal: padding.horizontal, 
                paddingVertical: padding.vertical 
              }]}>
                <TouchableOpacity
                  onPress={() => setShowAnalytics(false)}
                  activeOpacity={0.85}
                  style={{
                    position: 'absolute',
                    top: Platform.OS === 'ios' ? 50 : 20,
                    left: 16,
                    zIndex: 999,
                    borderRadius: 18,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <BlurView intensity={50} tint="dark" style={{
                    padding: 10,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </BlurView>
                </TouchableOpacity>
                
                <Text style={[styles.analyticsModalTitle, { fontSize: fontSizes.title }]}>
                  {width < 350 ? "Analytics" : "Analytics Dashboard"}
                </Text>
                
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={generateAnalyticsReport}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="download" 
                    size={buttonSizes.downloadIcon} 
                    color="#fff" 
                  />
                  {width >= 350 && (
                    <Text style={[styles.downloadButtonText, { fontSize: fontSizes.button }]}>
                      {width < 500 ? "PDF" : "Download PDF"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.analyticsModalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.analyticsScrollContent}
              >
                {analyticsData.ageDistribution?.length > 0 && (
                  <ChartSection title="Age Distribution">
                    <BarChart
                      data={processChartData(analyticsData.ageDistribution, 'range', 'count')}
                      width={getChartWidth()}
                      height={getChartHeight()}
                      chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                      }}
                      style={styles.chart}
                      showValuesOnTopOfBars={true}
                      showBarTops={true}
                      fromZero={true}
                      yAxisLabel=""
                      yAxisSuffix=""
                    />
                  </ChartSection>
                )}

                <ChartSection title="BMI Distribution">
                  <PieChart
                    data={processPieData(analyticsData.bmiDistribution, 'category', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight() + 40} 
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft={width < 350 ? "15" : width < 500 ? "20" : "30"}
                    style={styles.chart}
                    hasLegend={true}
                    absolute={false}
                    center={[10, 10]}
                  />
                </ChartSection>

                <ChartSection title="Height Distribution">
                  <LineChart
                    data={processChartData(analyticsData.heightDistribution, 'range', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight()}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`,
                      fillShadowGradient: '#66BB6A',
                      fillShadowGradientOpacity: 0.4,
                    }}
                    style={styles.chart}
                    bezier
                    withDots={true}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLines={true}
                    withHorizontalLines={true}
                  />
                </ChartSection>

                <ChartSection title="Weight Distribution">
                  <LineChart
                    data={processChartData(analyticsData.weightDistribution, 'range', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight()}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
                      fillShadowGradient: '#FF5722',
                      fillShadowGradientOpacity: 0.3,
                    }}
                    style={styles.chart}
                    bezier
                    withDots={true}
                    withShadow={true}
                  />
                </ChartSection>

                <ChartSection title="Blood Group Distribution">
                  <BarChart
                    data={processChartData(analyticsData.bloodGroupDistribution, 'group', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight()}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
                      propsForLabels: {
                        fill: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                    showBarTops={true}
                    fromZero={true}
                    yAxisLabel=""
                    yAxisSuffix=""
                  />
                </ChartSection>

                <ChartSection title="Coy Distribution">
                  <PieChart
                    data={processPieData(analyticsData.companyDistribution, 'company', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight() + 60}  
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft={width < 350 ? "15" : width < 500 ? "20" : "35"}
                    style={styles.chart}
                    hasLegend={true}
                    absolute={false}
                    center={[20, 20]}
                  />
                </ChartSection>

                <ChartSection title="Vision Distribution">
                  <ProgressChart
                    data={{
                      labels,
                      data,
                    }}
                    width={getChartWidth()}
                    height={getChartHeight() + 20}
                    strokeWidth={20} 
                    radius={40}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                    }}
                    style={styles.chart}
                    hideLegend={false}
                  />

                  <View style={[styles.visionSummaryContainer, { marginTop: 15 }]}>
                    <View style={styles.visionSummaryRow}>
                      {percentages.map((item, index) => {
                        const colors = ['#4CAF50', '#FF9800', '#F44336', '#2196F3', '#9C27B0'];
                        return (
                          <View key={index} style={[styles.visionIndicator, { flex: 1, alignItems: 'center' }]}>
                            <View style={[styles.visionDot, { 
                              backgroundColor: colors[index % colors.length],
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              marginBottom: 5
                            }]} />
                            <Text style={[styles.visionLabel, { fontSize: 11, textAlign: 'center' }]}>{item.label}</Text>
                            <Text style={[styles.visionValue, { 
                              fontSize: 14, 
                              fontWeight: 'bold', 
                              color: colors[index % colors.length],
                              textAlign: 'center'
                            }]}>{item.percent}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </ChartSection>

                <ChartSection title="Pulse Rate Distribution">
                  <LineChart
                    data={processChartData(analyticsData.pulseDistribution, 'range', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight()}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`,
                      fillShadowGradient: '#E91E63',
                      fillShadowGradientOpacity: 0.4,
                    }}
                    style={styles.chart}
                    bezier
                    withDots={true}
                    withInnerLines={true}
                  />
                </ChartSection>

                <ChartSection title="Waist Hip Ratio Distribution">
                  <LineChart
                    data={processChartData(analyticsData.waistHipRatioDistribution, 'range', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight()}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(186, 104, 200, ${opacity})`,
                    }}
                    style={styles.chart}
                  />
                </ChartSection>

                <ChartSection title="Chest Measurement Distribution">
                  <BarChart
                    data={processChartData(analyticsData.chestDistribution, 'range', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight()}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(255, 183, 77, ${opacity})`,
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                    yAxisLabel=""
                    yAxisSuffix=""
                  />
                </ChartSection>

                <ChartSection title="Blood Pressure Distribution">
                  <PieChart
                    data={processPieData(analyticsData.bloodPressureDistribution, 'category', 'count')}
                    width={getChartWidth()}
                    height={getChartHeight()}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft={width < 350 ? "10" : width < 500 ? "15" : "20"}
                    style={styles.chart}
                  />
                </ChartSection>
              </ScrollView>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  const renderReportModal = () => {
    const getReportTitle = (reportType: string) => {
      const titles: { [key: string]: string } = {
        'ame_due_soon': 'AME Due Soon',
        'lmc_status': 'Medical Board Appear Date Schedule',
      };
      return titles[reportType] || 'Report';
    };

    const renderReportItem = ({ item, index }: { item: any; index: number }) => {
      const isAME = selectedReport?.startsWith('ame_');
      
      return (
        <View style={styles.reportItem}>
          <View style={styles.reportItemContent}>
            <View style={styles.reportItemHeader}>
              <View style={styles.reportItemTitleContainer}>
                <Text style={styles.reportItemTitle}>
                  {isAME ? item.full_name : item.name}
                </Text>
                <View style={styles.reportItemBadge}>
                  <Text style={styles.reportItemId}>{item.personnel_id || item.irla_no}</Text>
                </View>
              </View>
              <View style={styles.reportItemRank}>
                <Text style={styles.reportItemRankText}>{item.rank}</Text>
              </View>
            </View>
            
            <View style={styles.reportItemDetails}>
              {isAME ? (
                <>
                  <View style={styles.reportItemRow}>
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="business-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>Company</Text>
                    </View>
                    <Text style={styles.reportItemValue}>{item.unit}</Text>
                  </View>
                  <View style={styles.reportItemRow}>
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="calendar-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>AME Date</Text>
                    </View>
                    <Text style={styles.reportItemValue}>
                      {item.date_of_ame && item.date_of_ame !== '-' && item.date_of_ame.trim() !== '' && 
                      item.date_of_ame !== '0000-00-00' && item.date_of_ame !== 'Not Set' && item.date_of_ame !== 'Pending' 
                      ? item.date_of_ame : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.reportItemRow}>
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="pulse-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>Status</Text>
                    </View>
                    {(() => {
                      const status = getAMEStatusText(item.date_of_ame);
                      if (status) {
                        return (
                          <View style={styles.statusContainer}>
                            <View style={[styles.statusDot, { backgroundColor: getAMEStatusColor(item.date_of_ame) }]} />
                            <Text style={[styles.reportItemValue, { color: getAMEStatusColor(item.date_of_ame) }]}>
                              {status}
                            </Text>
                          </View>
                        );
                      } else {
                        return <Text style={styles.reportItemValue}>Scheduled</Text>;
                      }
                    })()}
                  </View>
                  <View style={styles.reportItemRow}>
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="shield-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>Category</Text>
                    </View>
                    <Text style={styles.reportItemValue}>
                      {item.present_category_awarded || 'Pending'}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.reportItemRow}>
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="medical-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>Disease/Reason</Text>
                    </View>
                    <Text style={styles.reportItemValue}>
                      {item.disease_reason || 'Not specified'}
                    </Text>
                  </View>
                  <View style={styles.reportItemRow}>
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="clipboard-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>Medical Category</Text>
                    </View>
                    <Text style={styles.reportItemValue}>
                      {item.medical_category || 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.reportItemRow}>
                    <Text style={styles.reportItemLabel}>Last Board Date</Text>
                    <Text style={styles.reportItemValue}>
                      {(() => {
                        const extractDate = (dateString: string) => {
                          if (!dateString || dateString === '-' || dateString.trim() === '' || 
                              dateString === '0000-00-00' || dateString === 'Not Set' || dateString === 'Pending') {
                            return 'Not set';
                          }
                          const dateRegex = /\*?\*?(\d{1,2}\.\d{1,2}\.\d{2,4})/;
                          const match = dateString.match(dateRegex);
                          return match ? match[1] : (dateString.includes('.') ? dateString : 'Not set');
                        };
                        return extractDate(item.last_medical_board_date);
                      })()}
                    </Text>
                  </View>
                  <View style={styles.reportItemRow}>
                    <Text style={styles.reportItemLabel}>Next Board Date</Text>
                    <Text style={styles.reportItemValue}>
                      {(() => {
                        const extractDate = (dateString: string) => {
                          if (!dateString || dateString === '-' || dateString.trim() === '' || 
                              dateString === '0000-00-00' || dateString === 'Not Set' || dateString === 'Pending') {
                            return 'Not set';
                          }
                          const dateRegex = /\*?\*?(\d{1,2}\.\d{1,2}\.\d{2,4})/;
                          const match = dateString.match(dateRegex);
                          return match ? match[1] : (dateString.includes('.') ? dateString : 'Not set');
                        };
                        return extractDate(item.medical_board_due_date);
                      })()}
                    </Text>
                  </View>
                  <View style={styles.reportItemRow}>
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="pulse-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>Board Status</Text>
                    </View>
                    {(() => {
                      const status = getLMCBoardStatusText(item.medical_board_due_date);
                      if (status) {
                        return (
                          <View style={styles.statusContainer}>
                            <View style={[styles.statusDot, { backgroundColor: getLMCBoardStatusColor(item.medical_board_due_date) }]} />
                            <Text style={[styles.reportItemValue, { color: getLMCBoardStatusColor(item.medical_board_due_date) }]}>
                              {status}
                            </Text>
                          </View>
                        );
                      } else {
                        return <Text style={styles.reportItemValue}>Scheduled</Text>;
                      }
                    })()}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      );
    };

    return (
      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.reportModalContainer}>
          <LinearGradient
            colors={['#0A0A0A', '#1A1A1A', '#2A2A2A']}
            style={styles.reportModalGradient}
          >
            <StatusBar barStyle="light-content" />
            
            <View style={styles.reportModalContent}>
              <View style={styles.reportModalHeader}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setSelectedReport(null)}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.reportModalTitle}>
                  {selectedReport ? getReportTitle(selectedReport) : 'Report'}
                </Text>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => selectedReport && generateReport(selectedReport)}
                >
                  <Ionicons name="share-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.reportModalBody}>
                {loading ? (
                  <View style={styles.reportLoadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.reportLoadingText}>Loading report data...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.reportStatsHeader}>
                      <View style={styles.reportStatsItem}>
                        <Text style={styles.reportStatsValue}>{reportData.length}</Text>
                        <Text style={styles.reportStatsLabel}>Total Records</Text>
                      </View>
                      <View style={styles.reportStatsDivider} />
                      <View style={styles.reportStatsItem}>
                        <Text style={styles.reportStatsValue}>
                          {selectedReport?.includes('ame') ? 'AME' : 'LMC'}
                        </Text>
                        <Text style={styles.reportStatsLabel}>Type</Text>
                      </View>
                    </View>

                    <FlatList
                      data={reportData}
                      renderItem={renderReportItem}
                      keyExtractor={(item, index) => `${item.personnel_id || item.irla_no}-${index}`}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.reportListContent}
                      ItemSeparatorComponent={() => <View style={styles.reportItemSeparator} />}
                    />
                  </>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      
      <ImageBackground
        source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0cm9rZSB3aWR0aD0iMC4xIiBzdHJva2U9IiMxNDE0MTQiIGZpbGw9InRyYW5zcGFyZW50Ii8+CjwvcGF0dGVybj4KPC9kZWZzPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4K' }}
        style={styles.backgroundImage}
        resizeMode="repeat"
      >
        <LinearGradient
          colors={['#0A0A0A', '#1A1A1A', '#0F0F0F']}
          style={styles.gradientOverlay}
        >
          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#007AFF"
                colors={['#007AFF']}
              />
            }
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: headerOpacity,
                  transform: [{ scale: headerScale }]
                }
              ]}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Health Reports</Text>
                  <Text style={styles.headerSubtitle}>
                    Comprehensive medical tracking and analytics
                  </Text>
                </View>
                <View style={styles.headerStats}>
                  <View style={styles.headerStatItem}>
                    <Text style={styles.headerStatValue}>{(ameStats.total || 0) + (lmcStats.total || 0)}</Text>
                    <Text style={styles.headerStatLabel}>Total</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <AnalyticsButton />

            <View style={styles.reportsGrid}>
              {reportCards.map((item, index) => renderReportCard(item, index))}
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('DashboardDoctor')}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            <View style={styles.footerSpacing} />
          </Animated.ScrollView>
        </LinearGradient>
      </ImageBackground>

      {renderAnalyticsModal()}
      {renderReportModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  visionSummaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  visionSummaryRow: {
    flexDirection: width < 500 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  visionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    minWidth: width < 500 ? '100%' : 150,
  },
  visionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  visionLabel: {
    color: '#B0B0B0',
    flex: 1,
    marginRight: 8,
  },
  visionValue: {
    color: '#fff',
    fontWeight: '600',
  },
  chartContainer: {
    marginVertical: width < 350 ? 10 : width < 500 ? 15 : 20,
    paddingHorizontal: width < 350 ? 10 : 15,
  },
  chartTitle: {
    fontSize: width < 350 ? 16 : width < 500 ? 18 : width < 800 ? 20 : 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: width < 350 ? 8 : width < 500 ? 10 : 15,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  analyticsScrollContent: {
    paddingBottom: width < 350 ? 20 : width < 500 ? 30 : 40,
  },
  analyticsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  analyticsModalContent: {
    flex: 1,
    paddingHorizontal: 20, 
  },
  statusButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDialogContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 320,
    width: '100%',
  },
  confirmDialogContent: {
    alignItems: 'center',
  },
  confirmDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmDialogMessage: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmDialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmDialogButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#4A5568',
  },
  confirmButton: {
    backgroundColor: '#4ECDC4',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
    lineHeight: 22,
  },
  headerStats: {
    alignItems: 'center',
  },
  headerStatItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  headerStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analyticsButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  analyticsButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  analyticsButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  analyticsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  analyticsButtonText: {
    flex: 1,
  },
  analyticsButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  analyticsButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  analyticsButtonArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportsGrid: {
    paddingHorizontal: 24,
    gap: 20,
  },
  reportCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  cardTouchable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 24,
    minHeight: 180,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStats: {
    alignItems: 'flex-end',
  },
  cardCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  cardCountLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cardActionText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
  footerSpacing: {
    height: 40,
  },
  analyticsModalGradient: {
    flex: 1,
  },
  analyticsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  modalBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsModalScroll: {
    flex: 1,
  },
  analyticsStatsGrid: {
    marginBottom: 32,
  },
  analyticsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsStat: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  analyticsStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  analyticsStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  analyticsChart: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsChartHeader: {
    marginBottom: 16,
  },
  analyticsChartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  analyticsChartSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  progressBarContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  analyticsSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  reportModalContainer: {
    flex: 1,
  },
  reportModalGradient: {
    flex: 1,
  },
  reportModalContent: {
    flex: 1,
    paddingTop: 50,
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  reportModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  modalActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportModalBody: {
    flex: 1,
  },
  reportLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportLoadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    fontWeight: '500',
  },
  reportStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 24,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reportStatsItem: {
    flex: 1,
    alignItems: 'center',
  },
  reportStatsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reportStatsLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  reportStatsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  reportListContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  reportItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reportItemContent: {
    flex: 1,
  },
  reportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reportItemTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  reportItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reportItemBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  reportItemId: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  reportItemRank: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportItemRankText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reportItemDetails: {
    gap: 12,
  },
  reportItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportItemLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportItemLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginLeft: 8,
  },
  reportItemValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  reportItemSeparator: {
    height: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  backButton: {
    marginTop: 32,
    alignSelf: 'center',            
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,          
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 160,                  
    alignItems: 'center',    
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
});

export default Reports;