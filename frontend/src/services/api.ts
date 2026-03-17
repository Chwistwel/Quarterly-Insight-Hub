const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export function getApiUrl(path: string): string {
	if (typeof path !== 'string' || path.trim().length === 0) {
		throw new Error('Invalid API path.');
	}

	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${API_BASE_URL}${normalizedPath}`;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
	let response: Response;

	try {
		response = await fetch(getApiUrl(path), init);
	} catch {
		throw new Error('Unable to connect to the server. Please start the backend and try again.');
	}

	const contentType = response.headers.get('content-type') ?? '';

	if (!response.ok) {
		let message = 'Request failed.';
		if (contentType.includes('application/json')) {
			const payload = await response.json() as { message?: string };
			message = payload.message ?? message;
		}
		throw new Error(message);
	}

	if (!contentType.includes('application/json')) {
		throw new Error('The server did not return JSON data.');
	}

	return response.json() as Promise<T>;
}
