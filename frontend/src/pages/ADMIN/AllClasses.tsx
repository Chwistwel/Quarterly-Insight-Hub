import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import AdminLayout from './AdminLayout';
import { fetchJson } from '../../services/api';
import '../../styles/ADMIN/AdminManagement.css';

type ClassCard = {
  id: string;
  className: string;
  gradeLevel: string;
  section: string;
  subject: string;
  teacherName: string;
  studentCount: number;
};

type ClassListResponse = {
  classes: ClassCard[];
};

type TeacherListResponse = {
  teachers: Array<{
    firstName: string;
    lastName: string;
  }>;
};

type ClassFormState = {
  className: string;
  gradeLevel: string;
  section: string;
  subject: string;
  teacherName: string;
  studentCount: string;
};

const gradeLevelOptions = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

const initialClassFormState: ClassFormState = {
  className: '',
  gradeLevel: 'Grade 1',
  section: '',
  subject: '',
  teacherName: '',
  studentCount: '0'
};

function AllClasses() {
  const [classCards, setClassCards] = useState<ClassCard[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [createClassFormState, setCreateClassFormState] = useState<ClassFormState>(initialClassFormState);
  const [editClassFormState, setEditClassFormState] = useState<ClassFormState>(initialClassFormState);
  const [classFormSubmitting, setClassFormSubmitting] = useState(false);
  const [classFormMessage, setClassFormMessage] = useState('');
  const [classFormError, setClassFormError] = useState('');

  const getAdminHeaders = () => {
    const role = localStorage.getItem('userRole') ?? '';
    const email = localStorage.getItem('userEmail') ?? '';
    return {
      'x-user-role': role,
      'x-user-email': email
    };
  };

  const loadClassCards = async () => {
    setClassesLoading(true);

    try {
      const response = await fetchJson<ClassListResponse>('/api/admin/classes', {
        method: 'GET',
        headers: getAdminHeaders()
      });

      setClassCards(response.classes);
    } catch (error) {
      setClassFormError(error instanceof Error ? error.message : 'Unable to load class records.');
    } finally {
      setClassesLoading(false);
    }
  };

  const loadTeacherOptions = async () => {
    try {
      const response = await fetchJson<TeacherListResponse>('/api/admin/teachers', {
        method: 'GET',
        headers: getAdminHeaders()
      });

      const teacherNames = response.teachers.map((teacher) => `${teacher.firstName} ${teacher.lastName}`);
      setTeacherOptions(teacherNames);
      setCreateClassFormState((previous) => ({
        ...previous,
        teacherName: previous.teacherName || teacherNames[0] || ''
      }));
    } catch {
      setTeacherOptions([]);
    }
  };

  useEffect(() => {
    void loadClassCards();
    void loadTeacherOptions();
  }, []);

  const handleCreateClassInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setCreateClassFormState((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleEditClassInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setEditClassFormState((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleCreateClassSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClassFormSubmitting(true);
    setClassFormMessage('');
    setClassFormError('');

    try {
      const response = await fetchJson<{ message: string }>('/api/admin/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders()
        },
        body: JSON.stringify({
          ...createClassFormState,
          studentCount: Number(createClassFormState.studentCount)
        })
      });

      setClassFormMessage(response.message);
      setCreateClassFormState((previous) => ({
        ...initialClassFormState,
        teacherName: previous.teacherName || teacherOptions[0] || ''
      }));
      setShowCreateClassModal(false);
      await loadClassCards();
    } catch (error) {
      setClassFormError(error instanceof Error ? error.message : 'Unable to create class record.');
    } finally {
      setClassFormSubmitting(false);
    }
  };

  const handleOpenEditClassModal = (classItem: ClassCard) => {
    setClassFormMessage('');
    setClassFormError('');
    setEditingClassId(classItem.id);
    setEditClassFormState({
      className: classItem.className,
      gradeLevel: classItem.gradeLevel,
      section: classItem.section,
      subject: classItem.subject,
      teacherName: classItem.teacherName,
      studentCount: String(classItem.studentCount)
    });
    setShowEditClassModal(true);
  };

  const handleEditClassSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingClassId) {
      return;
    }

    setClassFormSubmitting(true);
    setClassFormMessage('');
    setClassFormError('');

    try {
      const response = await fetchJson<{ message: string }>(`/api/admin/classes/${encodeURIComponent(editingClassId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders()
        },
        body: JSON.stringify({
          ...editClassFormState,
          studentCount: Number(editClassFormState.studentCount)
        })
      });

      setClassFormMessage(response.message);
      setShowEditClassModal(false);
      setEditingClassId(null);
      await loadClassCards();
    } catch (error) {
      setClassFormError(error instanceof Error ? error.message : 'Unable to update class record.');
    } finally {
      setClassFormSubmitting(false);
    }
  };

  const handleDeleteClass = async (classItem: ClassCard) => {
    const confirmed = window.confirm(`Delete ${classItem.className} - ${classItem.section}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setClassFormMessage('');
    setClassFormError('');

    try {
      const response = await fetchJson<{ message: string }>(`/api/admin/classes/${encodeURIComponent(classItem.id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });

      setClassFormMessage(response.message);
      await loadClassCards();
    } catch (error) {
      setClassFormError(error instanceof Error ? error.message : 'Unable to delete class record.');
    }
  };

  const closeCreateClassModal = () => setShowCreateClassModal(false);
  const closeEditClassModal = () => {
    setShowEditClassModal(false);
    setEditingClassId(null);
  };

  return (
    <AdminLayout kicker="MANAGE CLASS SECTIONS" title="Class Management">
      <section className="admin-management-actions-row">
        <button type="button" className="admin-management-primary-button admin-management-primary-button-right" onClick={() => setShowCreateClassModal(true)}>
          <span aria-hidden="true">＋</span>
          Add Class
        </button>
      </section>

      {!showCreateClassModal && !showEditClassModal && classFormMessage ? <p className="admin-form-feedback admin-form-feedback-success">{classFormMessage}</p> : null}
      {!showCreateClassModal && !showEditClassModal && classFormError ? <p className="admin-form-feedback admin-form-feedback-error">{classFormError}</p> : null}

      {showCreateClassModal ? (
        <div className="admin-management-modal-backdrop" onClick={closeCreateClassModal}>
          <section className="admin-management-form-panel admin-management-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-management-modal-head">
              <h2>Create Class Record</h2>
              <button type="button" className="admin-management-modal-close" onClick={closeCreateClassModal} aria-label="Close add class dialog">×</button>
            </div>
            <p className="admin-subcopy">Create a class section and assign a teacher.</p>

            <form className="admin-create-teacher-form" onSubmit={handleCreateClassSubmit}>
              <div className="admin-create-teacher-grid">
                <label>
                  Class Name
                  <input type="text" name="className" required value={createClassFormState.className} onChange={handleCreateClassInputChange} placeholder="Mathematics" />
                </label>
                <label>
                  Grade Level
                  <select name="gradeLevel" required value={createClassFormState.gradeLevel} onChange={handleCreateClassInputChange}>
                    {gradeLevelOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </label>
              </div>

              <div className="admin-create-teacher-grid">
                <label>
                  Section
                  <input type="text" name="section" required value={createClassFormState.section} onChange={handleCreateClassInputChange} placeholder="Section A" />
                </label>
                <label>
                  Subject
                  <input type="text" name="subject" required value={createClassFormState.subject} onChange={handleCreateClassInputChange} placeholder="Mathematics" />
                </label>
              </div>

              <div className="admin-create-teacher-grid">
                <label>
                  Teacher
                  <select name="teacherName" required value={createClassFormState.teacherName} onChange={handleCreateClassInputChange}>
                    {teacherOptions.length === 0 ? <option value="">No teachers available</option> : null}
                    {teacherOptions.map((teacherName) => <option key={teacherName} value={teacherName}>{teacherName}</option>)}
                  </select>
                </label>
                <label>
                  Number of Students
                  <input type="number" min={0} name="studentCount" required value={createClassFormState.studentCount} onChange={handleCreateClassInputChange} />
                </label>
              </div>

              <button type="submit" className="admin-create-teacher-submit" disabled={classFormSubmitting || teacherOptions.length === 0}>
                {classFormSubmitting ? 'Creating class...' : 'Create Class'}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {showEditClassModal ? (
        <div className="admin-management-modal-backdrop" onClick={closeEditClassModal}>
          <section className="admin-management-form-panel admin-management-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-management-modal-head">
              <h2>Edit Class Record</h2>
              <button type="button" className="admin-management-modal-close" onClick={closeEditClassModal} aria-label="Close edit class dialog">×</button>
            </div>
            <p className="admin-subcopy">Update class details and teacher assignment.</p>

            <form className="admin-create-teacher-form" onSubmit={handleEditClassSubmit}>
              <div className="admin-create-teacher-grid">
                <label>
                  Class Name
                  <input type="text" name="className" required value={editClassFormState.className} onChange={handleEditClassInputChange} />
                </label>
                <label>
                  Grade Level
                  <select name="gradeLevel" required value={editClassFormState.gradeLevel} onChange={handleEditClassInputChange}>
                    {gradeLevelOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </label>
              </div>

              <div className="admin-create-teacher-grid">
                <label>
                  Section
                  <input type="text" name="section" required value={editClassFormState.section} onChange={handleEditClassInputChange} />
                </label>
                <label>
                  Subject
                  <input type="text" name="subject" required value={editClassFormState.subject} onChange={handleEditClassInputChange} />
                </label>
              </div>

              <div className="admin-create-teacher-grid">
                <label>
                  Teacher
                  <select name="teacherName" required value={editClassFormState.teacherName} onChange={handleEditClassInputChange}>
                    {teacherOptions.length === 0 ? <option value="">No teachers available</option> : null}
                    {teacherOptions.map((teacherName) => <option key={teacherName} value={teacherName}>{teacherName}</option>)}
                  </select>
                </label>
                <label>
                  Number of Students
                  <input type="number" min={0} name="studentCount" required value={editClassFormState.studentCount} onChange={handleEditClassInputChange} />
                </label>
              </div>

              <button type="submit" className="admin-create-teacher-submit" disabled={classFormSubmitting || teacherOptions.length === 0}>
                {classFormSubmitting ? 'Saving changes...' : 'Save Changes'}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {classesLoading ? <p className="admin-subcopy">Loading classes...</p> : null}

      <section className="admin-management-list-panel">
        <h2>Available Classes</h2>
        <div className="admin-management-grid" aria-label="Class cards">
        {classCards.map((classItem) => (
          <article key={classItem.id} className="admin-management-card">
            <div className="admin-management-card-top">
              <div>
                <h2>{classItem.className}</h2>
                <p className="admin-management-subject">{classItem.subject}</p>
              </div>
              <span className="admin-management-chip">{classItem.gradeLevel}</span>
            </div>

            <p className="admin-management-meta">🏷 {classItem.section}</p>
            <p className="admin-management-meta">👥 {classItem.studentCount} Students</p>
            <p className="admin-management-meta">📖 {classItem.teacherName}</p>

            <div className="admin-management-actions">
              <button type="button" className="admin-management-secondary-button" onClick={() => handleOpenEditClassModal(classItem)}>✎ Edit</button>
              <button type="button" className="admin-management-danger-button" onClick={() => handleDeleteClass(classItem)} aria-label={`Delete ${classItem.className}`}>🗑</button>
            </div>
          </article>
        ))}

        {!classesLoading && classCards.length === 0 ? (
          <article className="admin-management-card">
            <h2>No class records yet</h2>
            <p className="admin-management-subject">Create one using the Add Class button above.</p>
          </article>
        ) : null}
        </div>
      </section>
    </AdminLayout>
  );
}

export default AllClasses;
