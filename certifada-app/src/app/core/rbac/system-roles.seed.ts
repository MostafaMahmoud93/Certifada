/**
 * SYSTEM ROLE DEFAULTS — the immutable seed that provisions a brand-new tenant.
 * On a tenant's first load, RbacService copies these into the tenant's Roles /
 * RolePermissions storage, flagged `isSystem: true` (locked, non-editable). This
 * is the single "default data" source — the backend equivalent is a DB seeder /
 * migration. Tenants clone a system role to create an editable custom variant.
 */
import { Actions } from '../constants/actions';
import { ALL_PERMISSION_CODES } from './permission-catalog';

export interface SystemRoleTemplate { key: string; name: string; desc: string; color: string; codes: string[]; }

const A = Actions;

export const SYSTEM_ROLE_TEMPLATES: SystemRoleTemplate[] = [
  {
    key: 'owner', name: 'Owner', color: '#4f46e5',
    desc: 'Unrestricted access to the entire workspace, including billing and roles.',
    codes: [...ALL_PERMISSION_CODES],
  },
  {
    key: 'admin', name: 'Administrator', color: '#7c3aed',
    desc: 'Manage content, people and settings — everything except billing ownership.',
    codes: ALL_PERMISSION_CODES.filter((c) => c !== A.Billing_Manage && c !== A.Plan_Change),
  },
  {
    key: 'approver', name: 'Approver', color: '#0ea5e9',
    desc: 'Review, approve, reject and revoke credentials before they go out.',
    codes: [
      A.Dashboard_View, A.Analytics_View, A.Template_View, A.Credential_View,
      A.Approval_View, A.Credential_Approve, A.Credential_Reject, A.Credential_Revoke, A.Support_View,
    ],
  },
  {
    key: 'editor', name: 'Editor', color: '#10b981',
    desc: 'Design templates and issue credentials.',
    codes: [
      A.Dashboard_View, A.Template_View, A.Template_Create, A.Template_Edit, A.Template_Export, A.Template_Info,
      A.Canvas_View, A.Canvas_Edit, A.Canvas_Save, A.Canvas_Print,
      A.Credential_View, A.Credential_Generate, A.Credential_Bulk, A.Credential_Resend, A.Credential_Download,
      A.Branding_Manage, A.Automation_View, A.Support_View,
    ],
  },
  {
    key: 'viewer', name: 'Viewer', color: '#64748b',
    desc: 'Read-only access across the workspace.',
    codes: [
      A.Dashboard_View, A.Analytics_View, A.Template_View, A.Credential_View,
      A.Approval_View, A.User_View, A.Role_View, A.Automation_View, A.Billing_View, A.Support_View,
    ],
  },
];
