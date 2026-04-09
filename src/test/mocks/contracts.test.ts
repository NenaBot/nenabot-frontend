import { mockJobEvents } from '../../mocks/progressMocks';

describe('mock contract guards', () => {
  test('mock job events keep required SSE fields', () => {
    expect(mockJobEvents.length).toBeGreaterThan(0);

    for (const event of mockJobEvents) {
      expect(typeof event.type).toBe('string');
      expect(event.type.length).toBeGreaterThan(0);
      expect(typeof event.jobId).toBe('string');
      expect(event.jobId.length).toBeGreaterThan(0);
      expect(typeof event.state).toBe('string');
      expect(event.state.length).toBeGreaterThan(0);

      if (event.lastPointProcessed !== undefined) {
        expect(Number.isFinite(event.lastPointProcessed)).toBe(true);
      }

      if (event.totalPoints !== undefined) {
        expect(Number.isFinite(event.totalPoints)).toBe(true);
      }

      if (event.measurement) {
        expect(Number.isInteger(event.measurement.waypointIndex)).toBe(true);
        expect(event.measurement.waypoint).toEqual(
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
          }),
        );
      }
    }
  });
});
