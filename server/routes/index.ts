import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';
import {
  supplierRoutes,
  supplierFileRoutes,
  supplierFileContentGuard,
} from './suppliers.js';

const routes: readonly AppRouteContribution<Application>[] = [
  supplierRoutes,
  supplierFileContentGuard,
  ...supplierFileRoutes,
];

export default routes;
