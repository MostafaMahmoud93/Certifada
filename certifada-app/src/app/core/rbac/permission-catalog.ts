/**
 * PERMISSIONS — the master catalogue of everything that can be gated in the app,
 * organised by SCREEN, each screen listing its ACTIONS. Every action maps to a
 * code from the central `Actions` enum (the same code the backend returns and the
 * `appHasAction` / `permissionGuard` compare against). This is immutable seed data:
 * it defines *what exists*, while Roles/RolePermissions decide *who gets what*.
 */
import { Actions } from '../constants/actions';

export interface RbacPermission { code: string; label: string; hint: string; desc: string; }
export interface RbacScreen { key: string; label: string; icon: string; color: string; desc: string; perms: RbacPermission[]; }

const A = Actions;

export const PERMISSION_SCREENS: RbacScreen[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', color: '#6366f1', desc: 'Home overview, KPIs and reporting.', perms: [
    { code: A.Dashboard_View, label: 'View dashboard', hint: 'See KPIs, activity & pending approvals', desc: 'Open the home dashboard and see workspace KPIs, recent activity and the pending-approvals queue. This is the landing screen after signing in — without it the user starts on another allowed page.' },
    { code: A.Analytics_View, label: 'View analytics', hint: 'Issuance & verification reports', desc: 'Access analytics and reporting: issuance trends, verification/traffic charts and per-credential view counts. Read-only insight into how credentials are performing.' },
  ] },
  { key: 'templates', label: 'Templates', icon: 'grid_view', color: '#8b5cf6', desc: 'The certificate template library.', perms: [
    { code: A.Template_View, label: 'View templates', hint: 'Browse & preview the library', desc: 'Browse the template library and open any template for preview. This is the baseline access every other template action builds on.' },
    { code: A.Template_Create, label: 'Create templates', hint: 'Add brand-new templates', desc: 'Start brand-new templates from scratch or from a preset and add them to the workspace library. Automatically includes viewing templates.' },
    { code: A.Template_Edit, label: 'Edit in designer', hint: 'Change layout, text & fields', desc: 'Open a template in the design studio and change its layout, text, images, colours and data fields. Also unlocks opening the designer canvas.' },
    { code: A.Template_Delete, label: 'Delete templates', hint: 'Permanently remove templates', desc: 'Permanently remove templates from the workspace. Deleted templates cannot be recovered, so this is treated as a sensitive action.' },
    { code: A.Template_Archive, label: 'Archive templates', hint: 'Hide or restore templates', desc: 'Archive templates to hide them from the active list, or restore archived ones — without deleting any data.' },
    { code: A.Template_Export, label: 'Export templates', hint: 'Download as PDF, PNG or JSON', desc: 'Download templates as PDF, PNG or JSON, or share the template definition outside Certifada.' },
    { code: A.Template_Info, label: 'View template info', hint: 'Metadata, usage & history', desc: 'See a template’s metadata, usage statistics and change history.' },
  ] },
  { key: 'designer', label: 'Design studio', icon: 'design_services', color: '#ec4899', desc: 'The visual certificate canvas.', perms: [
    { code: A.Canvas_View, label: 'Open designer', hint: 'View a design on the canvas', desc: 'Open the certificate design canvas to view a design. Prerequisite for every other design-studio action.' },
    { code: A.Canvas_Edit, label: 'Edit canvas', hint: 'Add, move & restyle elements', desc: 'Add, move, resize and restyle elements on the canvas — text, shapes, images, seals and data fields.' },
    { code: A.Canvas_Save, label: 'Save designs', hint: 'Persist canvas changes', desc: 'Persist changes made on the canvas back to the template. Includes opening and editing the canvas.' },
    { code: A.Canvas_Delete, label: 'Delete on canvas', hint: 'Remove elements from a design', desc: 'Remove individual elements or clear parts of a design on the canvas.' },
    { code: A.Canvas_Print, label: 'Print / export design', hint: 'Print or export from the studio', desc: 'Print the current design or export it as a file directly from the studio.' },
    { code: A.Canvas_AI, label: 'AI design assistant', hint: 'Generate & refine with AI', desc: 'Use the AI tools to generate layouts, suggest content and refine designs automatically. A premium capability.' },
  ] },
  { key: 'credentials', label: 'Credentials', icon: 'workspace_premium', color: '#0ea5e9', desc: 'Issued certificates and their lifecycle.', perms: [
    { code: A.Credential_View, label: 'View credentials', hint: 'Browse issued certificates', desc: 'Browse issued certificates and open each recipient’s details, delivery status and history. Baseline for all credential actions.' },
    { code: A.Credential_Generate, label: 'Issue single', hint: 'Issue one certificate at a time', desc: 'Issue one certificate at a time by choosing a template and entering a recipient. Includes viewing credentials.' },
    { code: A.Credential_Bulk, label: 'Bulk issue', hint: 'Generate many from a data file', desc: 'Generate many certificates in one run from a data file such as CSV or Excel. Includes single issuing and viewing.' },
    { code: A.Credential_Approve, label: 'Approve credentials', hint: 'Release queued credentials', desc: 'Approve credentials that are waiting in the queue so they can be sent to recipients. Sensitive — controls what actually goes out.' },
    { code: A.Credential_Reject, label: 'Reject credentials', hint: 'Send back with a reason', desc: 'Reject credentials awaiting approval and send them back with a reason. Sensitive.' },
    { code: A.Credential_Revoke, label: 'Revoke credentials', hint: 'Invalidate an issued certificate', desc: 'Invalidate a certificate that was already issued so it no longer verifies. Sensitive and not reversible for the recipient.' },
    { code: A.Credential_Resend, label: 'Resend credentials', hint: 'Re-send the credential email', desc: 'Re-send a credential email to its recipient, for example if the original was missed.' },
    { code: A.Credential_Edit, label: 'Edit credential data', hint: 'Correct & re-render recipient data', desc: 'Correct the recipient data (name, fields) on an already-issued credential and re-render it.' },
    { code: A.Credential_Export, label: 'Export credential list', hint: 'Export the list to CSV/Excel', desc: 'Export the credentials list and its details to CSV or Excel for auditing or reporting.' },
    { code: A.Credential_Download, label: 'Download credential', hint: 'Download a certificate file', desc: 'Download an individual certificate as a file (PDF/PNG).' },
  ] },
  { key: 'approvals', label: 'Approvals', icon: 'verified', color: '#16a34a', desc: 'The review queue for pending credentials.', perms: [
    { code: A.Approval_View, label: 'View approvals queue', hint: 'Review the pending queue', desc: 'Open the approvals queue to review credentials and batches waiting for a decision. Needed before anyone can approve or reject.' },
  ] },
  { key: 'branding', label: 'Branding', icon: 'palette', color: '#f43f5e', desc: 'Organisation look and feel.', perms: [
    { code: A.Branding_Manage, label: 'Manage brand kit', hint: 'Logo, colours, fonts & signature', desc: 'Set the organisation’s logo, colour palette, fonts and default signature that are applied across all templates and emails.' },
  ] },
  { key: 'people', label: 'People & access', icon: 'group', color: '#10b981', desc: 'Members, roles and who can do what.', perms: [
    { code: A.User_View, label: 'View members', hint: 'See members & their roles', desc: 'See the list of workspace members with the role assigned to each. Baseline for managing people.' },
    { code: A.User_Invite, label: 'Invite members', hint: 'Send seat invitations', desc: 'Send seat invitations to bring new members into the workspace.' },
    { code: A.User_Manage, label: 'Manage members', hint: 'Change roles, suspend accounts', desc: 'Change a member’s role, suspend or reactivate accounts. Sensitive — it changes what others can access.' },
    { code: A.User_Remove, label: 'Remove members', hint: 'Remove members & free seats', desc: 'Remove members from the workspace and free their seat. Sensitive.' },
    { code: A.Role_View, label: 'View roles', hint: 'See roles & their permissions', desc: 'See all roles and exactly which permissions each one grants.' },
    { code: A.Role_Manage, label: 'Manage roles', hint: 'Create, edit & delete roles', desc: 'Create, edit, clone and delete roles and change which permissions they grant. Highly sensitive — it defines everyone’s access.' },
  ] },
  { key: 'automation', label: 'Automation', icon: 'bolt', color: '#f59e0b', desc: 'Automated issuing and routing workflows.', perms: [
    { code: A.Automation_View, label: 'View automations', hint: 'See workflows & run history', desc: 'See automated workflows and their recent run history.' },
    { code: A.Automation_Manage, label: 'Manage automations', hint: 'Create, edit & toggle workflows', desc: 'Create, edit, enable or disable workflows that automatically issue or route credentials.' },
  ] },
  { key: 'billing', label: 'Billing & plan', icon: 'credit_card', color: '#0891b2', desc: 'Subscription, usage and payments.', perms: [
    { code: A.Billing_View, label: 'View billing', hint: 'Plan, usage & payment history', desc: 'See the current plan, usage against limits and payment history. Read-only.' },
    { code: A.Billing_Manage, label: 'Manage billing', hint: 'Payment method & subscription', desc: 'Update the payment method and manage the subscription in the billing portal. Sensitive — financial control.' },
    { code: A.Plan_Change, label: 'Change plan', hint: 'Upgrade or downgrade the plan', desc: 'Upgrade or downgrade the subscription plan, which changes limits and what the whole workspace is billed. Sensitive.' },
    { code: A.Pricing_View, label: 'View pricing', hint: 'Compare available plans', desc: 'Open the pricing page and compare the available plans.' },
  ] },
  { key: 'account', label: 'Account & settings', icon: 'settings', color: '#64748b', desc: 'Personal profile and workspace settings.', perms: [
    { code: A.Profile_Manage, label: 'Manage profile', hint: 'Profile, avatar & preferences', desc: 'Edit personal profile details, avatar and preferences.' },
    { code: A.Signature_Manage, label: 'Manage signature', hint: 'Manage the approver signature', desc: 'Create and manage the approver signature used when signing off credentials.' },
    { code: A.Settings_Manage, label: 'Manage settings', hint: 'Workspace settings & security', desc: 'Change workspace-wide settings, integrations and security options. Sensitive — affects the whole organisation.' },
    { code: A.Support_View, label: 'Access support', hint: 'Open help & support', desc: 'Open the support and help resources.' },
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
