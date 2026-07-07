/**
 * PERMISSIONS — the master catalogue of everything that can be gated in the app,
 * organised by SCREEN, each screen listing its ACTIONS. Every action maps to a
 * code from the central `Actions` enum (the same code the backend returns and the
 * `appHasAction` / `permissionGuard` compare against). This is immutable seed data:
 * it defines *what exists*, while Roles/RolePermissions decide *who gets what*.
 */
import { Actions } from '../constants/actions';

export interface RbacPermission { code: string; label: string; desc: string; }
export interface RbacScreen { key: string; label: string; icon: string; color: string; perms: RbacPermission[]; }

const A = Actions;

export const PERMISSION_SCREENS: RbacScreen[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', color: '#6366f1', perms: [
    { code: A.Dashboard_View, label: 'View dashboard', desc: 'See the workspace overview, KPIs and recent activity.' },
    { code: A.Analytics_View, label: 'View analytics', desc: 'Open analytics and reporting for issued credentials and traffic.' },
  ] },
  { key: 'templates', label: 'Templates', icon: 'grid_view', color: '#8b5cf6', perms: [
    { code: A.Template_View, label: 'View templates', desc: 'Browse the template library and preview any template.' },
    { code: A.Template_Create, label: 'Create templates', desc: 'Create new templates from scratch or from a preset.' },
    { code: A.Template_Edit, label: 'Edit in designer', desc: 'Open a template in the design studio and change its content.' },
    { code: A.Template_Delete, label: 'Delete templates', desc: 'Permanently remove templates. This cannot be undone.' },
    { code: A.Template_Archive, label: 'Archive templates', desc: 'Archive or restore templates without deleting them.' },
    { code: A.Template_Export, label: 'Export templates', desc: 'Download templates as PDF, PNG or JSON.' },
    { code: A.Template_Info, label: 'View template info', desc: 'See a template’s metadata, usage and history.' },
  ] },
  { key: 'designer', label: 'Design studio', icon: 'design_services', color: '#ec4899', perms: [
    { code: A.Canvas_View, label: 'Open designer', desc: 'Open the certificate design canvas.' },
    { code: A.Canvas_Edit, label: 'Edit canvas', desc: 'Add, move and edit elements on the canvas.' },
    { code: A.Canvas_Save, label: 'Save designs', desc: 'Save changes made on the design canvas.' },
    { code: A.Canvas_Delete, label: 'Delete on canvas', desc: 'Delete elements or whole designs from the canvas.' },
    { code: A.Canvas_Print, label: 'Print / export design', desc: 'Print or export the current design.' },
    { code: A.Canvas_AI, label: 'AI design assistant', desc: 'Use AI tools to generate or refine designs.' },
  ] },
  { key: 'credentials', label: 'Credentials', icon: 'workspace_premium', color: '#0ea5e9', perms: [
    { code: A.Credential_View, label: 'View credentials', desc: 'Browse issued certificates and recipient details.' },
    { code: A.Credential_Generate, label: 'Issue single', desc: 'Issue one certificate from a template and recipient.' },
    { code: A.Credential_Bulk, label: 'Bulk issue', desc: 'Generate many certificates from a data file.' },
    { code: A.Credential_Approve, label: 'Approve credentials', desc: 'Approve credentials before they are sent. Sensitive.' },
    { code: A.Credential_Reject, label: 'Reject credentials', desc: 'Reject credentials awaiting approval. Sensitive.' },
    { code: A.Credential_Revoke, label: 'Revoke credentials', desc: 'Revoke already-issued credentials. Sensitive.' },
    { code: A.Credential_Resend, label: 'Resend credentials', desc: 'Re-send a credential email to the recipient.' },
    { code: A.Credential_Edit, label: 'Edit credential data', desc: 'Edit recipient data on an issued credential.' },
    { code: A.Credential_Export, label: 'Export credential list', desc: 'Export the credentials list to CSV or Excel.' },
    { code: A.Credential_Download, label: 'Download credential', desc: 'Download an individual certificate file.' },
  ] },
  { key: 'approvals', label: 'Approvals', icon: 'verified', color: '#16a34a', perms: [
    { code: A.Approval_View, label: 'View approvals queue', desc: 'Open the approvals queue and review pending items.' },
  ] },
  { key: 'branding', label: 'Branding', icon: 'palette', color: '#f43f5e', perms: [
    { code: A.Branding_Manage, label: 'Manage brand kit', desc: 'Set the logo, colours, fonts and default signature.' },
  ] },
  { key: 'people', label: 'People & access', icon: 'group', color: '#10b981', perms: [
    { code: A.User_View, label: 'View members', desc: 'See workspace members and the role assigned to each.' },
    { code: A.User_Invite, label: 'Invite members', desc: 'Send seat invitations to new members.' },
    { code: A.User_Manage, label: 'Manage members', desc: 'Change roles, suspend or reactivate members. Sensitive.' },
    { code: A.User_Remove, label: 'Remove members', desc: 'Remove members and free their seat. Sensitive.' },
    { code: A.Role_View, label: 'View roles', desc: 'See all roles and the permissions they grant.' },
    { code: A.Role_Manage, label: 'Manage roles', desc: 'Create, edit and delete roles and their permissions. Sensitive.' },
  ] },
  { key: 'automation', label: 'Automation', icon: 'bolt', color: '#f59e0b', perms: [
    { code: A.Automation_View, label: 'View automations', desc: 'See automated workflows and run history.' },
    { code: A.Automation_Manage, label: 'Manage automations', desc: 'Create, edit, enable or disable workflows.' },
  ] },
  { key: 'billing', label: 'Billing & plan', icon: 'credit_card', color: '#0891b2', perms: [
    { code: A.Billing_View, label: 'View billing', desc: 'See the current plan, usage and payment history.' },
    { code: A.Billing_Manage, label: 'Manage billing', desc: 'Update payment details and manage the subscription. Sensitive.' },
    { code: A.Plan_Change, label: 'Change plan', desc: 'Upgrade or downgrade the subscription plan. Sensitive.' },
    { code: A.Pricing_View, label: 'View pricing', desc: 'Open the pricing page and compare plans.' },
  ] },
  { key: 'account', label: 'Account & settings', icon: 'settings', color: '#64748b', perms: [
    { code: A.Profile_Manage, label: 'Manage profile', desc: 'Edit personal profile and preferences.' },
    { code: A.Signature_Manage, label: 'Manage signature', desc: 'Create and manage approver signatures.' },
    { code: A.Settings_Manage, label: 'Manage settings', desc: 'Change workspace settings, integrations and security. Sensitive.' },
    { code: A.Support_View, label: 'Access support', desc: 'Open support and help resources.' },
  ] },
];

