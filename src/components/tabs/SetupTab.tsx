import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, RefreshCcw, Cpu } from 'lucide-react';
import { CardSection } from '../CardSection';
import { CalibrationModal } from '../modals/CalibrationModal';
import { fetchDefaultProfile, fetchProfiles, ProfileApiResponse } from '../../services/apiCalls';
import { ProfileModel } from '../../types/profile.types';
import { getMockDefaultProfile, getMockProfiles } from '../../mocks/profileMocks';
import { isMockModeEnabled } from '../../state/mockMode';

interface SetupTabProps {
  selectedProfile: ProfileModel | null;
  onProfileChange: (profile: ProfileModel) => void;
  onNext?: () => void;
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function resolveProfileThreshold(profile: ProfileApiResponse): number {
  const fromTopLevel = parseFiniteNumber(profile.threshold);
  if (fromTopLevel !== null) {
    return fromTopLevel;
  }

  const fromOptions = parseFiniteNumber(profile.options?.threshold);
  if (fromOptions !== null) {
    return fromOptions;
  }

  return 120;
}

function toProfileModel(profile: ProfileApiResponse): ProfileModel {
  return {
    name: profile.name,
    description: profile.description ?? '',
    settings: {
      workZ:
        typeof profile.workZ === 'number' && Number.isFinite(profile.workZ) ? profile.workZ : 0,
      workR:
        typeof profile.workR === 'number' && Number.isFinite(profile.workR) ? profile.workR : 0,
      threshold: resolveProfileThreshold(profile),
      options: profile.options ?? {},
    },
  };
}

function parseJsonOptions(value: string): Record<string, unknown> {
  if (value.trim().length === 0) {
    return {};
  }

  const parsed = JSON.parse(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  return {};
}

function getWorkSettingError(rawValue: string): string | null {
  if (rawValue.trim().length === 0) {
    return 'Invalid input';
  }

  if (rawValue === '-' || rawValue === '.' || rawValue === '-.') {
    return 'Invalid input';
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return 'Invalid input';
  }

  return null;
}

function getThresholdSettingError(rawValue: string): string | null {
  if (rawValue.trim().length === 0) {
    return 'Invalid input';
  }

  if (rawValue === '-' || rawValue === '.' || rawValue === '-.') {
    return 'Invalid input';
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 'Invalid input';
  }

  return null;
}

export function SetupTab({ selectedProfile, onProfileChange, onNext }: SetupTabProps) {
  const [profiles, setProfiles] = useState<ProfileModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [workText, setWorkText] = useState<{ workZ: string; workR: string }>({
    workZ: '0',
    workR: '0',
  });
  const [workError, setWorkError] = useState<{ workZ: string | null; workR: string | null }>({
    workZ: null,
    workR: null,
  });
  const [thresholdText, setThresholdText] = useState('120');
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [optionsText, setOptionsText] = useState('{}');
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const selectedProfileName = selectedProfile?.name ?? '';

  const selectedProfileFromList = useMemo(
    () => profiles.find((profile) => profile.name === selectedProfileName) ?? null,
    [profiles, selectedProfileName],
  );

  const loadProfiles = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [allProfiles, defaultProfile] = isMockModeEnabled()
        ? [getMockProfiles(), getMockDefaultProfile()]
        : await Promise.all([
            fetchProfiles().then((items) => items.map(toProfileModel)),
            fetchDefaultProfile().then(toProfileModel),
          ]);

      setProfiles(allProfiles);

      if (!selectedProfile) {
        onProfileChange(defaultProfile);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
      setErrorMessage('Failed to load profiles. You can switch to mock mode in the header.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  useEffect(() => {
    if (!selectedProfile) {
      setWorkText({ workZ: '0', workR: '0' });
      setWorkError({ workZ: null, workR: null });
      setThresholdText('120');
      setThresholdError(null);
      setOptionsText('{}');
      setOptionsError(null);
      return;
    }

    setWorkText({
      workZ: String(selectedProfile.settings.workZ),
      workR: String(selectedProfile.settings.workR),
    });
    setWorkError({ workZ: null, workR: null });
    setThresholdText(String(selectedProfile.settings.threshold));
    setThresholdError(null);
    setOptionsText(JSON.stringify(selectedProfile.settings.options, null, 2));
    setOptionsError(null);
  }, [selectedProfile]);

  const handleProfileSelection = (profileName: string) => {
    const profile = profiles.find((candidate) => candidate.name === profileName);
    if (!profile) return;
    onProfileChange(profile);
  };

  const handleDescriptionChange = (description: string) => {
    if (!selectedProfile) return;
    onProfileChange({ ...selectedProfile, description });
  };

  const handleWorkSettingChange = (key: 'workZ' | 'workR', rawValue: string) => {
    if (!selectedProfile) return;

    setWorkText((previous) => ({ ...previous, [key]: rawValue }));

    const error = getWorkSettingError(rawValue);
    if (error) {
      setWorkError((previous) => ({ ...previous, [key]: error }));
      return;
    }

    setWorkError((previous) => ({ ...previous, [key]: null }));

    const parsed = Number(rawValue);

    onProfileChange({
      ...selectedProfile,
      settings: {
        ...selectedProfile.settings,
        [key]: parsed,
      },
    });
  };

  const handleWorkSettingBlur = (key: 'workZ' | 'workR') => {
    if (!selectedProfile) return;

    const currentText = workText[key].trim();
    const error = getWorkSettingError(currentText);
    if (error) {
      setWorkError((previous) => ({ ...previous, [key]: error }));
      return;
    }

    setWorkError((previous) => ({ ...previous, [key]: null }));
    const parsed = Number(currentText);
    setWorkText((previous) => ({ ...previous, [key]: String(parsed) }));
  };

  const handleThresholdChange = (rawValue: string) => {
    if (!selectedProfile) return;

    setThresholdText(rawValue);

    const error = getThresholdSettingError(rawValue);
    if (error) {
      setThresholdError(error);
      return;
    }

    setThresholdError(null);
    const parsed = Number(rawValue);

    onProfileChange({
      ...selectedProfile,
      settings: {
        ...selectedProfile.settings,
        threshold: parsed,
      },
    });
  };

  const handleThresholdBlur = () => {
    if (!selectedProfile) return;

    const currentText = thresholdText.trim();
    const error = getThresholdSettingError(currentText);
    if (error) {
      setThresholdError(error);
      return;
    }

    const parsed = Number(currentText);
    setThresholdError(null);
    setThresholdText(String(parsed));
  };

  const handleOptionsChange = (rawValue: string) => {
    setOptionsText(rawValue);
    if (!selectedProfile) return;

    try {
      const nextOptions = parseJsonOptions(rawValue);
      setOptionsError(null);
      onProfileChange({
        ...selectedProfile,
        settings: {
          ...selectedProfile.settings,
          options: nextOptions,
        },
      });
    } catch {
      setOptionsError('Options must be valid JSON object syntax.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl mb-1">Profile Setup</h2>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Select a backend profile and adjust local run settings before route detection.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadProfiles();
          }}
          className="px-3 py-2 border border-[var(--md-sys-color-outline)] rounded-lg text-sm flex items-center gap-2"
          title="Reload profile data"
        >
          <RefreshCcw className="w-4 h-4" />
          Reload
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 border border-[var(--md-sys-color-error)] rounded-lg text-sm text-[var(--md-sys-color-error)]">
          {errorMessage}
        </div>
      )}

      <CardSection
        title="Profile Selection"
        description="Profile values are editable locally for this run."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Profile</label>
            <select
              className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm"
              value={selectedProfileName}
              onChange={(event) => handleProfileSelection(event.target.value)}
              disabled={isLoading || profiles.length === 0}
            >
              {profiles.length === 0 ? (
                <option value="">No profiles available</option>
              ) : (
                profiles.map((profile) => (
                  <option key={profile.name} value={profile.name}>
                    {profile.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              Description
            </label>
            <input
              type="text"
              value={selectedProfile?.description ?? selectedProfileFromList?.description ?? ''}
              onChange={(event) => handleDescriptionChange(event.target.value)}
              className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm"
              placeholder="Profile description"
              disabled={!selectedProfile}
            />
          </div>
        </div>
      </CardSection>

      <CardSection
        title="Profile Settings"
        description="Adjust these values before creating a job."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Work Z</label>
            <input
              type="text"
              inputMode="decimal"
              value={workText.workZ}
              onChange={(event) => handleWorkSettingChange('workZ', event.target.value)}
              onBlur={() => handleWorkSettingBlur('workZ')}
              className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm"
              disabled={!selectedProfile}
            />
            {workError.workZ && (
              <p className="text-xs text-[var(--md-sys-color-error)]">Invalid input</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Work R</label>
            <input
              type="text"
              inputMode="decimal"
              value={workText.workR}
              onChange={(event) => handleWorkSettingChange('workR', event.target.value)}
              onBlur={() => handleWorkSettingBlur('workR')}
              className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm"
              disabled={!selectedProfile}
            />
            {workError.workR && (
              <p className="text-xs text-[var(--md-sys-color-error)]">Invalid input</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              Threshold
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={thresholdText}
              onChange={(event) => handleThresholdChange(event.target.value)}
              onBlur={handleThresholdBlur}
              className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm"
              disabled={!selectedProfile}
            />
            {thresholdError && (
              <p className="text-xs text-[var(--md-sys-color-error)]">Invalid input</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Options (JSON)
          </label>
          <textarea
            value={optionsText}
            onChange={(event) => handleOptionsChange(event.target.value)}
            className="w-full min-h-36 px-3 py-2.5 border border-[var(--md-sys-color-outline)] rounded-lg bg-[var(--md-sys-color-surface)] text-sm font-mono"
            disabled={!selectedProfile}
          />
          {optionsError && (
            <p className="text-xs text-[var(--md-sys-color-error)]">{optionsError}</p>
          )}
        </div>
      </CardSection>

      <CalibrationModal isOpen={isCalibrationOpen} onClose={() => setIsCalibrationOpen(false)} />

      <div className="flex items-center justify-between pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
        <button
          onClick={() => setIsCalibrationOpen(true)}
          className="px-4 py-2 text-sm font-medium text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)] rounded-full flex items-center gap-2 hover:bg-[var(--md-sys-color-primary)]/5 transition-colors"
        >
          <Cpu className="w-4 h-4" />
          Calibrate Camera
        </button>
        <button
          onClick={onNext}
          disabled={
            !selectedProfile ||
            Boolean(optionsError) ||
            Boolean(workError.workZ) ||
            Boolean(workError.workR) ||
            Boolean(thresholdError)
          }
          className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full flex items-center gap-2 hover:shadow-lg transition-all text-sm disabled:opacity-60"
        >
          Continue to Camera
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
