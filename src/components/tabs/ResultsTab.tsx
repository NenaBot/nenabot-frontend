
import { BarChart3, Download, Share2, Filter, TrendingUp } from 'lucide-react';

export function ResultsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl mb-1">Scan Results & Analysis</h2>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Complete analysis and visualization of scan data
          </p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 border border-[var(--md-sys-color-outline)] rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
            <button className="px-4 py-2 border border-[var(--md-sys-color-outline)] rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
            <button className="px-4 py-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-lg hover:shadow-md transition-all text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Empty State */}
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-12 bg-[var(--md-sys-color-surface-container-lowest)]">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-[var(--md-sys-color-on-primary-container)]" />
          </div>
          <h3 className="text-xl mb-2">No Results Available</h3>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-6">
            Complete a scan to view detailed analysis, spectral data, and heat maps. 
            Results will include wavelength distributions, intensity measurements, and statistical analysis.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full hover:shadow-lg transition-all text-sm">
              Start New Scan
            </button>
            <button className="px-6 py-3 border border-[var(--md-sys-color-outline)] rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-sm">
              Load Previous Results
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[var(--md-sys-color-tertiary-container)] rounded-lg">
              <TrendingUp className="w-5 h-5 text-[var(--md-sys-color-on-tertiary-container)]" />
            </div>
            <h4 className="font-medium">Statistical Analysis</h4>
          </div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Mean, median, standard deviation, and distribution analysis of spectral data
          </p>
        </div>

        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[var(--md-sys-color-secondary-container)] rounded-lg">
              <BarChart3 className="w-5 h-5 text-[var(--md-sys-color-on-secondary-container)]" />
            </div>
            <h4 className="font-medium">Spectral Plots</h4>
          </div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Interactive charts showing wavelength vs. intensity across measurement points
          </p>
        </div>

        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[var(--md-sys-color-tertiary-container)] rounded-lg">
              <Download className="w-5 h-5 text-[var(--md-sys-color-on-primary-container)]" />
            </div>
            <h4 className="font-medium">Export Options</h4>
          </div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            CSV, JSON, PDF reports, and image exports for further analysis
          </p>
        </div>
      </div>
    </div>
  );
}
