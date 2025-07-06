import { User } from '../navigation/models';

export type RootStackParamList = {
  Landing: undefined;
  RoleSelection: undefined;
  LoginAdmin: undefined;
  LoginDoctor: undefined;
  LoginPersonnel: undefined;
  Register: { currentUser: User };
  Dashboard: undefined;
  AMEStatus: undefined;
  LMCRecords: undefined;
  AddVitals: undefined;
  ReportsDetailScreen: undefined;
  Appointments: undefined;
};
