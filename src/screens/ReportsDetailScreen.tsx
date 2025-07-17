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
  Share,
  Animated,
  Easing,
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import {
  getAMERecords,
  getAMEStatistics,
  getLowMedicalRecords,
  getLowMedicalStatistics,
  AMERecord,
  LowMedicalRecord,
} from '../utils/sqlite';

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

  const handleAnalyticsPress = () => {
    setShowAnalytics(true);
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
    const hasLastBoard = record.last_medical_board_date && 
                        record.last_medical_board_date !== '-' && 
                        record.last_medical_board_date.trim() !== '' &&
                        record.last_medical_board_date !== '0000-00-00' &&
                        record.last_medical_board_date !== 'Not Set' &&
                        record.last_medical_board_date !== 'Pending';
    
    const hasNextBoard = record.medical_board_due_date && 
                        record.medical_board_due_date !== '-' && 
                        record.medical_board_due_date.trim() !== '' &&
                        record.medical_board_due_date !== '0000-00-00' &&
                        record.medical_board_due_date !== 'Not Set' &&
                        record.medical_board_due_date !== 'Pending';
    
    return hasLastBoard || hasNextBoard;
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      try {
        const ameStats = getAMEStatistics();
        const ameRecords = getAMERecords();
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
        const lmcStats = getLowMedicalStatistics();
        const lmcRecords = getLowMedicalRecords();
        const withBoardDates = lmcRecords.filter(record => hasValidBoardDates(record)).length;
        
        setLmcStats({
          total: lmcStats.total,
          nextBoard: withBoardDates 
        });
      } catch (lmcError) {
        console.error('Error loading LMC statistics:', lmcError);
        setLmcStats({ total: 0, nextBoard: 0 });
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
        case 'ame_due_soon':
          data = getAMERecords().filter(record => isAMEDueSoon(record));
          break;
        case 'lmc_next_board':
          try {
            data = getLowMedicalRecords().filter(record => hasValidBoardDates(record));
          } catch (error) {
            data = [];
          }
          break;
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
      let reportContent = '';
      
      if (reportType.startsWith('ame_')) {
        reportContent = generateAMEReport(data as AMERecord[], reportType);
      } else {
        reportContent = generateLMCReport(data as LowMedicalRecord[], reportType);
      }
      
      await Share.share({
        message: reportContent,
        title: `Health Sync Report - ${reportType.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const generateAMEReport = (data: AMERecord[], reportType: string): string => {
    const timestamp = new Date().toLocaleString();
    let header = `HEALTH SYNC - AME REPORT\nGenerated: ${timestamp}\nReport Type: ${reportType.replace('_', ' ').toUpperCase()}\nTotal Records: ${data.length}\n\n`;

    let content = '';
    data.forEach((record, index) => {
      content += `${index + 1}. ${record.full_name} (${record.personnel_id})\n`;
      content += `   Rank: ${record.rank}\n`;
      content += `   Coy: ${record.unit}\n`;
      content += `   Age: ${record.age}\n`;
      content += `   Height: ${record.height} cm, Weight: ${record.weight} kg, Chest: ${record.chest} cm\n`;
      content += `   Waist-Hip Ratio: ${record.waist_hip_ratio}, BMI: ${record.bmi}\n`;
      content += `   Pulse: ${record.pulse}, Blood Group: ${record.blood_group}, Blood Pressure: ${record.blood_pressure}\n`;
      content += `   Vision: ${record.vision}\n`;
      content += `   Previous Category: ${record.previous_medical_category}\n`;
      content += `   AME Date: ${record.date_of_ame}\n`;
      content += `   Present Category: ${record.present_category_awarded}\n`;
      content += `   Category Reason: ${record.category_reason}\n`;
      content += `   Remarks: ${record.remarks}\n\n`;
    });

    return header + content;
  };

  const generateLMCReport = (data: LowMedicalRecord[], reportType: string): string => {
    const timestamp = new Date().toLocaleString();
    let header = `HEALTH SYNC - LMC REPORT\nGenerated: ${timestamp}\nReport Type: ${reportType.replace('_', ' ').toUpperCase()}\nTotal Records: ${data.length}\n\n`;

    let content = '';
    data.forEach((record, index) => {
      content += `${index + 1}. ${record.name} (${record.personnel_id})\n`;
      content += `   SL NO: ${record.serial_no}\n`;
      content += `   Rank: ${record.rank}\n`;
      content += `   Disease/Reason: ${record.disease_reason}\n`;
      content += `   Medical Category: ${record.medical_category}\n`;
      content += `   Date of Category Allotment: ${record.category_allotment_date}\n`;
      content += `   Last Medical Board Date: ${record.last_medical_board_date}\n`;
      content += `   Medical Board Due Date: ${record.medical_board_due_date}\n`;
      content += `   Remarks: ${record.remarks}\n\n`;
    });

    return header + content;
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
      if (daysDiff === 0) {
        return 'Due Today';
      }
      if (daysDiff >= 1 && daysDiff <= 30) {
        return `Due in ${daysDiff} days`;
      }
      return 'Scheduled';
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getAMEStatusColor = (dateString: string) => {
    const status = getAMEStatusText(dateString);
    if (status === 'Not Set') return '#FF6B6B';
    if (status === 'Done') return '#4ECDC4';
    if (status.includes('Due')) return '#FFE66D';
    return '#A8E6CF';
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
      id: 'lmc_next_board',
      title: 'Medical Board Schedule', 
      subtitle: `${lmcStats.nextBoard || 0} records with board dates`, 
      icon: 'medical-outline',
      gradient: ['#4ECDC4', '#44A08D', '#096DD9'],
      shadowColor: '#4ECDC4',
      count: lmcStats.nextBoard,
      onPress: () => handleReportPress('lmc_next_board'),
    },
  ];

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
              <View style={styles.analyticsModalHeader}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setShowAnalytics(false)}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.analyticsModalTitle}>Analytics Dashboard</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAnalytics(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.analyticsModalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.analyticsScrollContent}
              >
                <View style={styles.analyticsStatsGrid}>
                  <View style={styles.analyticsStatsRow}>
                    <View style={[styles.analyticsStat, { backgroundColor: '#1E3A8A' }]}>
                      <Text style={styles.analyticsStatValue}>{ameStats.total || 0}</Text>
                      <Text style={styles.analyticsStatLabel}>Total AME</Text>
                    </View>
                    <View style={[styles.analyticsStat, { backgroundColor: '#DC2626' }]}>
                      <Text style={styles.analyticsStatValue}>{ameStats.dueSoon || 0}</Text>
                      <Text style={styles.analyticsStatLabel}>Due Soon</Text>
                    </View>
                  </View>
                  <View style={styles.analyticsStatsRow}>
                    <View style={[styles.analyticsStat, { backgroundColor: '#059669' }]}>
                      <Text style={styles.analyticsStatValue}>{lmcStats.total || 0}</Text>
                      <Text style={styles.analyticsStatLabel}>Total LMC</Text>
                    </View>
                    <View style={[styles.analyticsStat, { backgroundColor: '#7C3AED' }]}>
                      <Text style={styles.analyticsStatValue}>{lmcStats.nextBoard || 0}</Text>
                      <Text style={styles.analyticsStatLabel}>Board Dates</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.analyticsChart}>
                  <View style={styles.analyticsChartHeader}>
                    <Text style={styles.analyticsChartTitle}>AME Progress</Text>
                    <Text style={styles.analyticsChartSubtitle}>
                      {ameStats.total ? Math.round((ameStats.dueSoon / ameStats.total) * 100) : 0}% due within 30 days
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${ameStats.total ? (ameStats.dueSoon / ameStats.total) * 100 : 0}%`
                          }
                        ]}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.analyticsChart}>
                  <View style={styles.analyticsChartHeader}>
                    <Text style={styles.analyticsChartTitle}>LMC Progress</Text>
                    <Text style={styles.analyticsChartSubtitle}>
                      {lmcStats.total ? Math.round((lmcStats.nextBoard / lmcStats.total) * 100) : 0}% have board dates
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${lmcStats.total ? (lmcStats.nextBoard / lmcStats.total) * 100 : 0}%`,
                            backgroundColor: '#4ECDC4'
                          }
                        ]}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.analyticsSummary}>
                  <Text style={styles.analyticsSummaryTitle}>Quick Summary</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{(ameStats.total || 0) + (lmcStats.total || 0)}</Text>
                      <Text style={styles.summaryLabel}>Total Records</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{(ameStats.dueSoon || 0) + (lmcStats.nextBoard || 0)}</Text>
                      <Text style={styles.summaryLabel}>Action Required</Text>
                    </View>
                  </View>
                </View>
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
        'lmc_next_board': 'Medical Board Schedule',
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
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getAMEStatusColor(item.date_of_ame) }]} />
                      <Text style={[styles.reportItemValue, { color: getAMEStatusColor(item.date_of_ame) }]}>
                        {getAMEStatusText(item.date_of_ame)}
                      </Text>
                    </View>
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
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="calendar-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>Last Board Date</Text>
                    </View>
                    <Text style={styles.reportItemValue}>
                      {item.last_medical_board_date || 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.reportItemRow}>
                    <View style={styles.reportItemLabelContainer}>
                      <Ionicons name="calendar-outline" size={16} color="#A0AEC0" />
                      <Text style={styles.reportItemLabel}>Next Board Date</Text>
                    </View>
                    <Text style={styles.reportItemValue}>
                      {item.medical_board_due_date || 'Not set'}
                    </Text>
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
              onPress={() => navigation.navigate('DashboardAdmin')}
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
  analyticsModalContainer: {
    flex: 1,
  },
  analyticsModalGradient: {
    flex: 1,
  },
  analyticsModalContent: {
    flex: 1,
    paddingTop: 50,
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
  modalCloseButton: {
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
  analyticsScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
});

export default Reports;