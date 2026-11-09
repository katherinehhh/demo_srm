import type { LifecycleDescription } from '@nocobase/lifecycle';

// This description mirrors the supplier service's persisted state transitions.
// Topology is source-owned; reviewer and warning period are editable in supplier settings.
const states = [
  'draft',
  'pending',
  'returned',
  'approved',
  'renewalPending',
  'renewalReturned',
] as const;
const edges = [
  ['submit', 'draft', 'pending'],
  ['return', 'pending', 'returned'],
  ['resubmit', 'returned', 'pending'],
  ['approve', 'pending', 'approved'],
  ['renew', 'approved', 'renewalPending'],
  ['returnRenewal', 'renewalPending', 'renewalReturned'],
  ['resubmitRenewal', 'renewalReturned', 'renewalPending'],
  ['approveRenewal', 'renewalPending', 'approved'],
] as const;

export const supplierProcessDescription: LifecycleDescription = {
  name: 'supplier-admission',
  initial: 'draft',
  initialStates: ['draft'],
  states,
  stateInfo: states.map((name) => ({
    name,
    title: name,
    final: false,
    meta: {},
  })),
  transitions: edges.map(([name, from, to]) => ({
    name,
    title: name,
    from: [from],
    to: [to],
    effects: [],
    accept: [],
    manual: true,
    meta: {},
  })),
  continuations: [],
  onEnter: {},
  triggers: [],
};
