import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Select from 'react-select';
import {
  FiAlertCircle, FiCheckCircle, FiCpu, FiDownload, FiFolder,
  FiExternalLink, FiPlay, FiBook, FiGithub, FiInfo, FiRefreshCw
} from 'react-icons/fi';
import type {
  SerialPortInfo,
  FlashProgress,
  DownloadProgress,
  FirmwareItem,
  FileDialogResult,
} from '../../../electron/preload';
import * as i18n from '../../utils/i18n';

// YouTube URL helpers
const youtubeUrlRegex = /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

function isYoutubeUrl(url: string): boolean {
  return !!String(url).match(youtubeUrlRegex);
}

function getYoutubeVideoUrl(url: string): string | null {
  const match = youtubeUrlRegex.exec(url);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

interface FirmwareOption {
  name: string;
  description?: string;
  article?: string;
  video?: string;
  repository?: string;
  images?: Array<{ url: string; title: string }>;
  articles?: Array<{
    title: string;
    description: string;
    url: string;
    video?: string;
    images?: Array<{ url: string; title: string }>;
  }>;
  versions?: Array<{ name: string; url?: string }>;
  tags?: string[];
}

interface VersionOption {
  name: string;
  url?: string;
}

// Progress bar component
function ProgressBar({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: 'red' | 'yellow' | 'green' | 'blue';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const colorClasses = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  };

  const bgClasses = {
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
  };

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center gap-2 w-24">
        <Icon className={`w-4 h-4 ${value > 0 ? 'text-gray-700' : 'text-gray-400'}`} />
        <span className={`text-sm font-medium ${value > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
          {label}
        </span>
      </div>
      <div className={`flex-1 h-3 rounded-full ${bgClasses[color]} overflow-hidden`}>
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-sm w-12 text-right ${value > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
        {value}%
      </span>
    </div>
  );
}

export default function Firmware() {
  const { fw } = useParams<{ fw?: string }>();

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
    console.log('firmware:componentDidMount');

    const unsubProgress = window.electronAPI.firmware.onProgress((payload: FlashProgress) => {
      console.log('ipcProgressUpdate', payload);
      setProgress(payload);
    });

    const unsubPortList = window.electronAPI.firmware.onPortList((newPorts: SerialPortInfo[]) => {
      console.log('ipcPortsUpdate', newPorts);
      setPorts(newPorts);

      if (port === '' && newPorts.length > 0) {
        setPort(newPorts[0].path);
      }

      // Poll for port updates when not running
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

      // Check if firmware was passed via URL param
      if (fw) {
        const decodedFw = decodeURIComponent(fw);
        console.log('Firmware from URL:', decodedFw);
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

    // Request initial data
    window.electronAPI.firmware.getPortList();
    window.electronAPI.firmware.getList();

    return () => {
      console.log('firmware:componentWillUnmount');
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
  }, [fw, port, isRun]);

  const handleFlash = useCallback(() => {
    if (isRun || !firmware?.name) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const params = {
      firmware: firmware.name,
      port,
      version: version?.name,
    };

    setProgress({ erase: 0, write: 0, verify: 0 });
    setError(null);
    setDone(false);
    setIsRun(true);
    setDownload(0);

    window.electronAPI.firmware.runFlash(params);
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

  const handleFirmwareChange = useCallback((selected: FirmwareOption | null) => {
    setFirmware(selected);
    setVersion({ name: 'latest' });
  }, []);

  const openExternal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.electronAPI.shell.openExternal(e.currentTarget.href);
  };

  // Filter firmware list
  const filteredList = showAll
    ? [...list, custom]
    : [...list.filter((item) => item.tags?.includes('playground')), custom];

  // Version options
  const versionOptions: VersionOption[] = firmware?.versions
    ? [{ name: 'latest' }, ...firmware.versions]
    : [];

  // Custom styles for react-select
  const selectStyles = {
    control: (base: object) => ({
      ...base,
      borderColor: '#d1d5db',
      boxShadow: 'none',
      '&:hover': { borderColor: '#9ca3af' },
    }),
    option: (base: object, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected ? '#e63946' : state.isFocused ? '#fee2e2' : 'white',
      color: state.isSelected ? 'white' : '#374151',
    }),
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{i18n.__('Firmware Flasher')}</h1>
          <p className="text-gray-500 mt-1">{i18n.__('Flash firmware to your HARDWARIO devices')}</p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 shadow-sm mb-6">
          {/* Firmware Selection Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">{i18n.__('Select Firmware')}</h2>
          </div>

          <div className="p-4">
            {/* Firmware Selection Row */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{i18n.__('Firmware')}</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select<FirmwareOption>
                      styles={selectStyles}
                      getOptionLabel={(option) => option.name || ''}
                      getOptionValue={(option) => option.name || ''}
                      options={filteredList.filter((f) => f.name)}
                      placeholder={i18n.__('Choose firmware...')}
                      isSearchable
                      onChange={handleFirmwareChange}
                      value={firmware}
                      noOptionsMessage={() => i18n.__("No results found - try 'Show All' option")}
                    />
                  </div>
                  <button
                    onClick={handleOpenDialog}
                    className="px-3 py-1.5 text-xs font-semibold uppercase bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-1.5 transition-all"
                    title={i18n.__('Browse for firmware file')}
                  >
                    <FiFolder className="w-3.5 h-3.5" />
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

              <div className="w-36">
                <label className="block text-sm font-medium text-gray-700 mb-1">{i18n.__('Version')}</label>
                <Select<VersionOption>
                  styles={selectStyles}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.name}
                  placeholder={i18n.__('Version')}
                  options={versionOptions}
                  value={version}
                  onChange={(v) => setVersion(v)}
                  isDisabled={!firmware}
                  isClearable={false}
                />
              </div>
            </div>

            {/* Device Selection and Flash */}
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">{i18n.__('Target Device')}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-hardwario-primary focus:border-transparent mb-3"
                  disabled={isRun}
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                >
                  {ports.length === 0 && <option>{i18n.__('(no device available)')}</option>}
                  {ports.map((p, index) => (
                    <option value={p.path} key={index}>
                      {p.path}
                      {p.serialNumber ? ` (${p.serialNumber})` : ''}
                    </option>
                  ))}
                </select>

                <button
                  className={`
                    w-full px-3 py-1.5 text-xs font-semibold uppercase rounded flex items-center justify-center gap-1.5 transition-all
                    ${isRun
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  disabled={ports.length === 0 || isRun || !firmware}
                  onClick={handleFlash}
                >
                  {isRun ? (
                    <>
                      <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {i18n.__('Flashing...')}
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-3.5 h-3.5" />
                      {i18n.__('Flash Firmware')}
                    </>
                  )}
                </button>
              </div>

              {/* Progress Section */}
              <div className="flex-1 bg-gray-50 rounded p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{i18n.__('Flash Progress')}</h3>
                {download > 0 && (
                  <ProgressBar label={i18n.__('Download')} value={download} color="blue" icon={FiDownload} />
                )}
                <ProgressBar label={i18n.__('Erase')} value={progress.erase} color="red" icon={FiCpu} />
                <ProgressBar label={i18n.__('Write')} value={progress.write} color="yellow" icon={FiDownload} />
                <ProgressBar label={i18n.__('Verify')} value={progress.verify} color="green" icon={FiCheckCircle} />
              </div>
            </div>

            {/* Status Alerts */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">{i18n.__('Flash Failed')}</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {done && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded flex items-start gap-3">
                <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">{i18n.__('Flash Complete')}</h4>
                  <p className="text-sm text-green-600 mt-1">{i18n.__('Firmware has been successfully flashed to your device.')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Firmware Details Card */}
        {firmware && (firmware.description || firmware.article || firmware.video || firmware.repository || firmware.images) && (
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <FiInfo className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-800">{i18n.__('Firmware Details')}</h2>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Info */}
                <div className="space-y-4">
                  {firmware.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">{i18n.__('Description')}</h3>
                      <p className="text-gray-700">{firmware.description}</p>
                    </div>
                  )}

                  {firmware.article && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">{i18n.__('Documentation')}</h3>
                      <a
                        href={firmware.article}
                        onClick={openExternal}
                        className="inline-flex items-center gap-2 text-hardwario-primary hover:underline"
                      >
                        <FiBook className="w-4 h-4" />
                        {i18n.__('View Article')}
                        <FiExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {firmware.video && !isYoutubeUrl(firmware.video) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">{i18n.__('Video Tutorial')}</h3>
                      <a
                        href={firmware.video}
                        onClick={openExternal}
                        className="inline-flex items-center gap-2 text-hardwario-primary hover:underline"
                      >
                        <FiPlay className="w-4 h-4" />
                        {i18n.__('Watch Video')}
                        <FiExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {firmware.repository && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">{i18n.__('Source Code')}</h3>
                      <a
                        href={firmware.repository}
                        onClick={openExternal}
                        className="inline-flex items-center gap-2 text-hardwario-primary hover:underline"
                      >
                        <FiGithub className="w-4 h-4" />
                        {i18n.__('View Repository')}
                        <FiExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Column - Media */}
                <div>
                  {firmware.images && firmware.images.length > 0 && (
                    <img
                      src={firmware.images[0].url}
                      alt={firmware.images[0].title}
                      className="w-full h-auto rounded border border-gray-200"
                    />
                  )}

                  {firmware.video && isYoutubeUrl(firmware.video) && (
                    <div className="aspect-video rounded overflow-hidden border border-gray-200">
                      <iframe
                        src={getYoutubeVideoUrl(firmware.video) || ''}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="encrypted-media"
                        allowFullScreen
                        title="Firmware Video"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Articles Section */}
              {firmware.articles && firmware.articles.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">{i18n.__('Related Articles')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {firmware.articles.map((article, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-3 bg-gray-50 rounded border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        {article.video && isYoutubeUrl(article.video) ? (
                          <div className="w-32 aspect-video flex-shrink-0 rounded overflow-hidden">
                            <iframe
                              src={getYoutubeVideoUrl(article.video) || ''}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="encrypted-media"
                              allowFullScreen
                              title={article.title}
                            />
                          </div>
                        ) : article.video ? (
                          <video
                            src={article.video}
                            controls
                            preload="metadata"
                            className="w-32 flex-shrink-0 rounded"
                          />
                        ) : article.images && article.images.length > 0 ? (
                          <img
                            src={article.images[0].url}
                            alt={article.images[0].title}
                            className="w-32 h-auto flex-shrink-0 rounded object-cover"
                          />
                        ) : null}

                        <div className="min-w-0 flex-1">
                          <a
                            href={article.url}
                            onClick={openExternal}
                            className="font-medium text-gray-900 hover:text-hardwario-primary line-clamp-2"
                          >
                            {article.title}
                          </a>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State when no firmware selected */}
        {!firmware && (
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="py-12 px-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <FiCpu className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{i18n.__('Select Firmware to Flash')}</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {i18n.__('Choose a firmware from the dropdown above or browse for a local firmware file to flash to your device.')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
