import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar,
  ScrollView 
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function AddVitalsScreen() {
  const navigation = useNavigation();
  const [heartRate, setHeartRate] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [temperature, setTemperature] = useState('');
  const [oxygenLevel, setOxygenLevel] = useState('');

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

  const handleSubmit = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
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
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.element3,
            {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
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
                <Text style={styles.iconText}>📊</Text>
              </View>
              <Text style={styles.heading}>Add Vitals</Text>
              <Text style={styles.subheading}>Track your health metrics</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label="Heart Rate (bpm)"
                value={heartRate}
                onChangeText={setHeartRate}
                style={styles.input}
                keyboardType="numeric"
                mode="outlined"
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
                label="Blood Pressure (e.g. 120/80)"
                value={bloodPressure}
                onChangeText={setBloodPressure}
                style={styles.input}
                mode="outlined"
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
                label="Temperature (°C)"
                value={temperature}
                onChangeText={setTemperature}
                style={styles.input}
                keyboardType="numeric"
                mode="outlined"
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
                label="Oxygen Level (%)"
                value={oxygenLevel}
                onChangeText={setOxygenLevel}
                style={styles.input}
                keyboardType="numeric"
                mode="outlined"
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
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Submit Vitals
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
    paddingTop: StatusBar.currentHeight || 40,
  },
  floatingElement: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  element1: {
    top: 50,
    left: 30,
  },
  element2: {
    top: height * 0.4,
    right: 50,
  },
  element3: {
    bottom: 100,
    left: width * 0.4,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 50,
    marginBottom: 10,
  },
  iconText: {
    fontSize: 24,
  },
  heading: {
    fontSize: 26,
    color: 'white',
    fontWeight: 'bold',
  },
  subheading: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
});