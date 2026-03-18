import { useEffect, useState, useMemo } from 'react';
import TeacherLayout from './TeacherLayout';
import { getUploadMetaData, type UploadMetaResponse } from '../../services/teacherPortalApi';
import { getApiUrl } from '../../services/api';
import { CheckCircleIcon, FileIcon } from '../../components/icons';
import '../../styles/TEACHER/UploadResults.css';

function UploadResults() {
	const [data, setData] = useState<UploadMetaResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedFileName, setSelectedFileName] = useState('');
	const [selectedClass, setSelectedClass] = useState('');
	const [selectedSubject, setSelectedSubject] = useState('');
	const [selectedQuarter, setSelectedQuarter] = useState('');
	const [fileInput, setFileInput] = useState<File | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await getUploadMetaData();
				setData(response);
			} catch (loadError) {
				setData(null);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load upload metadata.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, []);

	// Calculate available subjects based on selected class
	const availableSubjects = useMemo(() => {
		if (!selectedClass || !data?.classSubjectMap) {
			return data?.subjects ?? [];
		}
		return data.classSubjectMap[selectedClass] ?? [];
	}, [selectedClass, data?.classSubjectMap, data?.subjects]);

	// Reset subject when class changes
	useEffect(() => {
		setSelectedSubject('');
	}, [selectedClass]);

	const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedClass(e.target.value);
	};

	const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedSubject(e.target.value);
	};

	const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedQuarter(e.target.value);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.currentTarget.files?.[0];
		if (file) {
			setSelectedFileName(file.name);
			setFileInput(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitError(null);
		setSubmitSuccess(false);

		if (!selectedClass) {
			setSubmitError('Please select a class');
			return;
		}

		if (!selectedSubject) {
			setSubmitError('Please select a subject');
			return;
		}

		if (!selectedQuarter) {
			setSubmitError('Please select a quarter');
			return;
		}

		if (!fileInput) {
			setSubmitError('Please select a file to upload');
			return;
		}

		try {
			setSubmitting(true);
			const formData = new FormData();
			formData.append('file', fileInput);
			formData.append('class', selectedClass);
			formData.append('subject', selectedSubject);
			formData.append('quarter', selectedQuarter);

			const response = await fetch(getApiUrl('/api/item-analysis/compute'), {
				method: 'POST',
				body: formData,
				headers: {
					'x-user-role': localStorage.getItem('userRole') ?? '',
					'x-user-email': localStorage.getItem('userEmail') ?? ''
				}
			});

			if (!response.ok) {
				const responseText = await response.text();
				let errorMessage = `Upload failed (${response.status})`;

				if (responseText.trim()) {
					try {
						const errorData = JSON.parse(responseText) as { message?: string };
						errorMessage = errorData.message ?? errorMessage;
					} catch {
						errorMessage = responseText;
					}
				}

				throw new Error(errorMessage);
			}

			setSubmitSuccess(true);
			setFileInput(null);
			setSelectedFileName('');
			setSelectedClass('');
			setSelectedSubject('');
			setSelectedQuarter('');

			// Reload the page to show the updated data
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : 'Upload failed');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<TeacherLayout title={data?.title ?? 'Upload Quarterly Exam Results'}>
			<section className="teacher-dash-heading teacher-page-heading">
				<p>{data?.systemLabel ?? 'UPLOAD AND ANALYZE STUDENT PERFORMANCE DATA'}</p>
				<div className="teacher-heading-row">
					<h2>{data?.title ?? 'Upload Quarterly Exam Results'}</h2>
				</div>
			</section>

			{loading ? <p className="teacher-status">Loading upload form...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}
			{submitError ? <p className="teacher-status teacher-status-error">{submitError}</p> : null}
			{submitSuccess ? <p className="teacher-status upload-success-message" style={{ color: '#28a745' }}><CheckCircleIcon className="ui-inline-icon" /> File uploaded successfully!</p> : null}

			<div className="upload-layout upload-layout-alt">
				<div className="upload-left-col">
					<section className="teacher-panel">
						<h2>Exam Details</h2>
						<form className="upload-form" onSubmit={handleSubmit}>
							<div className="upload-form-grid">
								<label>
									Class
									<select value={selectedClass} onChange={handleClassChange}>
										<option value="" disabled>Select class</option>
										{(data?.gradeLevels ?? []).map((grade) => <option key={grade} value={grade}>{grade}</option>)}
									</select>
								</label>

								<label>
									Subject
									<select value={selectedSubject} onChange={handleSubjectChange} disabled={!selectedClass}>
										<option value="" disabled>Select subject</option>
										{availableSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
									</select>
								</label>
							</div>

							<label>
								Quarter
								<select value={selectedQuarter} onChange={handleQuarterChange}>
									<option value="" disabled>Select grade</option>
									{(data?.quarters ?? []).map((quarter) => <option key={quarter} value={quarter}>{quarter}</option>)}
								</select>
							</label>

							<label className="upload-dropzone">
								<span>Upload CSV/Excel File</span>
								<input
									type="file"
									onChange={handleFileChange}
								/>
								<strong className="upload-dropzone-icon"><FileIcon className="upload-dropzone-icon-svg" /></strong>
								<small>{selectedFileName || 'Drag and drop your file or click to browse'}</small>
								<em>Supports CSV, XLSX, XLS files</em>
							</label>

							<button className="teacher-primary-btn" type="submit" disabled={submitting}>
								{submitting ? 'Submitting...' : 'Submit Results'}
							</button>
						</form>
					</section>

					<section className="teacher-panel">
						<h2>My Recent Uploads</h2>
						{data?.recentUploads?.length ? (
							<ul className="teacher-highlight-list upload-recent-list">
								{data.recentUploads.map((upload) => (
									<li key={upload.fileName}>
										<div>
											<span>{upload.fileName}</span>
											<small>{upload.uploadedAt ?? 'N/A'}</small>
										</div>
										<strong className="upload-status-done">{upload.status}</strong>
									</li>
								))}
							</ul>
						) : (
							<p className="teacher-status">No uploads found.</p>
						)}
					</section>
				</div>

				<section className="teacher-panel upload-instructions-panel">
					<h2>Upload Instructions</h2>
					<div className="upload-instructions-group">
						<h3>File Format</h3>
						<p>
							{data?.fileFormats?.length
								? `Upload ${data.fileFormats.join(' or ')} file with student responses. Ensure the file follows the required format.`
								: 'Upload a CSV or Excel file with student responses. Ensure the file follows the required format.'}
						</p>
					</div>
					<div className="upload-instructions-group">
						<h3>Required Columns</h3>
						<ul>
							{(data?.requiredColumns ?? ['Student ID', 'Student Name', 'Item Responses (1-50)', 'Answer Key']).map((column) => (
								<li key={column}>{column}</li>
							))}
						</ul>
					</div>
					<div className="upload-instructions-group">
						<h3>Processing Time</h3>
						<p>{data?.processingTime ?? 'Analysis typically takes 5-10 minutes depending on the number of students.'}</p>
					</div>
					<button type="button" className="teacher-secondary-btn">Download Template</button>
				</section>
			</div>

		</TeacherLayout>
	);
}

export default UploadResults;