/** Every permission code that exists in the system (flattened). */
export const ALL_PERMISSION_CODES: string[] = PERMISSION_SCREENS.flatMap((s) => s.perms.map((p) => p.code));

/** Prerequisite map: enabling a key auto-enables its values (recursively). */
export const PERMISSION_IMPLIES: Record<string, string[]> = {
  [A.Template_Create]: [A.Template_View],
  [A.Template_Edit]: [A.Template_View, A.Canvas_View],
  [A.Template_Delete]: [A.Template_View],
  [A.Template_Archive]: [A.Template_View],
  [A.Template_Export]: [A.Template_View],
  [A.Template_Info]: [A.Template_View],
  [A.Canvas_Edit]: [A.Canvas_View],
  [A.Canvas_Save]: [A.Canvas_View, A.Canvas_Edit],
  [A.Canvas_Delete]: [A.Canvas_View],
  [A.Canvas_Print]: [A.Canvas_View],
  [A.Canvas_AI]: [A.Canvas_View],
  [A.Credential_Generate]: [A.Credential_View],
  [A.Credential_Bulk]: [A.Credential_View, A.Credential_Generate],
  [A.Credential_Approve]: [A.Credential_View, A.Approval_View],
  [A.Credential_Reject]: [A.Credential_View, A.Approval_View],
  [A.Credential_Revoke]: [A.Credential_View],
  [A.Credential_Resend]: [A.Credential_View],
  [A.Credential_Edit]: [A.Credential_View],
  [A.Credential_Export]: [A.Credential_View],
  [A.Credential_Download]: [A.Credential_View],
  [A.User_Invite]: [A.User_View],
  [A.User_Manage]: [A.User_View],
  [A.User_Remove]: [A.User_View],
  [A.Role_Manage]: [A.Role_View],
  [A.Automation_Manage]: [A.Automation_View],
  [A.Billing_Manage]: [A.Billing_View],
  [A.Plan_Change]: [A.Billing_View],
};

/** Elevated permissions that mark a role as "sensitive". */
export const SENSITIVE_CODES: string[] = [
  A.Template_Delete, A.Credential_Approve, A.Credential_Reject, A.Credential_Revoke,
  A.User_Manage, A.User_Remove, A.Role_Manage, A.Settings_Manage, A.Billing_Manage, A.Plan_Change,
];
