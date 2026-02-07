import React, { useState } from 'react';
import { Play, MapPin, Grid3x3, Info, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export function RouteTab() {
  const [routeData, setRouteData] = useState({
    routeEnabled: true,
    scanPattern: 'grid',
    resolution: '50',
    areaWidth: '100',
    areaHeight: '100',
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Route Settings */}
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h2 className="text-2xl mb-1">Route Planning</h2>
          <p className="text-sm text-(--md-sys-color-on-surface-variant)">
            Define the scan area and pattern
          </p>
        </div>

        <section className="border border-(--md-sys-color-outline-variant) rounded-2xl p-5 bg-(--md-sys-color-surface-container-lowest)">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-(--md-sys-color-primary)" />
            <h3 className="text-lg">Scan Parameters</h3>
          </div>
          
          <div className="mb-5">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-colors">
              <input 
                type="checkbox" 
                checked={routeData.routeEnabled}
                onChange={(e) => setRouteData(prev => ({ ...prev, routeEnabled: e.target.checked }))}
                className="mt-1 w-5 h-5 rounded border-(--md-sys-color-outline) accent-(--md-sys-color-primary)"
              />
              <div className="flex-1">
                <div className="text-sm mb-0.5">Enable Automatic Route Planning</div>
                <div className="text-xs text-(--md-sys-color-on-surface-variant)">
                  System will optimize scan path for efficiency
                </div>
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1 text-sm mb-2 text-(--md-sys-color-on-surface)">
                Scan Pattern
                <Info className="w-3.5 h-3.5 text-(--md-sys-color-on-surface-variant)" title="Pattern for area coverage" />
              </label>
              <select 
                value={routeData.scanPattern}
                onChange={(e) => setRouteData(prev => ({ ...prev, scanPattern: e.target.value }))}
                className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
                disabled={!routeData.routeEnabled}
              >
                <option value="grid">Grid Pattern</option>
                <option value="spiral">Spiral Pattern</option>
                <option value="random">Random Sampling</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-1 text-sm mb-2 text-(--md-sys-color-on-surface)">
                Resolution (points/cm)
                <Info className="w-3.5 h-3.5 text-(--md-sys-color-on-surface-variant)" title="Measurement density" />
              </label>
              <input 
                type="number" 
                value={routeData.resolution}
                onChange={(e) => setRouteData(prev => ({ ...prev, resolution: e.target.value }))}
                className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
                disabled={!routeData.routeEnabled}
                min="10"
                max="200"
              />
              <p className="text-xs text-(--md-sys-color-on-surface-variant) mt-1">
                Higher = More detailed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-sm mb-2 text-(--md-sys-color-on-surface)">
                  Width (cm)
                  <Info className="w-3.5 h-3.5 text-(--md-sys-color-on-surface-variant)" title="Scan area width" />
                </label>
                <input 
                  type="number" 
                  value={routeData.areaWidth}
                  onChange={(e) => setRouteData(prev => ({ ...prev, areaWidth: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
                  disabled={!routeData.routeEnabled}
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm mb-2 text-(--md-sys-color-on-surface)">
                  Height (cm)
                  <Info className="w-3.5 h-3.5 text-(--md-sys-color-on-surface-variant)" title="Scan area height" />
                </label>
                <input 
                  type="number" 
                  value={routeData.areaHeight}
                  onChange={(e) => setRouteData(prev => ({ ...prev, areaHeight: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
                  disabled={!routeData.routeEnabled}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-(--md-sys-color-secondary-container) rounded-lg">
            <div className="text-xs text-(--md-sys-color-on-secondary-container) space-y-1">
              <div className="flex justify-between">
                <span>Estimated Points:</span>
                <span className="font-medium">2,500</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Time:</span>
                <span className="font-medium">~12 minutes</span>
              </div>
            </div>
          </div>
        </section>

        <button className="w-full px-6 py-3 bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) rounded-full flex items-center justify-center gap-2 hover:shadow-lg transition-all text-sm">
          <Play className="w-4 h-4 fill-current" />
          Start Scan
        </button>
      </div>

      {/* Right Panel - Map Visualization */}
      <div className="lg:col-span-2">
        <div className="border border-(--md-sys-color-outline-variant) rounded-2xl overflow-hidden bg-(--md-sys-color-surface-container-lowest)">
          <div className="flex items-center justify-between px-5 py-3 border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface)">
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4 text-(--md-sys-color-on-surface-variant)" />
              <span className="text-sm">Scan Area Visualization</span>
            </div>
            <div className="flex gap-1">
              <button className="p-2 hover:bg-(--md-sys-color-surface-variant) rounded transition-colors" title="Zoom in">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-(--md-sys-color-surface-variant) rounded transition-colors" title="Zoom out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-(--md-sys-color-surface-variant) rounded transition-colors" title="Fit to screen">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="w-full h-[500px] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center relative">
            <div className="text-center text-white/50">
              <Grid3x3 className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Map visualization will appear here</p>
              <p className="text-xs mt-1">Configure scan parameters to preview route</p>
            </div>
            
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
