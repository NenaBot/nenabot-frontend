import { useState } from 'react';
import { Play, Upload, Download, RotateCcw, Save } from 'lucide-react';
import { CardSection } from './CardSection';
import { FormField } from './FormField';

export function SetupTab() {
  const [formData, setFormData] = useState({
    generalEnabled: true,
    spectrometerEnabled: true,
    scanMode: 'continuous',
    integrationTime: '100',
    averageScans: '5',
    smoothingWindow: '3',
    detectionMode: 'auto',
    exposureTime: '50',
    gainLevel: '2',
    wavelengthRange: '400-900',
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl mb-1">Scan Configuration</h2>
          <p className="text-sm text-(--md-sys-color-on-surface-variant)">
            Configure your spectrometer settings before planning the scan route
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className="p-2 border border-(--md-sys-color-outline) rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            className="px-4 py-2 border border-(--md-sys-color-outline) rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-colors text-sm flex items-center gap-2"
            title="Save configuration"
          >
            <Save className="w-4 h-4" />
            Save Config
          </button>
        </div>
      </div>

      {/* General Settings */}
      <CardSection
        title="General Settings"
        description="Basic scan parameters and operational mode"
        headerContent={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-(--md-sys-color-surface-variant) rounded-full text-xs">
            <div className={`w-2 h-2 rounded-full ${formData.generalEnabled ? 'bg-green-600' : 'bg-gray-400'}`} />
            <span>{formData.generalEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        }
      >
        <div className="mb-5">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-colors">
            <input 
              type="checkbox" 
              checked={formData.generalEnabled}
              onChange={(e) => handleInputChange('generalEnabled', e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-(--md-sys-color-outline) accent-(--md-sys-color-primary)"
            />
            <div className="flex-1">
              <div className="text-sm mb-0.5">Enable General Settings Module</div>
              <div className="text-xs text-(--md-sys-color-on-surface-variant)">
                Activates primary scan configuration. Disable to use last saved settings.
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            label="Scan Mode"
            tooltip="Select the scanning operation mode"
            helpText="Current: Continuous"
            disabled={!formData.generalEnabled}
          >
            <select 
              value={formData.scanMode}
              onChange={(e) => handleInputChange('scanMode', e.target.value)}
              className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) transition-all"
              disabled={!formData.generalEnabled}
            >
              <option value="continuous">Continuous</option>
              <option value="single">Single Shot</option>
              <option value="burst">Burst Mode</option>
            </select>
          </FormField>

          <FormField
            label="Integration Time (ms)"
            tooltip="Time for signal integration"
            helpText="Range: 10-1000ms"
            disabled={!formData.generalEnabled}
          >
            <input 
              type="number" 
              value={formData.integrationTime}
              onChange={(e) => handleInputChange('integrationTime', e.target.value)}
              className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) transition-all"
              disabled={!formData.generalEnabled}
              min="10"
              max="1000"
            />
          </FormField>

          <FormField
            label="Average Scans"
            tooltip="Number of scans to average"
            helpText="Range: 1-100"
            disabled={!formData.generalEnabled}
          >
            <input 
              type="number" 
              value={formData.averageScans}
              onChange={(e) => handleInputChange('averageScans', e.target.value)}
              className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) transition-all"
              disabled={!formData.generalEnabled}
              min="1"
              max="100"
            />
          </FormField>

          <FormField
            label="Smoothing Window"
            tooltip="Data smoothing factor"
            helpText="Range: 1-10"
            disabled={!formData.generalEnabled}
          >
            <input 
              type="number" 
              value={formData.smoothingWindow}
              onChange={(e) => handleInputChange('smoothingWindow', e.target.value)}
              className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) transition-all"
              disabled={!formData.generalEnabled}
              min="1"
              max="10"
            />
          </FormField>
        </div>
      </CardSection>

      {/* Spectrometer Settings */}
      <CardSection
        title="Spectrometer Settings"
        description="Device-specific configuration for all connected spectrometers"
        headerContent={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-(--md-sys-color-surface-variant) rounded-full text-xs">
            <div className={`w-2 h-2 rounded-full ${formData.spectrometerEnabled ? 'bg-green-600' : 'bg-gray-400'}`} />
            <span>{formData.spectrometerEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        }
      >
        <div className="mb-5">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-colors">
            <input 
              type="checkbox" 
              checked={formData.spectrometerEnabled}
              onChange={(e) => handleInputChange('spectrometerEnabled', e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-(--md-sys-color-outline) accent-(--md-sys-color-primary)"
            />
            <div className="flex-1">
              <div className="text-sm mb-0.5">Enable Advanced Spectrometer Controls</div>
              <div className="text-xs text-(--md-sys-color-on-surface-variant)">
                Fine-tune hardware parameters for optimal signal quality. Requires calibration.
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            label="Detection Mode"
            tooltip="Signal detection method"
            helpText="Current: Auto"
            disabled={!formData.spectrometerEnabled}
          >
            <select 
              value={formData.detectionMode}
              onChange={(e) => handleInputChange('detectionMode', e.target.value)}
              className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) transition-all"
              disabled={!formData.spectrometerEnabled}
            >
              <option value="auto">Auto-detect</option>
              <option value="manual">Manual</option>
              <option value="adaptive">Adaptive</option>
            </select>
          </FormField>

          <FormField
            label="Exposure Time (ms)"
            tooltip="Sensor exposure duration"
            helpText="Range: 1-500ms"
            disabled={!formData.spectrometerEnabled}
          >
            <input 
              type="number" 
              value={formData.exposureTime}
              onChange={(e) => handleInputChange('exposureTime', e.target.value)}
              className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) transition-all"
              disabled={!formData.spectrometerEnabled}
              min="1"
              max="500"
            />
          </FormField>

          <FormField
            label="Gain Level"
            tooltip="Signal amplification level"
            helpText="Range: 1-10"
            disabled={!formData.spectrometerEnabled}
          >
            <input 
              type="number" 
              value={formData.gainLevel}
              onChange={(e) => handleInputChange('gainLevel', e.target.value)}
              className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) transition-all"
              disabled={!formData.spectrometerEnabled}
              min="1"
              max="10"
            />
          </FormField>

          <FormField
            label="Wavelength (nm)"
            tooltip="Measurement range"
            helpText="Format: min-max"
            disabled={!formData.spectrometerEnabled}
          >
            <input 
              type="text" 
              value={formData.wavelengthRange}
              onChange={(e) => handleInputChange('wavelengthRange', e.target.value)}
              className="w-full px-3 py-2.5 border border-(--md-sys-color-outline) rounded-lg bg-(--md-sys-color-surface) text-sm focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) transition-all"
              disabled={!formData.spectrometerEnabled}
              placeholder="400-900"
            />
          </FormField>
        </div>
      </CardSection>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-(--md-sys-color-outline-variant)">
        <div className="flex gap-3">
          <button className="p-2.5 border border-(--md-sys-color-outline) rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-all" title="Import configuration">
            <Upload className="w-4 h-4" />
          </button>
          <button className="p-2.5 border border-(--md-sys-color-outline) rounded-lg hover:bg-(--md-sys-color-surface-variant) transition-all" title="Export configuration">
            <Download className="w-4 h-4" />
          </button>
        </div>
        <button className="px-6 py-3 bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) rounded-full flex items-center gap-2 hover:shadow-lg transition-all text-sm">
          <Play className="w-4 h-4 fill-current" />
          Plan Route & Continue
        </button>
      </div>
    </div>
  );
}
