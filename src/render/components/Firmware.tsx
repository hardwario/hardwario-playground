import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Select from 'react-select';
import {
  FiAlertCircle, FiCheckCircle, FiCpu, FiDownload, FiFolder,
  FiRefreshCw, FiCheck, FiChevronRight
} from 'react-icons/fi';
import type {
  SerialPortInfo,
  FlashProgress,
  DownloadProgress,
  FirmwareItem,
  FileDialogResult,
} from '../../../electron/preload';
import * as i18n from '../../utils/i18n';

interface FirmwareOption {
  name: string;
  description?: string;
  versions?: Array<{ name: string; url?: string }>;
  tags?: string[];
}

interface VersionOption {
  name: string;
  url?: string;
}

type Step = 'setup' | 'flash';

// Step indicator component
function StepIndicator({ currentStep, done }: { currentStep: Step; done: boolean }) {
  const steps = [
    { key: 'setup' as Step, label: i18n.__('Setup'), number: 1 },
    { key: 'flash' as Step, label: i18n.__('Flash'), number: 2 },
  ];

  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      {steps.map((step, index) => {
        const isActive = currentStep === step.key;
        const isCompleted = (step.key === 'setup' && currentStep === 'flash') || (step.key === 'flash' && done);

        return (
          <div key={step.key} className="flex items-center">
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${isActive ? 'bg-hardwario-primary text-white' : ''}
              ${isCompleted ? 'bg-green-100 text-green-700' : ''}
              ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400' : ''}
            `}>
              {isCompleted ? (
                <FiCheck className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {step.number}
                </span>
              )}
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <FiChevronRight className={`w-5 h-5 mx-2 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Combined progress bar
function FlashProgressBar({ download, progress }: { download: number; progress: FlashProgress }) {
  const hasDownload = download > 0;

  let currentProgress = 0;
  let currentPhase = '';

  if (hasDownload) {
    if (download < 100) {
      currentProgress = (download / 100) * 25;
      currentPhase = i18n.__('Downloading...');
    } else if (progress.erase < 100) {
      currentProgress = 25 + (progress.erase / 100) * 25;
      currentPhase = i18n.__('Erasing...');
    } else if (progress.write < 100) {
      currentProgress = 50 + (progress.write / 100) * 25;
      currentPhase = i18n.__('Writing...');
    } else {
      currentProgress = 75 + (progress.verify / 100) * 25;
      currentPhase = i18n.__('Verifying...');
    }
  } else {
    if (progress.erase < 100) {
      currentProgress = (progress.erase / 100) * 33;
      currentPhase = i18n.__('Erasing...');
    } else if (progress.write < 100) {
      currentProgress = 33 + (progress.write / 100) * 34;
      currentPhase = i18n.__('Writing...');
    } else {
      currentProgress = 67 + (progress.verify / 100) * 33;
      currentPhase = i18n.__('Verifying...');
    }
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 font-medium">{currentPhase}</span>
        <span className="text-gray-500">{Math.round(currentProgress)}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-hardwario-primary rounded-full transition-all duration-300"
          style={{ width: `${currentProgress}%` }}
        />
      </div>
    </div>
  );
}

export default function Firmware() {
  const { fw } = useParams<{ fw?: string }>();

  const [step, setStep] = useState<Step>('setup');
  const [port, setPort] = useState('');
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [progress, setProgress] = useState<FlashProgress>({ erase: 0, write: 0, verify: 0 });
  const [download, setDownload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isRun, setIsRun] = useState(false);
  const [list, setList] = useState<FirmwareItem[]>([]);
  const [firmware, setFirmware] = useState<FirmwareOption | null>(null);
  const [version, setVersion] = useState<VersionOption | null>({ name: 'latest' });
  const [custom, setCustom] = useState<FirmwareOption>({ name: '' });
  const [showAll, setShowAll] = useState(() =>
    window.electronAPI.settings.getSync('firmware-show-all') as boolean || false
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubProgress = window.electronAPI.firmware.onProgress((payload: FlashProgress) => {
      setProgress(payload);
    });

    const unsubPortList = window.electronAPI.firmware.onPortList((newPorts: SerialPortInfo[]) => {
      console.log('Firmware: ports detected', newPorts);
      setPorts(newPorts);
      // Use functional update to avoid stale closure
      setPort(currentPort => {
        if (newPorts.length === 0) return '';
        // If no port selected or current port no longer exists, select first available
        if (currentPort === '' || !newPorts.find(p => p.path === currentPort)) {
          return newPorts[0].path;
        }
        return currentPort;
      });
      timerRef.current = setTimeout(() => {
        if (!isRun) {
          window.electronAPI.firmware.getPortList();
        }
      }, 1000);
    });

    const unsubError = window.electronAPI.firmware.onError((err: string) => {
      setError(err);
      setIsRun(false);
      window.electronAPI.firmware.getPortList();
    });

    const unsubDone = window.electronAPI.firmware.onDone(() => {
      setDone(true);
      setIsRun(false);
      window.electronAPI.firmware.getPortList();
    });

    const unsubList = window.electronAPI.firmware.onList((newList: FirmwareItem[]) => {
      setList(newList);
      if (fw) {
        const decodedFw = decodeURIComponent(fw);
        setCustom({ name: decodedFw });
        setFirmware({ name: decodedFw });
      }
    });

    const unsubDownload = window.electronAPI.firmware.onDownload((payload: DownloadProgress) => {
      setDownload(payload.percent);
    });

    const unsubFileDialog = window.electronAPI.firmware.onFileDialogResult((result: FileDialogResult) => {
      if (result.filePath) {
        setCustom({ name: result.filePath });
        setFirmware({ name: result.filePath });
      }
    });

    window.electronAPI.firmware.getPortList();
    window.electronAPI.firmware.getList();

    return () => {
      unsubProgress();
      unsubPortList();
      unsubError();
      unsubDone();
      unsubList();
      unsubDownload();
      unsubFileDialog();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [fw, isRun]);

  const handleFlash = useCallback(() => {
    if (isRun || !firmware?.name) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setProgress({ erase: 0, write: 0, verify: 0 });
    setError(null);
    setDone(false);
    setIsRun(true);
    setDownload(0);
    setStep('flash');

    window.electronAPI.firmware.runFlash({
      firmware: firmware.name,
      port,
      version: version?.name,
    });
  }, [isRun, firmware, port, version]);

  const handleOpenDialog = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.electronAPI.firmware.openFileDialog();
  }, []);

  const handleShowAllToggle = useCallback(() => {
    const newValue = !showAll;
    setShowAll(newValue);
    window.electronAPI.settings.set('firmware-show-all', newValue);
  }, [showAll]);

  const handleFirmwareSelect = useCallback((selected: FirmwareOption | null) => {
    setFirmware(selected);
    setVersion({ name: 'latest' });
  }, []);

  const handleReset = useCallback(() => {
    setStep('setup');
    setFirmware(null);
    setError(null);
    setDone(false);
    setProgress({ erase: 0, write: 0, verify: 0 });
    setDownload(0);
  }, []);

  const filteredList = showAll
    ? [...list, custom]
    : [...list.filter((item) => item.tags?.includes('playground')), custom];

  const versionOptions: VersionOption[] = firmware?.versions
    ? [{ name: 'latest' }, ...firmware.versions]
    : [];

  const canFlash = firmware && ports.length > 0;

  const selectStyles = {
    control: (base: object) => ({
      ...base,
      borderColor: '#d1d5db',
      boxShadow: 'none',
      minHeight: '48px',
      '&:hover': { borderColor: '#9ca3af' },
    }),
    option: (base: object, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected ? '#1f2937' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      padding: '12px 16px',
    }),
    menuPortal: (base: object) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-4 pb-4">
        <StepIndicator currentStep={step} done={done} />

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-hardwario-primary/10 mb-4">
                <FiDownload className="w-8 h-8 text-hardwario-primary" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{i18n.__('Flash Firmware')}</h2>
              <p className="text-gray-500 mt-1">{i18n.__('Select firmware and connect your device')}</p>
            </div>

            <div className="space-y-5">
              {/* Firmware */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{i18n.__('Firmware')}</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select<FirmwareOption>
                      styles={selectStyles}
                      getOptionLabel={(option) => option.name || ''}
                      getOptionValue={(option) => option.name || ''}
                      options={filteredList.filter((f) => f.name)}
                      placeholder={i18n.__('Choose firmware...')}
                      isSearchable
                      onChange={handleFirmwareSelect}
                      value={firmware}
                      noOptionsMessage={() => i18n.__("No results found - try 'Show All' option")}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                  <button
                    onClick={handleOpenDialog}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                    title={i18n.__('Browse for file')}
                  >
                    <FiFolder className="w-5 h-5" />
                  </button>
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAll}
                    onChange={handleShowAllToggle}
                    className="rounded border-gray-300 text-hardwario-primary focus:ring-hardwario-primary"
                  />
                  <span className="text-sm text-gray-600">{i18n.__('Show all firmware')}</span>
                </label>
              </div>

              {/* Version */}
              {firmware && firmware.versions && firmware.versions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{i18n.__('Version')}</label>
                  <Select<VersionOption>
                    styles={selectStyles}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.name}
                    options={versionOptions}
                    value={version}
                    onChange={(v) => setVersion(v)}
                    isClearable={false}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              )}

              {/* Device */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{i18n.__('Device')}</label>
                {ports.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <FiAlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">{i18n.__('No device connected')}</p>
                      <p className="text-xs text-amber-600 mt-0.5">{i18n.__('Connect your HARDWARIO device via USB cable')}</p>
                    </div>
                    <FiRefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  </div>
                ) : (
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-hardwario-primary focus:border-transparent"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  >
                    {ports.map((p, index) => (
                      <option value={p.path} key={index}>
                        {p.path}{p.serialNumber ? ` (${p.serialNumber})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Summary before flash */}
              {firmware && ports.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{i18n.__('Ready to flash')}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">{i18n.__('Firmware')}:</span>
                      <span className="font-medium text-gray-900 text-right break-all">{firmware.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{i18n.__('Version')}:</span>
                      <span className="font-medium text-gray-900">
                        {version?.name === 'latest' && firmware.versions && firmware.versions.length > 0
                          ? firmware.versions[0].name
                          : version?.name || (firmware.versions?.[0]?.name || 'latest')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{i18n.__('Device')}:</span>
                      <span className="font-medium text-gray-900">{port}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Flash */}
        {step === 'flash' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {/* Progress */}
            {isRun && !done && !error && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-hardwario-primary/10 mb-4">
                  <FiRefreshCw className="w-10 h-10 text-hardwario-primary animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{i18n.__('Flashing...')}</h2>
                <p className="text-gray-500">{i18n.__('Do not disconnect your device')}</p>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">{firmware?.name}</span>
                  <span className="text-gray-400 mx-1">
                    v{version?.name === 'latest' && firmware?.versions?.[0]?.name
                      ? firmware.versions[0].name
                      : version?.name || firmware?.versions?.[0]?.name || 'latest'}
                  </span>
                  <span className="mx-2">→</span>
                  <span>{port}</span>
                </div>
                <FlashProgressBar download={download} progress={progress} />
              </div>
            )}

            {/* Success */}
            {done && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                  <FiCheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{i18n.__('Flash Complete!')}</h2>
                <p className="text-gray-500 mb-6">{i18n.__('Your device has been successfully updated')}</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-hardwario-primary text-white font-semibold uppercase rounded-lg hover:bg-hardwario-medium transition-all"
                >
                  {i18n.__('Flash Another')}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                  <FiAlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{i18n.__('Flash Failed')}</h2>
                <p className="text-red-600 mb-6 text-sm">{error}</p>
                <div className="space-y-2">
                  <button
                    onClick={handleFlash}
                    className="w-full px-6 py-3 bg-hardwario-primary text-white font-semibold uppercase rounded-lg hover:bg-hardwario-medium transition-all"
                  >
                    {i18n.__('Try Again')}
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all text-sm uppercase"
                  >
                    {i18n.__('Start Over')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Footer with Flash Button - only in setup step */}
      {step === 'setup' && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleFlash}
            disabled={!canFlash}
            className="w-full px-4 py-4 bg-hardwario-primary text-white font-semibold uppercase rounded-lg hover:bg-hardwario-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            <FiCpu className="w-5 h-5" />
            {i18n.__('Start Flashing')}
          </button>
        </div>
      )}
    </div>
  );
}
