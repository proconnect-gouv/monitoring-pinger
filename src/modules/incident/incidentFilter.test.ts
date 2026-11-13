import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { IncidentFilter, getThresholdMinutes, loadIncidentFilters } from './incidentFilter';

const OPENDESK_ID = 797674539;
const filters: IncidentFilter[] = [
    { monitorId: OPENDESK_ID, minutes: 120, from: '03:30', to: '04:30' },
];

describe('getThresholdMinutes', () => {
    it('uses the filter threshold for an incident starting in the window (winter time, UTC+1)', () => {
        const result = getThresholdMinutes(
            { monitorId: OPENDESK_ID, startedAt: '2026-11-13T02:52:00.000Z' }, // 03:52 Paris
            filters,
            20,
        );
        assert.deepEqual(result, { minutes: 120, filter: filters[0] });
    });

    it('uses the filter threshold for an incident starting in the window (summer time, UTC+2)', () => {
        const result = getThresholdMinutes(
            { monitorId: OPENDESK_ID, startedAt: '2026-07-01T01:52:00.000Z' }, // 03:52 Paris
            filters,
            20,
        );
        assert.equal(result.minutes, 120);
    });

    it('applies the window in Paris time, not UTC', () => {
        const result = getThresholdMinutes(
            { monitorId: OPENDESK_ID, startedAt: '2026-07-01T02:52:00.000Z' }, // 04:52 Paris
            filters,
            20,
        );
        assert.deepEqual(result, { minutes: 20, filter: undefined });
    });

    it('uses the default threshold outside the window', () => {
        const result = getThresholdMinutes(
            { monitorId: OPENDESK_ID, startedAt: '2026-11-13T13:00:00.000Z' }, // 14:00 Paris
            filters,
            20,
        );
        assert.deepEqual(result, { minutes: 20, filter: undefined });
    });

    it('uses the default threshold for another monitor', () => {
        const result = getThresholdMinutes(
            { monitorId: 123, startedAt: '2026-11-13T02:52:00.000Z' },
            filters,
            20,
        );
        assert.deepEqual(result, { minutes: 20, filter: undefined });
    });

    it('includes the start of the window', () => {
        const result = getThresholdMinutes(
            { monitorId: OPENDESK_ID, startedAt: '2026-11-13T02:30:00.000Z' }, // 03:30 Paris
            filters,
            20,
        );
        assert.equal(result.minutes, 120);
    });

    it('excludes the end of the window', () => {
        const result = getThresholdMinutes(
            { monitorId: OPENDESK_ID, startedAt: '2026-11-13T03:30:00.000Z' }, // 04:30 Paris
            filters,
            20,
        );
        assert.equal(result.minutes, 20);
    });

    it('accepts a Date as startedAt (as returned by pg for timestamptz)', () => {
        const result = getThresholdMinutes(
            {
                monitorId: OPENDESK_ID,
                startedAt: new Date('2026-11-13T02:52:00.000Z') as unknown as string,
            },
            filters,
            20,
        );
        assert.equal(result.minutes, 120);
    });
});

describe('loadIncidentFilters', () => {
    it('returns the default filters when the variable is not set', () => {
        const onError = mock.fn();
        assert.equal(loadIncidentFilters(undefined, filters, onError), filters);
        assert.equal(onError.mock.callCount(), 0);
    });

    it('replaces the default filters with the configured ones', () => {
        const onError = mock.fn();
        const result = loadIncidentFilters(
            '[{"monitorId":1,"minutes":60,"from":"01:00","to":"02:00"}]',
            filters,
            onError,
        );
        assert.deepEqual(result, [{ monitorId: 1, minutes: 60, from: '01:00', to: '02:00' }]);
        assert.equal(onError.mock.callCount(), 0);
    });

    it('disables filtering with an empty array', () => {
        assert.deepEqual(loadIncidentFilters('[]', filters, mock.fn()), []);
    });

    for (const [description, rawValue] of [
        ['malformed JSON', '[{'],
        ['not an array', '{"monitorId":1,"minutes":60,"from":"01:00","to":"02:00"}'],
        ['missing monitorId', '[{"minutes":60,"from":"01:00","to":"02:00"}]'],
        ['monitorId as string', '[{"monitorId":"1","minutes":60,"from":"01:00","to":"02:00"}]'],
        ['non-positive minutes', '[{"monitorId":1,"minutes":0,"from":"01:00","to":"02:00"}]'],
        ['badly formatted time', '[{"monitorId":1,"minutes":60,"from":"1:00","to":"02:00"}]'],
        ['window crossing midnight', '[{"monitorId":1,"minutes":60,"from":"23:30","to":"00:30"}]'],
        ['empty window', '[{"monitorId":1,"minutes":60,"from":"01:00","to":"01:00"}]'],
    ]) {
        it(`logs an error and applies no filter on ${description}`, () => {
            const onError = mock.fn();
            assert.deepEqual(loadIncidentFilters(rawValue, filters, onError), []);
            assert.equal(onError.mock.callCount(), 1);
        });
    }
});
