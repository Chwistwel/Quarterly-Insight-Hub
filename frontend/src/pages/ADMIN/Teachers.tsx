import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import AdminLayout from './AdminLayout';
import { fetchJson } from '../../services/api';
import '../../styles/ADMIN/AdminManagement.css';

type TeacherCard = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  subject: string;
  className: string;
  averageScore: number;
  passRate: number;
  topPerformer?: boolean;
};

type TeacherListResponse = {
  teachers: Array<{
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    className: string;
    averageScore?: number;
    passRate?: number;
  }>;
};

type TeacherAccountFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type TeacherEditFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialTeacherAccountFormState: TeacherAccountFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
};

function Teachers() {
  const [showCreateTeacherForm, setShowCreateTeacherForm] = useState(false);
  const [showEditTeacherForm, setShowEditTeacherForm] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherCards, setTeacherCards] = useState<TeacherCard[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherFormState, setTeacherFormState] = useState<TeacherAccountFormState>(initialTeacherAccountFormState);
  const [teacherEditFormState, setTeacherEditFormState] = useState<TeacherEditFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [teacherFormMessage, setTeacherFormMessage] = useState('');
  const [teacherFormError, setTeacherFormError] = useState('');
  const [teacherFormSubmitting, setTeacherFormSubmitting] = useState(false);

  const loadTeachers = async () => {
    setTeachersLoading(true);

    try {
      const role = localStorage.getItem('userRole') ?? '';
      const email = localStorage.getItem('userEmail') ?? '';

      const response = await fetchJson<TeacherListResponse>('/api/admin/teachers', {
        method: 'GET',
        headers: {
          'x-user-role': role,
          'x-user-email': email
        }
      });

      const cards = response.teachers.map((teacher) => ({
        id: teacher.id ?? teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        subject: teacher.subject || 'Not assigned',
        className: teacher.className || 'Not assigned',
        averageScore: teacher.averageScore ?? 0,
        passRate: teacher.passRate ?? 0,
        topPerformer: (teacher.passRate ?? 0) >= 90
      }));

      setTeacherCards(cards);
    } catch (error) {
      setTeacherFormError(error instanceof Error ? error.message : 'Unable to load teachers.');
    } finally {
      setTeachersLoading(false);
    }
  };

  useEffect(() => {
    void loadTeachers();
  }, []);

  const avgPerformance = useMemo(() => {
    if (teacherCards.length === 0) {
      return 0;
    }

    const total = teacherCards.reduce((running, teacher) => running + teacher.averageScore, 0);
    return total / teacherCards.length;
  }, [teacherCards]);

  const avgPassRate = useMemo(() => {
    if (teacherCards.length === 0) {
      return 0;
    }

    const total = teacherCards.reduce((running, teacher) => running + teacher.passRate, 0);
    return total / teacherCards.length;
  }, [teacherCards]);

  const handleTeacherFormInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setTeacherFormState((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleTeacherEditFormInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setTeacherEditFormState((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleTeacherAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTeacherFormMessage('');
    setTeacherFormError('');
    setTeacherFormSubmitting(true);

    try {
      const role = localStorage.getItem('userRole') ?? '';
      const email = localStorage.getItem('userEmail') ?? '';

      const response = await fetchJson<{ message: string }>('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role,
          'x-user-email': email
        },
        body: JSON.stringify(teacherFormState)
      });

      setTeacherFormMessage(response.message);
      setTeacherFormState(initialTeacherAccountFormState);
      await loadTeachers();
      setShowCreateTeacherForm(false);
    } catch (error) {
      setTeacherFormError(error instanceof Error ? error.message : 'Unable to create teacher account.');
    } finally {
      setTeacherFormSubmitting(false);
    }
  };

  const handleToggleCreateTeacherForm = () => {
    setTeacherFormMessage('');
    setTeacherFormError('');
    setShowCreateTeacherForm((previous) => !previous);
  };

  const handleOpenEditTeacherModal = (teacher: TeacherCard) => {
    setTeacherFormMessage('');
    setTeacherFormError('');
    setEditingTeacherId(teacher.id);
    setTeacherEditFormState({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      password: '',
      confirmPassword: ''
    });
    setShowEditTeacherForm(true);
  };

  const handleCloseEditTeacherModal = () => {
    setShowEditTeacherForm(false);
    setEditingTeacherId(null);
  };

  const handleTeacherUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTeacherId) {
      return;
    }

    setTeacherFormMessage('');
    setTeacherFormError('');
    setTeacherFormSubmitting(true);

    try {
      const role = localStorage.getItem('userRole') ?? '';
      const email = localStorage.getItem('userEmail') ?? '';

      const response = await fetchJson<{ message: string }>(`/api/admin/teachers/${encodeURIComponent(editingTeacherId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role,
          'x-user-email': email
        },
        body: JSON.stringify(teacherEditFormState)
      });

      setTeacherFormMessage(response.message);
      handleCloseEditTeacherModal();
      await loadTeachers();
    } catch (error) {
      setTeacherFormError(error instanceof Error ? error.message : 'Unable to update teacher account.');
    } finally {
      setTeacherFormSubmitting(false);
    }
  };

  const handleTeacherDelete = async (teacher: TeacherCard) => {
    const shouldDelete = window.confirm(`Delete ${teacher.name}? This action cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    setTeacherFormMessage('');
    setTeacherFormError('');

    try {
      const role = localStorage.getItem('userRole') ?? '';
      const email = localStorage.getItem('userEmail') ?? '';

      const response = await fetchJson<{ message: string }>(`/api/admin/teachers/${encodeURIComponent(teacher.id)}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': role,
          'x-user-email': email
        }
      });

      setTeacherFormMessage(response.message);
      await loadTeachers();
    } catch (error) {
      setTeacherFormError(error instanceof Error ? error.message : 'Unable to delete teacher account.');
    }
  };

  return (
    <AdminLayout kicker="MANAGE TEACHING STAFF" title="Teacher Management">
      <section className="admin-management-header-row">
        <article className="admin-management-kpi">
          <p>Total Teachers</p>
          <strong>{teacherCards.length}</strong>
        </article>
        <article className="admin-management-kpi">
          <p>Avg Performance</p>
          <strong>{avgPerformance.toFixed(1)}%</strong>
        </article>
        <article className="admin-management-kpi">
          <p>Avg Pass Rate</p>
          <strong>{avgPassRate.toFixed(1)}%</strong>
        </article>

        <button type="button" className="admin-management-primary-button" onClick={handleToggleCreateTeacherForm}>
          <span aria-hidden="true">＋</span>
          Add Teacher
        </button>
      </section>

      {showCreateTeacherForm ? (
        <div className="admin-management-modal-backdrop" onClick={handleToggleCreateTeacherForm}>
          <section className="admin-management-form-panel admin-management-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-management-modal-head">
              <h2>Create Teacher Account</h2>
              <button type="button" className="admin-management-modal-close" onClick={handleToggleCreateTeacherForm} aria-label="Close create teacher dialog">×</button>
            </div>

            <p className="admin-subcopy">Only administrators can add teachers.</p>

            <form className="admin-create-teacher-form" onSubmit={handleTeacherAccountSubmit}>
              <div className="admin-create-teacher-grid">
                <label>
                  First Name
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={teacherFormState.firstName}
                    onChange={handleTeacherFormInputChange}
                    placeholder="Juan"
                  />
                </label>
                <label>
                  Last Name
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={teacherFormState.lastName}
                    onChange={handleTeacherFormInputChange}
                    placeholder="Dela Cruz"
                  />
                </label>
              </div>

              <label>
                Teacher Email or Username
                <input
                  type="text"
                  name="email"
                  required
                  value={teacherFormState.email}
                  onChange={handleTeacherFormInputChange}
                  placeholder="teacher@school.edu or teacher01"
                />
              </label>

              <div className="admin-create-teacher-grid">
                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={teacherFormState.password}
                    onChange={handleTeacherFormInputChange}
                    placeholder="At least 8 characters"
                  />
                </label>
                <label>
                  Confirm Password
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={8}
                    value={teacherFormState.confirmPassword}
                    onChange={handleTeacherFormInputChange}
                    placeholder="Re-enter password"
                  />
                </label>
              </div>

              {teacherFormMessage ? <p className="admin-form-feedback admin-form-feedback-success">{teacherFormMessage}</p> : null}
              {teacherFormError ? <p className="admin-form-feedback admin-form-feedback-error">{teacherFormError}</p> : null}

              <button type="submit" className="admin-create-teacher-submit" disabled={teacherFormSubmitting}>
                {teacherFormSubmitting ? 'Creating account...' : 'Create Teacher Account'}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {teachersLoading ? <p className="admin-subcopy">Loading teachers...</p> : null}
      {!showCreateTeacherForm && !showEditTeacherForm && teacherFormMessage ? <p className="admin-form-feedback admin-form-feedback-success">{teacherFormMessage}</p> : null}
      {!showCreateTeacherForm && !showEditTeacherForm && teacherFormError ? <p className="admin-form-feedback admin-form-feedback-error">{teacherFormError}</p> : null}

      {showEditTeacherForm ? (
        <div className="admin-management-modal-backdrop" onClick={handleCloseEditTeacherModal}>
          <section className="admin-management-form-panel admin-management-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-management-modal-head">
              <h2>Edit Teacher Account</h2>
              <button type="button" className="admin-management-modal-close" onClick={handleCloseEditTeacherModal} aria-label="Close edit teacher dialog">×</button>
            </div>

            <p className="admin-subcopy">Update teacher details and set a new password.</p>

            <form className="admin-create-teacher-form" onSubmit={handleTeacherUpdateSubmit}>
              <div className="admin-create-teacher-grid">
                <label>
                  First Name
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={teacherEditFormState.firstName}
                    onChange={handleTeacherEditFormInputChange}
                    placeholder="Juan"
                  />
                </label>
                <label>
                  Last Name
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={teacherEditFormState.lastName}
                    onChange={handleTeacherEditFormInputChange}
                    placeholder="Dela Cruz"
                  />
                </label>
              </div>

              <label>
                Teacher Email or Username
                <input
                  type="text"
                  name="email"
                  required
                  value={teacherEditFormState.email}
                  onChange={handleTeacherEditFormInputChange}
                  placeholder="teacher@school.edu or teacher01"
                />
              </label>

              <div className="admin-create-teacher-grid">
                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={teacherEditFormState.password}
                    onChange={handleTeacherEditFormInputChange}
                    placeholder="At least 8 characters"
                  />
                </label>
                <label>
                  Confirm Password
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={8}
                    value={teacherEditFormState.confirmPassword}
                    onChange={handleTeacherEditFormInputChange}
                    placeholder="Re-enter password"
                  />
                </label>
              </div>

              <button type="submit" className="admin-create-teacher-submit" disabled={teacherFormSubmitting}>
                {teacherFormSubmitting ? 'Saving changes...' : 'Save Changes'}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      <section className="admin-management-list-panel">
        <h2>Available Teachers</h2>
        <div className="admin-management-grid" aria-label="Teacher cards">
        {teacherCards.map((teacher) => (
          <article key={teacher.id} className="admin-management-card">
            <div className="admin-management-card-top">
              <div>
                <h2>{teacher.name}</h2>
                <p className="admin-management-email">✉ {teacher.email}</p>
              </div>
              <span className="admin-management-chip">{teacher.subject}</span>
            </div>

            <p className="admin-management-meta">📖 Class: <strong>{teacher.className}</strong></p>

            <div className="admin-management-progress-row">
              <div>
                <p>Average Score</p>
                <strong>{teacher.averageScore}%</strong>
              </div>
              <div className="admin-management-progress-track">
                <i style={{ width: `${Math.max(0, Math.min(100, teacher.averageScore))}%` }} />
              </div>
            </div>

            <div className="admin-management-progress-row">
              <div>
                <p>Pass Rate</p>
                <strong>{teacher.passRate}%</strong>
              </div>
              <div className="admin-management-progress-track">
                <i style={{ width: `${Math.max(0, Math.min(100, teacher.passRate))}%` }} />
              </div>
            </div>

            {teacher.topPerformer ? <p className="admin-management-highlight">🏆 Top Performer</p> : null}

            <div className="admin-management-actions">
              <button type="button" className="admin-management-secondary-button" onClick={() => handleOpenEditTeacherModal(teacher)}>✎ Edit</button>
              <button type="button" className="admin-management-danger-button" onClick={() => handleTeacherDelete(teacher)} aria-label={`Delete ${teacher.name}`}>🗑</button>
            </div>
          </article>
        ))}

        {!teachersLoading && teacherCards.length === 0 ? (
          <article className="admin-management-card">
            <h2>No teacher accounts yet</h2>
            <p className="admin-management-subject">Create one using the Add Teacher button above.</p>
          </article>
        ) : null}
        </div>
      </section>
    </AdminLayout>
  );
}

export default Teachers;
