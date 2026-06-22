/**
 * Central permission registry. Each value is the action CODE the backend
 * returns in the JWT (AuthService.userActions). The `appHasAction` directive
 * and `permissionGuard` compare against these. Add a feature -> add one entry
 * -> gate it with [appHasAction]="actions.X" or route data { action: ... }.
 * Readable codes are placeholders to be aligned with the backend.
 */
export enum Actions {
  Dashboard_View = 'DASH_VIEW',

  Template_View = 'TPL_VIEW',
  Template_Create = 'TPL_CREATE',
  Template_Edit = 'TPL_EDIT',
  Template_Delete = 'TPL_DELETE',
  Template_Archive = 'TPL_ARCHIVE',
  Template_Export = 'TPL_EXPORT',
  Template_Info = 'TPL_INFO',

  Canvas_View = 'EXNDM',
  Canvas_Save = 'CDDCR',
  Canvas_Edit = 'EDITC',
  Canvas_Delete = 'DELDR',
  Canvas_Print = 'CNV_PRINT',
  Canvas_AI = 'CNV_AI',

  Credential_View = 'CRED_VIEW',
  Credential_Generate = 'CRED_GEN',
  Credential_Bulk = 'CRED_BULK',
  Credential_Approve = 'CRED_APPROVE',

  Branding_Manage = 'BRAND_MANAGE',

  User_View = 'USER_VIEW',
  User_Manage = 'USER_MANAGE',
  Role_View = 'ROLE_VIEW',
  Role_Manage = 'ROLE_MANAGE',

  Automation_View = 'AUTO_VIEW',
  Automation_Manage = 'AUTO_MANAGE',

  Settings_Manage = 'SET_MANAGE',
}

/** Alias for ergonomic template use: [appHasAction]="actions.Template_Edit". */
export const actions = Actions;
