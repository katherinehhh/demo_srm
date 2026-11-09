import NotificationManagementProvider from './notification-management.js';
import SubmissionProvider from './submission.js';
import SuppliersProvider from './suppliers.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  NotificationManagementProvider,
  SuppliersProvider,
];

export default serviceProviders;
