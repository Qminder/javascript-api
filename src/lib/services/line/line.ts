import Line from '../../model/line';
import Location from '../../model/location';
import { extractId, IdOrObject } from '../../util/id-or-object';
import { ApiBase } from '../api-base/api-base';

type LineCreateParameters = Partial<Omit<Line, 'id'>> & Pick<Line, 'name'>;
type LineUpdateParameters = Pick<Line, 'id'> &
	Partial<Pick<Line, 'color' | 'name'>>;

export function list(location: IdOrObject<Location>): Promise<Line[]> {
	const locationId = extractId(location);
	if (!locationId || typeof locationId !== 'string') {
		throw new Error('Location ID invalid or missing.');
	}
	return ApiBase.request(`locations/${ locationId }/lines`).then(
		(response: { data: Line[] }) => response.data,
	);
}

export function details(line: IdOrObject<Line>): Promise<Line> {
	const lineId = extractId(line);
	if (!lineId) {
		throw new Error('Line ID invalid or missing.');
	}
	return ApiBase.request(`lines/${ lineId }/`);
}

export function create(
	location: IdOrObject<Location>,
	line: LineCreateParameters,
): Promise<Line> {
	const locationId = extractId(location);
	if (!locationId || typeof locationId !== 'string') {
		throw new Error('Location ID invalid or missing.');
	}
	if (!line || typeof line !== 'object') {
		throw new Error('Line invalid or missing.');
	}
	if (!line.name || typeof line.name !== 'string') {
		throw new Error('Cannot create a line without a line name.');
	}
	return ApiBase.request(
		`locations/${ locationId }/lines`,
		line,
		'POST',
	) as Promise<Line>;
}

export function update(line: LineUpdateParameters): Promise<any> {
	if (!line || typeof line !== 'object') {
		throw new Error('Line is invalid or missing.');
	}

	const lineId = extractId(line);
	if (!lineId || typeof lineId !== 'string') {
		throw new Error('Line ID is invalid or missing.');
	}

	const lineName = line.name;
	if (!lineName || typeof lineName !== 'string') {
		throw new Error('Cannot update a line without a name.');
	}

	const lineColor = line.color;
	if (!lineColor || typeof lineColor !== 'string') {
		throw new Error('Cannot update a line without a color.');
	}

	const data = { name: lineName, color: lineColor };
	return ApiBase.request(`lines/${ lineId }`, data, 'POST') as Promise<any>;
}

export function enable(line: IdOrObject<Line>): Promise<any> {
	const lineId = extractId(line);
	if (!lineId || typeof lineId !== 'string') {
		throw new Error('Line ID invalid or missing.');
	}
	return ApiBase.request(
		`lines/${ lineId }/enable`,
		undefined,
		'POST',
	) as Promise<any>;
}

export function disable(line: IdOrObject<Line>): Promise<any> {
	const lineId = extractId(line);
	if (!lineId || typeof lineId !== 'string') {
		throw new Error('Line ID invalid or missing.');
	}
	return ApiBase.request(
		`lines/${ lineId }/disable`,
		undefined,
		'POST',
	) as Promise<any>;
}

export function archive(line: IdOrObject<Line>): Promise<any> {
	const lineId = extractId(line);
	if (!lineId || typeof lineId !== 'string') {
		throw new Error('Line ID invalid or missing.');
	}
	return ApiBase.request(
		`lines/${ lineId }/archive`,
		undefined,
		'POST',
	) as Promise<any>;
}

export function unarchive(line: IdOrObject<Line>): Promise<any> {
	const lineId = extractId(line);

	if (!lineId || typeof lineId !== 'string') {
		throw new Error('Line ID invalid or missing.');
	}
	return ApiBase.request(
		`lines/${ lineId }/unarchive`,
		undefined,
		'POST',
	) as Promise<any>;
}

export function deleteLine(line: IdOrObject<Line>): Promise<any> {
	const lineId = extractId(line);

	if (!lineId || typeof lineId !== 'string') {
		throw new Error('Line ID invalid or missing.');
	}
	return ApiBase.request(
		`lines/${ lineId }`,
		undefined,
		'DELETE',
	) as Promise<any>;
}

