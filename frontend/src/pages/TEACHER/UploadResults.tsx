import { useEffect, useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { getUploadMetaData, type UploadMetaResponse } from '../../services/teacherPortalApi';
import '../../styles/TEACHER/UploadResults.css';

function UploadResults() {
	const [data, setData] = useState<UploadMetaResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedFileName, setSelectedFileName] = useState('');

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

			<div className="upload-layout upload-layout-alt">
				<div className="upload-left-col">
					<section className="teacher-panel">
						<h2>Exam Details</h2>
						<form className="upload-form" onSubmit={(event) => event.preventDefault()}>
							<div className="upload-form-grid">
								<label>
									Class
									<select defaultValue="">
										<option value="" disabled>Select class</option>
										{(data?.gradeLevels ?? []).map((grade) => <option key={grade} value={grade}>{grade}</option>)}
									</select>
								</label>

								<label>
									Subject
									<select defaultValue="">
										<option value="" disabled>Select subject</option>
										{(data?.subjects ?? []).map((subject) => <option key={subject} value={subject}>{subject}</option>)}
									</select>
								</label>
							</div>

							<label>
								Quarter
								<select defaultValue="">
									<option value="" disabled>Select grade</option>
									{(data?.quarters ?? []).map((quarter) => <option key={quarter} value={quarter}>{quarter}</option>)}
								</select>
							</label>

							<label className="upload-dropzone">
								<span>Upload CSV/Excel File</span>
								<input
									type="file"
									onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? '')}
								/>
								<strong className="upload-dropzone-icon">📄</strong>
								<small>{selectedFileName || 'Drag and drop your file or click to browse'}</small>
								<em>Supports CSV, XLSX, XLS files</em>
							</label>

							<button className="teacher-primary-btn" type="submit">Submit Results</button>
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
