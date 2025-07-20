import { User } from '../utils/sqlite';

export type RootStackParamList = {
  Landing: undefined;
  RoleSelection: undefined;
  LoginAdmin: undefined;
  LoginDoctor: undefined;
  Register: { currentUser: User };
  DashboardAdmin: undefined;
  DashboardDoctor: undefined;
  AMEStatus: undefined;
  LMCRecords: undefined;
  AMEStatViewer: undefined;
  LMCStatViewer: undefined;
  PrescriptionManagement: {
    doctorId?: string;
    doctorname?: string;
  } | undefined;
  ReportsDetailScreen_ADM: undefined;
  ReportsDetailScreen_DOC: undefined;
  RecordManagement: { adminId?: number };
};
