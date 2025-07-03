import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Animated, 
  Dimensions,
  StatusBar 
} from 'react-native';
import { Text, Button, Card, Title, Paragraph } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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
    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
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
  }, []);

  const menuItems: {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
    gradient: [string, string, ...string[]]; 
  }[] = [
    {
      title: 'My Profile',
      description: 'View and update your personal info',
      icon: '👤',
      onPress: () => navigation.navigate('Profile'),
      gradient: ['#ff9a9e', '#fecfef'],
    },
    {
      title: 'Add Vitals',
      description: 'Submit your daily health vitals',
      icon: '📊',
      onPress: () => navigation.navigate('AddVitals'),
      gradient: ['#a8edea', '#fed6e3'],
    },
    {
      title: 'Health Reports',
      description: 'View previous health reports',
      icon: '📋',
      onPress: () => navigation.navigate('Reports'),
      gradient: ['#ffecd2', '#fcb69f'],
    },
    {
      title: 'Appointments',
      description: 'View or book upcoming appointments',
      icon: '🏥',
      onPress: () => navigation.navigate('Appointments'),
      gradient: ['#a8e6cf', '#dcedc1'],
    },
  ];

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
              styles.header,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: pulseAnim }
                ]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>H</Text>
              </View>
            </View>
            <Text style={styles.heading}>Welcome to HealthSync</Text>
            <Text style={styles.subtitle}>Your health dashboard</Text>
          </Animated.View>
          <Animated.View 
            style={[
              styles.cardsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {menuItems.map((item, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.cardWrapper,
                  {
                    opacity: cardAnims[index],
                    transform: [{
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      })
                    }]
                  }
                ]}
              >
                <Card style={styles.card} onPress={item.onPress}>
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.iconContainer}>
                        <Text style={styles.cardIcon}>{item.icon}</Text>
                      </View>
                      <View style={styles.cardTextContainer}>
                        <Title style={styles.cardTitle}>{item.title}</Title>
                        <Paragraph style={styles.cardDescription}>
                          {item.description}
                        </Paragraph>
                      </View>
                      <View style={styles.arrowContainer}>
                        <Text style={styles.arrow}>→</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Card>
              </Animated.View>
            ))}
          </Animated.View>
          <Animated.View 
            style={[
              styles.logoutContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Button
              mode="outlined"
              onPress={() => navigation.replace('Login')}
              style={styles.logoutBtn}
              contentStyle={styles.buttonContent}
              labelStyle={styles.logoutLabel}
            >
              Logout
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
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  element1: {
    width: 60,
    height: 60,
    top: '8%',
    right: '10%',
  },
  element2: {
    width: 80,
    height: 80,
    top: '25%',
    left: '5%',
  },
  element3: {
    width: 40,
    height: 40,
    bottom: '20%',
    right: '15%',
    opacity: 0.6,
  },
  scrollContent: {
    paddingTop: StatusBar.currentHeight || 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
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
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
  cardsContainer: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 15,
  },
  card: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  logoutContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  logoutBtn: {
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 150,
  },
  buttonContent: {
    height: 45,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});