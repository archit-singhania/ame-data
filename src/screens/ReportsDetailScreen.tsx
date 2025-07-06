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
  RefreshControl
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

const Reports: React.FC = () => {
  const [ameStats, setAmeStats] = useState<any>({});
  const [lmcStats, setLmcStats] = useState<any>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatedValue] = useState(new Animated.Value(0));
  const [cardAnimation] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleAnalyticsPress = () => {
    setShowAnalytics(true);
  };

  const AnalyticsButton = () => (
    <View style={styles.analyticsButtonContainer}>
      <TouchableOpacity
        style={styles.analyticsButton}
        onPress={handleAnalyticsPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#f093fb', '#f5576c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.analyticsButtonGradient}
        >
          <BlurView intensity={20} style={styles.analyticsButtonBlur}>
            <View style={styles.analyticsButtonContent}>
              <Text style={styles.analyticsButtonIcon}>📊</Text>
              <View style={styles.analyticsButtonText}>
                <Text style={styles.analyticsButtonTitle}>Visual Analytics</Text>
                <Text style={styles.analyticsButtonSubtitle}>
                  Charts & Graphs
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
  
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
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
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

  const reportCards: ReportCard[] = [
    {
      id: 'ame_due_soon',
      title: 'AME Due Soon',
      subtitle: `${ameStats.dueSoon || 0} upcoming within 30 days`, 
      icon: '⏰',
      gradient: ['#fdcb6e', '#e17055'],
      shadowColor: '#fdcb6e',
      count: ameStats.dueSoon,
      onPress: () => handleReportPress('ame_due_soon'),
    },
    {
      id: 'lmc_next_board',
      title: 'LMC Medical Board Schedule', 
      subtitle: `${lmcStats.nextBoard || 0} records with board dates`, 
      icon: '🏥',
      gradient: ['#00b894', '#00a085'],
      shadowColor: '#00b894',
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

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.reportCard,
          {
            transform: [{ scale: cardScale }],
            opacity: cardOpacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={item.onPress}
          activeOpacity={0.8}
          style={styles.cardTouchable}
        >
          <LinearGradient
            colors={item.gradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <BlurView intensity={20} style={styles.cardBlur}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                  <View style={styles.cardStats}>
                    {item.count !== undefined && (
                      <Text style={styles.cardCount}>{item.count}</Text>
                    )}
                    {item.percentage !== undefined && (
                      <Text style={styles.cardPercentage}>{item.percentage}%</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                <View style={styles.cardFooter}>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
              </View>
            </BlurView>
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
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.analyticsModalGradient}
          >
            <BlurView intensity={30} style={styles.analyticsModalBlur}>
              <View style={styles.analyticsModalContent}>
                <View style={styles.analyticsModalHeader}>
                  <Text style={styles.analyticsModalTitle}>
                    📊 Visual Analytics
                  </Text>
                  <TouchableOpacity
                    style={styles.analyticsModalClose}
                    onPress={() => setShowAnalytics(false)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.analyticsModalScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.analyticsContent}>
                    <View style={styles.analyticsCard}>
                      <BlurView intensity={15} style={styles.analyticsCardBlur}>
                        <View style={styles.analyticsCardContent}>
                          <Text style={styles.analyticsCardTitle}>AME Statistics</Text>
                          <View style={styles.chartContainer}>
                            <View style={styles.chartRow}>
                              <View style={styles.chartItem}>
                                <View style={[styles.chartDot, { backgroundColor: '#667eea' }]} />
                                <Text style={styles.chartLabel}>Total AME</Text>
                                <Text style={styles.chartValue}>{ameStats.total || 0}</Text>
                              </View>
                              <View style={styles.chartItem}>
                                <View style={[styles.chartDot, { backgroundColor: '#fdcb6e' }]} />
                                <Text style={styles.chartLabel}>Due Soon</Text>
                                <Text style={styles.chartValue}>{ameStats.dueSoon || 0}</Text>
                              </View>
                            </View>
                            <View style={styles.chartProgressContainer}>
                              <View style={styles.chartProgressBar}>
                                <View 
                                  style={[
                                    styles.chartProgress, 
                                    { 
                                      width: `${ameStats.total ? (ameStats.dueSoon / ameStats.total) * 100 : 0}%`,
                                      backgroundColor: '#fdcb6e' 
                                    }
                                  ]} 
                                />
                              </View>
                              <Text style={styles.chartPercentage}>
                                {ameStats.total ? Math.round((ameStats.dueSoon / ameStats.total) * 100) : 0}% Due Soon
                              </Text>
                            </View>
                          </View>
                        </View>
                      </BlurView>
                    </View>

                    <View style={styles.analyticsCard}>
                      <BlurView intensity={15} style={styles.analyticsCardBlur}>
                        <View style={styles.analyticsCardContent}>
                          <Text style={styles.analyticsCardTitle}>LMC Statistics</Text>
                          <View style={styles.chartContainer}>
                            <View style={styles.chartRow}>
                              <View style={styles.chartItem}>
                                <View style={[styles.chartDot, { backgroundColor: '#a29bfe' }]} />
                                <Text style={styles.chartLabel}>Total LMC</Text>
                                <Text style={styles.chartValue}>{lmcStats.total || 0}</Text>
                              </View>
                              <View style={styles.chartItem}>
                                <View style={[styles.chartDot, { backgroundColor: '#00b894' }]} />
                                <Text style={styles.chartLabel}>Next Board</Text>
                                <Text style={styles.chartValue}>{lmcStats.nextBoard || 0}</Text>
                              </View>
                            </View>
                            <View style={styles.chartProgressContainer}>
                              <View style={styles.chartProgressBar}>
                                <View 
                                  style={[
                                    styles.chartProgress, 
                                    { 
                                      width: `${lmcStats.total ? (lmcStats.nextBoard / lmcStats.total) * 100 : 0}%`,
                                      backgroundColor: '#00b894' 
                                    }
                                  ]} 
                                />
                              </View>
                              <Text style={styles.chartPercentage}>
                                {lmcStats.total ? Math.round((lmcStats.nextBoard / lmcStats.total) * 100) : 0}% Have Board Dates
                              </Text>
                            </View>
                          </View>
                        </View>
                      </BlurView>
                    </View>

                    <View style={styles.analyticsCard}>
                      <BlurView intensity={15} style={styles.analyticsCardBlur}>
                        <View style={styles.analyticsCardContent}>
                          <Text style={styles.analyticsCardTitle}>Summary</Text>
                          <View style={styles.summaryContainer}>
                            <View style={styles.summaryItem}>
                              <Text style={styles.summaryLabel}>Total Records</Text>
                              <Text style={styles.summaryValue}>
                                {(ameStats.total || 0) + (lmcStats.total || 0)}
                              </Text>
                            </View>
                            <View style={styles.summaryItem}>
                              <Text style={styles.summaryLabel}>Action Required</Text>
                              <Text style={styles.summaryValue}>
                                {(ameStats.dueSoon || 0) + (lmcStats.nextBoard || 0)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </BlurView>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  const renderReportModal = () => {
    const getReportTitle = (reportType: string) => {
      const titles: { [key: string]: string } = {
        'ame_due_soon': 'AME Due Soon (Next 30 Days)',
        'lmc_next_board': 'LMC Medical Board Schedule',
      };
      return titles[reportType] || 'Report';
    };

    const formatDateStatus = (dateString: string, type: 'ame' | 'lmc') => {
      if (!dateString || dateString === '-' || dateString.trim() === '' || 
          dateString === '0000-00-00' || dateString === 'Not Set' || dateString === 'Pending') {
        return type === 'ame' ? 'Date not set yet' : '';
      }

      const daysDiff = calculateDateDifference(dateString);
      if (daysDiff === null) return type === 'ame' ? 'Invalid date' : '';
      
      if (type === 'ame') {
        if (daysDiff < 0) {
          return dateString;
        }
        if (daysDiff >= 1 && daysDiff <= 30) {
          return `After ${daysDiff} days`;
        }
        return dateString;
      } else {
        return '';
      }
    };

    const renderReportItem = ({ item, index }: { item: any; index: number }) => {
      const isAME = selectedReport?.startsWith('ame_');
      
      return (
        <View style={styles.reportItem}>
          <BlurView intensity={15} style={styles.reportItemBlur}>
            <View style={styles.reportItemContent}>
              <View style={styles.reportItemHeader}>
                <Text style={styles.reportItemTitle}>
                  {isAME ? item.full_name : item.name}
                </Text>
                <Text style={styles.reportItemId}>
                  {item.personnel_id || item.irla_no}
                </Text>
              </View>
              
              <View style={styles.reportItemDetails}>
                <View style={styles.reportItemRow}>
                  <Text style={styles.reportItemLabel}>Rank:</Text>
                  <Text style={styles.reportItemValue}>{item.rank}</Text>
                </View>
                
                {isAME ? (
                  <>
                    <View style={styles.reportItemRow}>
                      <Text style={styles.reportItemLabel}>Coy:</Text>
                      <Text style={styles.reportItemValue}>{item.unit}</Text>
                    </View>
                    <View style={styles.reportItemRow}>
                      <Text style={styles.reportItemLabel}>AME Date:</Text>
                      <Text style={styles.reportItemValue}>
                        {item.date_of_ame || 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.reportItemRow}>
                      <Text style={styles.reportItemLabel}>Status:</Text>
                      <Text style={[
                        styles.reportItemValue,
                        { color: formatDateStatus(item.date_of_ame, 'ame') === 'Date not set yet' ? '#ff7675' : 
                                formatDateStatus(item.date_of_ame, 'ame').includes('After') ? '#fdcb6e' : '#74b9ff' }
                      ]}>
                        {formatDateStatus(item.date_of_ame, 'ame')}
                      </Text>
                    </View>
                    <View style={styles.reportItemRow}>
                      <Text style={styles.reportItemLabel}>Category:</Text>
                      <Text style={styles.reportItemValue}>
                        {item.present_category_awarded || 'Pending'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.reportItemRow}>
                      <Text style={styles.reportItemLabel}>Disease/Reason:</Text>
                      <Text style={styles.reportItemValue}>
                        {item.disease_reason || 'Not specified'}
                      </Text>
                    </View>
                    <View style={styles.reportItemRow}>
                      <Text style={styles.reportItemLabel}>Medical Category:</Text>
                      <Text style={styles.reportItemValue}>
                        {item.medical_category || 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.reportItemRow}>
                      <Text style={styles.reportItemLabel}>Last Medical Board Appear Date:</Text>
                      <Text style={styles.reportItemValue}>
                        {item.last_medical_board_date || ''}
                      </Text>
                    </View>
                    <View style={styles.reportItemRow}>
                      <Text style={styles.reportItemLabel}>Next Medical Board Appear Date:</Text>
                      <Text style={styles.reportItemValue}>
                        {item.medical_board_due_date || ''}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </BlurView>
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
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalGradient}
          >
            <BlurView intensity={30} style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {getReportTitle(selectedReport || '')}
                  </Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalAction}
                      onPress={() => generateReport(selectedReport || '')}
                    >
                      <Ionicons name="share-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalAction}
                      onPress={() => setSelectedReport(null)}
                    >
                      <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.modalStats}>
                  <Text style={styles.modalStatsText}>
                    Total Records: {reportData.length}
                  </Text>
                </View>

                {reportData.length === 0 && !loading ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>📋</Text>
                    <Text style={styles.emptyStateText}>No records found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      There are no records matching this criteria
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={reportData}
                    renderItem={renderReportItem}
                    keyExtractor={(item, index) => `${selectedReport}-${index}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.reportList}
                  />
                )}
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: animatedValue,
                transform: [
                  {
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.headerTitle}>Health Reports</Text>
            <Text style={styles.headerSubtitle}>
              Comprehensive medical examination reports
            </Text>
          </Animated.View>
          <View style={styles.reportsGrid}>
            {reportCards.map((card, index) => renderReportCard(card, index))}
          </View>
          <AnalyticsButton />
        </ScrollView>
      </LinearGradient>
      
      {renderReportModal()}
      {renderAnalyticsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  reportsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
  },
  cardBlur: {
    flex: 1,
  },
  cardContent: {
    padding: 15,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardStats: {
    alignItems: 'flex-end',
  },
  cardCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardPercentage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalBlur: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalAction: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalStats: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalStatsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  reportList: {
    padding: 15,
  },
  reportItem: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reportItemBlur: {
    flex: 1,
  },
  reportItemContent: {
    padding: 15,
  },
  reportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  reportItemId: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reportItemDetails: {
    gap: 8,
  },
  reportItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportItemLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  reportItemValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  chartPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    width: width - 80,
    minHeight: 250,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  chartColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  analyticsButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  analyticsButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  analyticsButtonGradient: {
    flex: 1,
  },
  analyticsButtonBlur: {
    flex: 1,
  },
  analyticsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  analyticsButtonIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  analyticsButtonText: {
    flex: 1,
  },
  analyticsButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  analyticsButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  analyticsModalContainer: {
    flex: 1,
  },
  analyticsModalGradient: {
    flex: 1,
  },
  analyticsModalBlur: {
    flex: 1,
  },
  analyticsModalContent: {
    flex: 1,
    marginTop: 50,
  },
  analyticsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  analyticsModalClose: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  analyticsModalScroll: {
    flex: 1,
  },
  analyticsContent: {
    padding: 20,
  },
  analyticsCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  analyticsCardBlur: {
    flex: 1,
  },
  analyticsCardContent: {
    padding: 20,
  },
  analyticsCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  chartContainer: {
    gap: 15,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  chartValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartProgressContainer: {
    gap: 8,
  },
  chartProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartProgress: {
    height: '100%',
    borderRadius: 4,
  },
  chartPercentage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Reports;