import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LandingScreen from '../screens/LandingScreen';
import LoginAdmin from '../screens/AdminLoginScreen';
import LoginDoctor from '../screens/DoctorLoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardAdmin from '../screens/AdminDashboard';
import DashboardDoctor from '../screens/DoctorDashboard';
import AMEStatus from '../screens/AMEStatus';
import LMCRecords from '../screens/LMCRecords';
import AMEStatViewer from '../screens/AMEStatViewer';
import LMCStatViewer from '../screens/LMCStatViewer';
import ReportsDetailScreen from '../screens/ReportsDetailScreen';
import PrescriptionManagement from '../screens/PrescriptionManagement';
import RecordManagement from '../screens/RecordManagement';
import RoleSelection from '@/screens/RoleSelection';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelection} />
        <Stack.Screen name="LoginAdmin" component={LoginAdmin} />
        <Stack.Screen name="LoginDoctor" component={LoginDoctor} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="AMEStatus" component={AMEStatus} />
        <Stack.Screen name="LMCRecords" component={LMCRecords} />
        <Stack.Screen name="AMEStatViewer" component={AMEStatViewer} />
        <Stack.Screen name="LMCStatViewer" component={LMCStatViewer} />
        <Stack.Screen name="ReportsDetailScreen" component={ReportsDetailScreen} />
        <Stack.Screen name="DashboardAdmin" component={DashboardAdmin} />
        <Stack.Screen name="DashboardDoctor" component={DashboardDoctor} />
        <Stack.Screen name="PrescriptionManagement" component={PrescriptionManagement} />
        <Stack.Screen name="RecordManagement" component={RecordManagement} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}