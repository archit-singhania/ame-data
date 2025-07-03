import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  useWindowDimensions, 
  StatusBar, 
  ScrollView,
  Platform,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandingScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const isSmallPhone = screenWidth < 375;
  const isPhone = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isLargeTablet = screenWidth >= 1024;
  const isLandscape = screenWidth > screenHeight;

  const getResponsiveSize = (small: number, medium: number, large: number, xlarge: number) => {
    if (isLargeTablet) return xlarge;
    if (isTablet) return large;
    if (isSmallPhone) return small * 0.7;
    return small * 0.85;
  };

  useEffect(() => {
    const animationDelay = isTablet ? 200 : 0;
    
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: isTablet ? 1200 : 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: isTablet ? 1000 : 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: isTablet ? 1000 : 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, animationDelay);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: isTablet ? 1.08 : 1.1,
          duration: isTablet ? 2500 : 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: isTablet ? 2500 : 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: isTablet ? 4000 : 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: isTablet ? 4000 : 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isTablet]);

  const handleGetStarted = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('RoleSelection');
    });
  };

  const dynamicStyles = StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      maxWidth: isLargeTablet ? 900 : isTablet ? 700 : 600,
      paddingHorizontal: getResponsiveSize(16, 20, 30, 40),
      paddingVertical: getResponsiveSize(5, 30, 40, 50),
    },
    logoContainer: {
      marginBottom: getResponsiveSize(8, 30, 40, 50),
    },
    textContainer: {
      alignItems: 'center',
      marginBottom: getResponsiveSize(8, 30, 40, 50),
      paddingHorizontal: isTablet ? 40 : 10,
    },
    logoCircle: {
      width: getResponsiveSize(50, 80, 100, 120),
      height: getResponsiveSize(50, 80, 100, 120),
      borderRadius: getResponsiveSize(25, 40, 50, 60),
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: isTablet ? 4 : 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoText: {
      fontSize: getResponsiveSize(20, 36, 44, 52),
      fontWeight: 'bold',
      color: 'white',
    },
    title: {
      fontSize: getResponsiveSize(18, 28, 36, 44),
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: getResponsiveSize(3, 8, 12, 16),
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      lineHeight: getResponsiveSize(22, 34, 42, 50),
    },
    description: {
      fontSize: getResponsiveSize(10, 14, 16, 18),
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      lineHeight: getResponsiveSize(14, 22, 24, 26),
      maxWidth: isTablet ? 600 : '100%',
    },
    featuresContainer: {
      width: '100%',
      marginBottom: getResponsiveSize(15, 50, 60, 70),
      paddingHorizontal: getResponsiveSize(5, 10, 15, 20),
    },
    featureCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: getResponsiveSize(10, 15, 18, 20),
      padding: getResponsiveSize(4, 12, 15, 18),
      alignItems: 'center',
      marginBottom: isTablet ? 15 : 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      minHeight: getResponsiveSize(35, 65, 75, 85),
      justifyContent: 'center',
    },
    featureRow: {
      flexDirection: isTablet && !isLandscape ? 'row' : 'column',
      justifyContent: 'space-between',
      marginBottom: getResponsiveSize(3, 15, 20, 25),
      gap: getResponsiveSize(4, 10, 15, 20),
    },
    featureCardHalf: {
      flex: isTablet && !isLandscape ? 1 : undefined,
      width: isTablet && !isLandscape ? undefined : '100%',
      marginBottom: 0,
    },
    featureIcon: {
      fontSize: getResponsiveSize(14, 20, 24, 28),
      marginBottom: getResponsiveSize(2, 4, 6, 8),
    },
    featureText: {
      fontSize: getResponsiveSize(9, 12, 14, 16),
      color: 'white',
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: getResponsiveSize(12, 16, 18, 20),
    },
    buttonContainer: {
      marginTop: getResponsiveSize(5, 25, 35, 45),
      width: '100%',
      maxWidth: isTablet ? 400 : 300,
      gap: getResponsiveSize(8, 12, 15, 18),
      alignItems: 'center',
    },
    footer: {
      marginTop: getResponsiveSize(10, 40, 50, 60),
      paddingVertical: getResponsiveSize(5, 20, 25, 30),
      paddingHorizontal: getResponsiveSize(15, 20, 25, 30),
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
      width: '100%',
      maxWidth: isTablet ? 600 : 500,
    },
    primaryButton: {
      backgroundColor: 'white',
      borderRadius: getResponsiveSize(20, 25, 30, 35),
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      width: '100%',
    },
    buttonContent: {
      height: getResponsiveSize(40, 50, 55, 60),
      paddingHorizontal: getResponsiveSize(20, 25, 30, 35),
    },
    buttonLabel: {
      fontSize: getResponsiveSize(13, 16, 18, 20),
      fontWeight: 'bold',
      color: '#667eea',
    },
    footerText: {
      fontSize: getResponsiveSize(10, 13, 14, 15),
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      lineHeight: getResponsiveSize(14, 18, 20, 22),
      fontStyle: 'italic',
    },
  });

  const renderFloatingElements = () => {
    const elements = [];
    const elementCount = isLargeTablet ? 5 : isTablet ? 4 : 3;
    
    for (let i = 0; i < elementCount; i++) {
      const size = getResponsiveSize(60, 80, 100, 120) - (i * 10);
      const opacity = 0.1 - (i * 0.02);
      
      elements.push(
        <Animated.View 
          key={i}
          style={[
            styles.floatingElement,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity,
              top: `${10 + (i * 15)}%`,
              left: i % 2 === 0 ? `${5 + (i * 5)}%` : undefined,
              right: i % 2 === 1 ? `${5 + (i * 5)}%` : undefined,
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (i % 2 === 0 ? -1 : 1) * (15 + i * 5)],
                })
              }]
            }
          ]}
        />
      );
    }
    
    return elements;
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
        hidden={isLandscape && isPhone} 
      />
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
        {renderFloatingElements()}
        
        <ScrollView 
          contentContainerStyle={[
            styles.scrollWrapper,
            { 
              paddingBottom: getResponsiveSize(5, 25, 35, 45),
              paddingTop: isTablet ? 50 : 10,
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={isTablet}
        >
          <Animated.View 
            style={[
              dynamicStyles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <Animated.View 
              style={[
                dynamicStyles.logoContainer,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <View style={dynamicStyles.logoCircle}>
                <Text style={dynamicStyles.logoText}>H</Text>
              </View>
            </Animated.View>

            <View style={dynamicStyles.textContainer}>
              <Text style={dynamicStyles.title}>
                MedTrack Command
              </Text>
              <Text style={dynamicStyles.description}>
                A unified hub for annual medical evaluations and hospital record management — built to track and monitor the performance of every personnel through data-driven healthcare intelligence.
              </Text>
            </View>

            <View style={dynamicStyles.featuresContainer}>
              {isTablet && !isLandscape ? (
                <>
                  <View style={dynamicStyles.featureRow}>
                    <Animated.View 
                      style={[
                        dynamicStyles.featureCard,
                        dynamicStyles.featureCardHalf,
                        {
                          transform: [{
                            translateX: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-50, 0],
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={dynamicStyles.featureIcon}>📊</Text>
                      <Text style={dynamicStyles.featureText}>Health Analytics</Text>
                    </Animated.View>

                    <Animated.View 
                      style={[
                        dynamicStyles.featureCard,
                        dynamicStyles.featureCardHalf,
                        {
                          transform: [{
                            translateX: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [50, 0],
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={dynamicStyles.featureIcon}>🏥</Text>
                      <Text style={dynamicStyles.featureText}>Anthropometric Records</Text>
                    </Animated.View>
                  </View>

                  <View style={dynamicStyles.featureRow}>
                    <Animated.View 
                      style={[
                        dynamicStyles.featureCard,
                        dynamicStyles.featureCardHalf,
                        {
                          transform: [{
                            translateX: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-50, 0],
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={dynamicStyles.featureIcon}>📈</Text>
                      <Text style={dynamicStyles.featureText}>Vitals & Medical History</Text>
                    </Animated.View>

                    <Animated.View 
                      style={[
                        dynamicStyles.featureCard,
                        dynamicStyles.featureCardHalf,
                        {
                          transform: [{
                            translateX: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [50, 0],
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={dynamicStyles.featureIcon}>📅</Text>
                      <Text style={dynamicStyles.featureText}>AME Status & Due Dates</Text>
                    </Animated.View>
                  </View>
                </>
              ) : (
                <View style={dynamicStyles.featureRow}>
                  {[
                    { icon: '📊', text: 'Health Analytics' },
                    { icon: '🏥', text: 'Anthropometric Records' },
                    { icon: '📈', text: 'Vitals & Medical History' },
                    { icon: '📅', text: 'AME Status & Due Dates' }
                  ].map((feature, index) => (
                    <Animated.View 
                      key={index}
                      style={[
                        dynamicStyles.featureCard,
                        dynamicStyles.featureCardHalf,
                        {
                          transform: [{
                            translateY: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30 + (index * 10), 0],
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={dynamicStyles.featureIcon}>{feature.icon}</Text>
                      <Text style={dynamicStyles.featureText}>{feature.text}</Text>
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>

            <View style={dynamicStyles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleGetStarted}
                style={dynamicStyles.primaryButton}
                contentStyle={dynamicStyles.buttonContent}
                labelStyle={dynamicStyles.buttonLabel}
              >
                Get Started
              </Button>
            </View>

            <View style={dynamicStyles.footer}>
              <Text style={dynamicStyles.footerText}>
                Centralized Medical Tracking.{"\n"}Integrated Platform for Medical Records, Exams, and Operational Health.
              </Text>
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
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});