import {
  clamp,
  isFiniteCoordinate,
  normalizedToSvg,
  polylineFromPoints,
  svgToNormalized,
  SVG_SIZE,
} from '../geometry';
import { RoutePreviewCoordinate } from '../../../../types/routePreview.types';

describe('geometry', () => {
  describe('clamp', () => {
    it('should clamp value within bounds', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(-1, 0, 1)).toBe(0);
      expect(clamp(2, 0, 1)).toBe(1);
    });

    it('should handle edge values', () => {
      expect(clamp(0, 0, 1)).toBe(0);
      expect(clamp(1, 0, 1)).toBe(1);
    });
  });

  describe('normalizedToSvg', () => {
    it('should convert normalized [0..1] to SVG [0..100]', () => {
      expect(normalizedToSvg(0)).toBe(0);
      expect(normalizedToSvg(0.5)).toBe(50);
      expect(normalizedToSvg(1)).toBe(100);
    });

    it('should clamp out-of-range values', () => {
      expect(normalizedToSvg(-0.5)).toBe(0);
      expect(normalizedToSvg(1.5)).toBe(100);
    });
  });

  describe('svgToNormalized', () => {
    it('should convert SVG [0..100] to normalized [0..1]', () => {
      expect(svgToNormalized(0)).toBe(0);
      expect(svgToNormalized(50)).toBe(0.5);
      expect(svgToNormalized(100)).toBe(1);
    });

    it('should clamp out-of-range values', () => {
      expect(svgToNormalized(-50)).toBe(0);
      expect(svgToNormalized(150)).toBe(1);
    });
  });

  describe('isFiniteCoordinate', () => {
    it('should return true for valid finite coordinates', () => {
      expect(isFiniteCoordinate({ x: 0.5, y: 0.5 })).toBe(true);
      expect(isFiniteCoordinate({ x: 0, y: 0 })).toBe(true);
      expect(isFiniteCoordinate({ x: 1, y: 1 })).toBe(true);
    });

    it('should return false for NaN coordinates', () => {
      expect(isFiniteCoordinate({ x: NaN, y: 0.5 })).toBe(false);
      expect(isFiniteCoordinate({ x: 0.5, y: NaN })).toBe(false);
    });

    it('should return false for Infinity coordinates', () => {
      expect(isFiniteCoordinate({ x: Infinity, y: 0.5 })).toBe(false);
      expect(isFiniteCoordinate({ x: 0.5, y: -Infinity })).toBe(false);
    });
  });

  describe('polylineFromPoints', () => {
    it('should generate polyline points string from normalized coordinates', () => {
      const points: RoutePreviewCoordinate[] = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0.5 },
        { x: 1, y: 1 },
      ];

      const result = polylineFromPoints(points);
      expect(result).toBe('0,0 50,50 100,100');
    });

    it('should filter out invalid coordinates with NaN or Infinity', () => {
      const points: RoutePreviewCoordinate[] = [
        { x: 0, y: 0 },
        { x: NaN, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: Infinity, y: 1 },
      ];

      const result = polylineFromPoints(points);
      expect(result).toBe('0,0 50,50');
    });

    it('should return empty string for empty array', () => {
      expect(polylineFromPoints([])).toBe('');
    });

    it('should handle single point', () => {
      expect(polylineFromPoints([{ x: 0.5, y: 0.5 }])).toBe('50,50');
    });
  });

  describe('SVG_SIZE constant', () => {
    it('should define SVG_SIZE as 100', () => {
      expect(SVG_SIZE).toBe(100);
    });
  });
});
