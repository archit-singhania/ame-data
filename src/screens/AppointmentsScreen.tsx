import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, Animated, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';

const mockAppointments = [
  { id: '1', date: '2025-04-20', time: '10:00 AM', doctor: 'Dr. Smith', specialty: 'Cardiology' },
  { id: '2', date: '2025-04-25', time: '2:00 PM', doctor: 'Dr. Johnson', specialty: 'General Medicine' },
];

export default function AppointmentsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
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
  }, []);

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
                <Text style={styles.iconText}>🏥</Text>
              </View>
              <Text style={styles.heading}>Upcoming Appointments</Text>
              <Text style={styles.subheading}>Manage your medical visits</Text>
            </View>
            <View style={styles.appointmentsContainer}>
              {mockAppointments.map((appointment, index) => (
                <Animated.View
                  key={appointment.id}
                  style={[
                    styles.appointmentCard,
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
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentDate}>{appointment.date}</Text>
                    <Text style={styles.appointmentTime}>{appointment.time}</Text>
                  </View>
                  <Text style={styles.appointmentDoctor}>{appointment.doctor}</Text>
                  <Text style={styles.appointmentSpecialty}>{appointment.specialty}</Text>
                </Animated.View>
              ))}
            </View>
            <Button
              mode="contained"
              onPress={() => alert('Add New Appointment')}
              style={styles.addButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="plus"
            >
              Add Appointment
            </Button>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  element1: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    top: 100,
    right: 30,
  },
  element2: {
    width: 120,
    height: 120,
    backgroundColor: '#ffffff',
    bottom: 200,
    left: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  appointmentsContainer: {
    marginBottom: 30,
  },
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentDoctor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  addButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
});