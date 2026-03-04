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
		<TeacherLayout title={data?.title ?? ''}>
			{data?.systemLabel || data?.title || data?.viewLabel ? (
				<section className="teacher-dash-heading teacher-page-heading">
					{data?.systemLabel ? <p>{data.systemLabel}</p> : null}
					<div>
						{data?.title ? <h2>{data.title}</h2> : null}
						{data?.viewLabel ? <span>{data.viewLabel}</span> : null}
					</div>
				</section>
			) : null}

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
								<small>{selectedFileName || 'Drag and drop your file or click to browse'}</small>
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
						{data?.fileFormats?.length ? (
							<p>{`Upload ${data.fileFormats.join(' or ')} file with student responses.`}</p>
						) : null}
					</div>
					<div className="upload-instructions-group">
						<h3>Required Columns</h3>
						{data?.requiredColumns?.length ? (
							<ul>
								{data.requiredColumns.map((column) => (
									<li key={column}>{column}</li>
								))}
							</ul>
						) : null}
					</div>
					<div className="upload-instructions-group">
						<h3>Processing Time</h3>
						{data?.processingTime ? <p>{data.processingTime}</p> : null}
					</div>
					<button type="button" className="teacher-secondary-btn">Download Template</button>
				</section>
			</div>

		</TeacherLayout>
	);
}

export default UploadResults;
