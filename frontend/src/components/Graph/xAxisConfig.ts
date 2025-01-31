import { Chart, TimeUnit } from 'chart.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { GlobalReducer } from 'types/reducer/globalTime';

interface ITimeUnit {
	[key: string]: TimeUnit;
}
interface IAxisTimeUintConfig {
	unitName: TimeUnit;
	multiplier: number;
}

interface IAxisTimeConfig {
	unitName: TimeUnit;
	stepSize: number;
}

export interface ITimeRange {
	minTime: number | null;
	maxTime: number | null;
}

export const TIME_UNITS: ITimeUnit = {
	millisecond: 'millisecond',
	second: 'second',
	minute: 'minute',
	hour: 'hour',
	day: 'day',
	week: 'week',
	month: 'month',
	year: 'year',
};

const TIME_UNITS_CONFIG: IAxisTimeUintConfig[] = [
	{
		unitName: TIME_UNITS.millisecond,
		multiplier: 1,
	},
	{
		unitName: TIME_UNITS.second,
		multiplier: 1 / 1e3,
	},
	{
		unitName: TIME_UNITS.minute,
		multiplier: 1 / (1e3 * 60),
	},
	{
		unitName: TIME_UNITS.hour,
		multiplier: 1 / (1e3 * 60 * 60),
	},
	{
		unitName: TIME_UNITS.day,
		multiplier: 1 / (1e3 * 60 * 60 * 24),
	},
	{
		unitName: TIME_UNITS.week,
		multiplier: 1 / (1e3 * 60 * 60 * 24 * 7),
	},
	{
		unitName: TIME_UNITS.month,
		multiplier: 1 / (1e3 * 60 * 60 * 24 * 30),
	},
	{
		unitName: TIME_UNITS.year,
		multiplier: 1 / (1e3 * 60 * 60 * 24 * 365),
	},
];

/**
 * Accepts Chart.js data's data-structure and returns the relevant time unit for the axis based on the range of the data.
 */
export const useXAxisTimeUnit = (data: Chart['data']): IAxisTimeConfig => {
	// Local time is the time range inferred from the input chart data.
	let localTime: ITimeRange | null;
	try {
		let minTime = Number.POSITIVE_INFINITY;
		let maxTime = Number.NEGATIVE_INFINITY;
		data?.labels?.forEach((timeStamp: string | number): void => {
			if (typeof timeStamp === 'string') timeStamp = Date.parse(timeStamp);
			minTime = Math.min(timeStamp, minTime);
			maxTime = Math.max(timeStamp, maxTime);
		});

		localTime = {
			minTime: minTime === Number.POSITIVE_INFINITY ? null : minTime,
			maxTime: maxTime === Number.NEGATIVE_INFINITY ? null : maxTime,
		};
	} catch (error) {
		localTime = null;
		console.error(error);
	}

	// Global time is the time selected from the global time selector menu.
	const globalTime = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);

	// Use local time if valid else use the global time range
	const { maxTime, minTime } = useMemo(() => {
		if (localTime && localTime.maxTime && localTime.minTime) {
			return {
				minTime: localTime.minTime,
				maxTime: localTime.maxTime,
			};
		}
		return {
			minTime: globalTime.minTime / 1e6,
			maxTime: globalTime.maxTime / 1e6,
		};
	}, [globalTime, localTime]);

	return convertTimeRange(minTime, maxTime);
};

/**
 * Finds the relevant time unit based on the input time stamps (in ms)
 */
export const convertTimeRange = (
	start: number,
	end: number,
): IAxisTimeConfig => {
	const MIN_INTERVALS = 6;
	const range = end - start;
	let relevantTimeUnit = TIME_UNITS_CONFIG[1];
	let stepSize = 1;
	try {
		for (let idx = TIME_UNITS_CONFIG.length - 1; idx >= 0; idx--) {
			const timeUnit = TIME_UNITS_CONFIG[idx];
			const units = range * timeUnit.multiplier;
			const steps = units / MIN_INTERVALS;
			if (steps >= 1) {
				relevantTimeUnit = timeUnit;
				stepSize = steps;
				break;
			}
		}
	} catch (error) {
		console.error(error);
	}
	return {
		unitName: relevantTimeUnit.unitName,
		stepSize: Math.floor(stepSize) || 1,
	};
};
