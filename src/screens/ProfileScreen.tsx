import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  Alert
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';

export default function ProfileScreen() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male');

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
  }, []);

  const handleSave = () => {
    alert('Profile updated successfully! 🎉');
  };

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
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>👨‍⚕️</Text>
              </View>
              <Text style={styles.heading}>My Profile</Text>
              <Text style={styles.subheading}>Manage your personal information</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label="Full Name"
                mode="outlined"
                value={name}
                onChangeText={setName}
                style={styles.input}
                theme={{
                  colors: {
                    primary: 'white',
                    outline: 'rgba(255,255,255,0.5)',
                    onSurfaceVariant: 'rgba(255,255,255,0.8)',
                    surface: 'rgba(255,255,255,0.1)',
                  }
                }}
                textColor="white"
              />
              <TextInput
                label="Email Address"
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                style={styles.input}
                theme={{
                  colors: {
                    primary: 'white',
                    outline: 'rgba(255,255,255,0.5)',
                    onSurfaceVariant: 'rgba(255,255,255,0.8)',
                    surface: 'rgba(255,255,255,0.1)',
                  }
                }}
                textColor="white"
              />
              <TextInput
                label="Age"
                mode="outlined"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                style={styles.input}
                theme={{
                  colors: {
                    primary: 'white',
                    outline: 'rgba(255,255,255,0.5)',
                    onSurfaceVariant: 'rgba(255,255,255,0.8)',
                    surface: 'rgba(255,255,255,0.1)',
                  }
                }}
                textColor="white"
              />
            </View>
            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>Gender</Text>
              <View style={styles.genderOptions}>
                {[
                  { value: 'male', label: 'Male', icon: '👨' },
                  { value: 'female', label: 'Female', icon: '👩' },
                  { value: 'other', label: 'Other', icon: '🧑' }
                ].map((option) => (
                  <Animated.View
                    key={option.value}
                    style={[
                      styles.genderOption,
                      gender === option.value && styles.genderOptionSelected,
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
                    <Button
                      mode={gender === option.value ? 'contained' : 'outlined'}
                      onPress={() => setGender(option.value)}
                      style={[
                        styles.genderButton,
                        gender === option.value && styles.genderButtonSelected
                      ]}
                      labelStyle={[
                        styles.genderButtonLabel,
                        gender === option.value && styles.genderButtonLabelSelected
                      ]}
                      icon={() => <Text style={styles.genderIcon}>{option.icon}</Text>}
                    >
                      {option.label}
                    </Button>
                  </Animated.View>
                ))}
              </View>
            </View>
            <Button 
              mode="contained" 
              onPress={handleSave} 
              style={styles.saveButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="content-save"
            >
              Save Profile
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
  element3: {
    width: 100,
    height: 100,
    bottom: '10%',
    left: '5%',
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
    fontSize: 32,
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
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  submitButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 30,
  },
  saveButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 30,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  linkButton: {
    marginTop: 10,
  },
  linkLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  appointmentsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentDate: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appointmentTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentDoctor: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  appointmentSpecialty: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  reportsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reportDate: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  reportMetrics: {
    gap: 8,
  },
  reportItem: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontWeight: '500',
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
  genderContainer: {
    width: '100%',
    marginBottom: 30,
  },
  genderLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  genderOption: {
    flex: 1,
  },
  genderOptionSelected: {
    transform: [{ scale: 1.05 }],
  },
  genderButton: {
    borderRadius: 15,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  genderButtonSelected: {
    backgroundColor: 'white',
    elevation: 4,
  },
  genderButtonLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  genderButtonLabelSelected: {
    color: '#667eea',
  },
  genderIcon: {
    fontSize: 18,
  },
});