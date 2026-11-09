import {
  Building2,
  BookOpenCheck,
  CalendarClock,
  SlidersHorizontal,
} from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const supplierRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'supplierApplication',
    path: '/supplier-application',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'suppliers.my.title', icon: Building2, order: 10 },
    breadcrumb: { title: 'suppliers.my.title' },
    componentLoader: () => import('./my.js'),
  },
  {
    name: 'supplierReview',
    path: '/supplier-review',
    auth: 'required',
    authz: 'skip',
    breadcrumb: { title: 'suppliers.review.title' },
    componentLoader: () => import('./review.js'),
  },
  {
    name: 'supplierDirectory',
    path: '/supplier-directory',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'supplierDirectory' },
      action: 'access',
    },
    navigation: {
      title: 'suppliers.directory.title',
      icon: BookOpenCheck,
      order: 20,
    },
    breadcrumb: { title: 'suppliers.directory.title' },
    componentLoader: () => import('./directory.js'),
  },
  {
    name: 'supplierExpiring',
    path: '/supplier-expiring',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'supplierExpiring' },
      action: 'access',
    },
    navigation: {
      title: 'suppliers.expiring.title',
      icon: CalendarClock,
      order: 30,
    },
    breadcrumb: { title: 'suppliers.expiring.title' },
    componentLoader: () => import('./expiring.js'),
  },
  {
    name: 'supplierDetail',
    path: '/suppliers/:id',
    auth: 'required',
    authz: 'skip',
    breadcrumb: { title: 'suppliers.detail.title' },
    componentLoader: () => import('./detail.js'),
  },
  {
    name: 'supplierSettings',
    parent: 'settingsBusiness',
    path: '/supplier-settings',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'suppliers.administration' },
      action: 'read',
    },
    navigation: { title: 'suppliers.settings.title', icon: SlidersHorizontal },
    breadcrumb: { title: 'suppliers.settings.title' },
    componentLoader: () => import('./settings.js'),
  },
]);

export default supplierRoutes;
