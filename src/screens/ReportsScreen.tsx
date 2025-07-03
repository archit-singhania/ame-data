import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  StyleSheet,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const stored = await AsyncStorage.getItem('vitals');
        const parsed = stored ? JSON.parse(stored) : [];
        setReports(parsed);
      } catch (err) {
        console.error('Error fetching vitals:', err);
      }
    };

    const unsubscribe = navigation.addListener('focus', fetchVitals);

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

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[
          '#000000',   
          '#1f291f',  
          '#3c4d36',   
          '#5c4931',  
          '#2e3d2e',  
          '#0d0d0d'   
        ]}
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>📋</Text>
              </View>
              <Text style={styles.heading}>Health Reports</Text>
              <Text style={styles.subheading}>Your health history at a glance</Text>
            </View>
            <View style={styles.reportsContainer}>
              {reports.length > 0 ? (
                reports.map((report: any, index: number) => (
                  <Animated.View
                    key={report.id}
                    style={[
                      styles.reportCard,
                      {
                        transform: [{
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [index % 2 === 0 ? -50 : 50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <Text style={styles.reportDate}>📅 {report.date}</Text>
                    <View style={styles.reportMetrics}>
                      <Text style={styles.reportItem}>❤️ {report.heartRate} bpm</Text>
                      <Text style={styles.reportItem}>🩸 {report.bloodPressure}</Text>
                      <Text style={styles.reportItem}>🌡️ {report.temperature} °C</Text>
                      <Text style={styles.reportItem}>🫁 {report.oxygenLevel}%</Text>
                    </View>
                  </Animated.View>
                ))
              ) : (
                <Animated.View 
                  style={[
                    styles.emptyContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: fadeAnim }]
                    }
                  ]}
                >
                  <Text style={styles.emptyIcon}>📊</Text>
                  <Text style={styles.emptyText}>No reports found</Text>
                  <Text style={styles.emptySubtext}>Start tracking your vitals to see reports here</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 40,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '300',
  },
  reportsContainer: {
    flex: 1,
  },
  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  reportDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  reportMetrics: {
    gap: 12,
  },
  reportItem: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    minHeight: height * 0.5,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '300',
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 50,
    opacity: 0.6,
  },
  element1: {
    width: 120,
    height: 120,
    top: 120,
    left: -20,
    borderRadius: 60,
  },
  element2: {
    width: 90,
    height: 90,
    bottom: 150,
    right: -15,
    borderRadius: 45,
  },
});