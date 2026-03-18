import AdminLayout from './AdminLayout';
import '../../styles/ADMIN/SchoolOverview.css';
import '../../styles/ADMIN/AdminProfile.css';

type StoredUserProfile = {
  firstName?: string;
  lastName?: string;
  role?: 'teacher' | 'administrator';
  email?: string;
};

function getStoredAdminProfile(): StoredUserProfile {
  const profileText = localStorage.getItem('userProfile');

  if (!profileText) {
    return {};
  }

  try {
    return JSON.parse(profileText) as StoredUserProfile;
  } catch {
    return {};
  }
}

function getInitials(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'AD';
  }

  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase() || 'AD';
}

function AdminProfile() {
  const profile = getStoredAdminProfile();
  const fullName = [profile.firstName?.trim(), profile.lastName?.trim()]
    .filter((value): value is string => Boolean(value))
    .join(' ') || 'Administrator';

  const email = profile.email?.trim() || localStorage.getItem('userEmail') || 'Not available';
  const role = profile.role === 'administrator' ? 'Administrator' : 'Principal';

  return (
    <AdminLayout kicker="ACCOUNT MANAGEMENT" title="Admin Profile">
      <section className="admin-profile-page-grid">
        <article className="admin-panel admin-profile-card">
          <div className="admin-profile-avatar-badge">{getInitials(fullName)}</div>
          <div>
            <h2>{fullName}</h2>
            <p>{role}</p>
          </div>
        </article>

        <article className="admin-panel admin-profile-details">
          <h2>Profile Details</h2>
          <div className="admin-profile-detail-list">
            <div>
              <span>Full Name</span>
              <strong>{fullName}</strong>
            </div>
            <div>
              <span>Email or Username</span>
              <strong>{email}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{role}</strong>
            </div>
            <div>
              <span>Access Level</span>
              <strong>Full administrative access</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-panel admin-profile-notes">
        <h2>Account Notes</h2>
        <p>Use the admin profile area to review your account identity before managing teachers, classes, and reports.</p>
      </section>
    </AdminLayout>
  );
}

export default AdminProfile;
