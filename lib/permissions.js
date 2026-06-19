// Roles & capabilities. The permissions matrix for FLX Workspace.

export const ROLE_LABEL = {
  super_admin:          { en: 'Super admin',         ar: 'مشرف عام' },
  account_manager:      { en: 'Account manager',     ar: 'مدير حساب' },
  designer:             { en: 'Designer',            ar: 'مصمّم' },
  editor:               { en: 'Video editor',        ar: 'محرّر فيديو' },
  content_writer:       { en: 'Content writer',      ar: 'كاتب محتوى' },
  marketing_specialist: { en: 'Marketing specialist', ar: 'أخصائي تسويق' },
  client:               { en: 'Client',              ar: 'عميل' },
};

const AGENCY_ROLES = [
  'super_admin', 'account_manager', 'designer', 'editor', 'content_writer', 'marketing_specialist',
];

export const isAgency = (role) => AGENCY_ROLES.includes(role);
export const isClient = (role) => role === 'client';

// Who can see more than one client (the agency-side switcher).
export const canSeeAllClients = (role) => role === 'super_admin' || role === 'account_manager';

// Who can give the final sign-off on content.
export const canApprove = (role) => ['client', 'account_manager', 'super_admin'].includes(role);

// Who can upload / create content & versions.
export const canUpload = (role) => isAgency(role);

// Who can edit the brand hub.
export const canEditBrand = (role) => ['super_admin', 'account_manager', 'designer'].includes(role);

// Who manages the subscribers/clients page (sees every client & uploads for them).
export const canManageClients = (role) => role === 'super_admin' || role === 'account_manager';

export function roleLabel(role) {
  return ROLE_LABEL[role] || { en: role, ar: role };
}
