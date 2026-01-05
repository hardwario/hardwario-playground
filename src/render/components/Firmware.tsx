import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Select from 'react-select';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import type {
  SerialPortInfo,
  FlashProgress,
  DownloadProgress,
  FirmwareItem,
  FileDialogResult,
} from '../../../electron/preload';

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
}: {
  label: string;
  value: number;
  color: 'danger' | 'warning' | 'success' | 'primary';
}) {
  const colorClasses = {
    danger: 'progress-bar-danger',
    warning: 'progress-bar-warning',
    success: 'progress-bar-success',
    primary: 'progress-bar-primary',
  };

  return (
    <div className="flex items-center mb-2">
      <label className="w-20 text-sm">{label}</label>
      <div className="flex-1 progress">
        <div
          className={colorClasses[color]}
          style={{ width: `${value}%` }}
        />
      </div>
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

  return (
    <div id="firmware" className="p-4">
      {/* Firmware Selection */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <label className="form-label">Firmware</label>
          <div className="pr-24">
            <Select<FirmwareOption>
              className="react-select-container"
              classNamePrefix="react-select"
              getOptionLabel={(option) => option.name || ''}
              getOptionValue={(option) => option.name || ''}
              options={filteredList.filter((f) => f.name)}
              placeholder="Choose firmware ..."
              isSearchable
              onChange={handleFirmwareChange}
              value={firmware}
              noOptionsMessage={() => "No results found - try to check 'Show All' option"}
            />
          </div>

          <div className="absolute right-20 top-9 flex items-center gap-1 z-10">
            <input
              type="checkbox"
              checked={showAll}
              onChange={handleShowAllToggle}
              id="showAllInput"
              className="cursor-pointer"
            />
            <label htmlFor="showAllInput" className="cursor-pointer text-sm">
              Show all
            </label>
          </div>

          <button
            onClick={handleOpenDialog}
            className="absolute right-0 top-8 px-3 py-2 bg-gray-200 hover:bg-gray-300 z-10"
          >
            ...
          </button>
        </div>

        <div className="w-32">
          <label className="form-label">Version</label>
          <Select<VersionOption>
            className="react-select-container"
            classNamePrefix="react-select"
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => option.name}
            placeholder="Version..."
            options={versionOptions}
            value={version}
            onChange={(v) => setVersion(v)}
            isDisabled={!firmware}
            isClearable={false}
          />
        </div>
      </div>

      {/* Device and Progress */}
      <div className="flex gap-4 mb-4">
        <div className="w-64">
          <label className="form-label">Device</label>
          <select
            className="form-control mb-2"
            disabled={isRun}
            value={port}
            onChange={(e) => setPort(e.target.value)}
          >
            {ports.length === 0 && <option>(no device available)</option>}
            {ports.map((p, index) => (
              <option value={p.path} key={index}>
                {p.path}
                {p.serialNumber ? ` ${p.serialNumber}` : ''}
              </option>
            ))}
          </select>

          <button
            className="btn-danger w-full"
            disabled={ports.length === 0 || isRun || !firmware}
            onClick={handleFlash}
          >
            Flash firmware
          </button>
        </div>

        <div className="flex-1">
          {download > 0 && (
            <ProgressBar label="Download" value={download} color="primary" />
          )}
          <ProgressBar label="Erase" value={progress.erase} color="danger" />
          <ProgressBar label="Write" value={progress.write} color="warning" />
          <ProgressBar label="Verify" value={progress.verify} color="success" />
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="alert-danger mb-4">
          <FiAlertCircle className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {done && (
        <div className="alert-success mb-4">
          <FiCheckCircle className="flex-shrink-0" />
          <span>Done</span>
        </div>
      )}

      {/* Firmware Details */}
      {firmware && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            {firmware.description && (
              <div className="mb-4">
                <label className="form-label">Description</label>
                <p className="text-gray-700">{firmware.description}</p>
              </div>
            )}

            {firmware.article && (
              <div className="mb-4">
                <label className="form-label">Article</label>
                <p>
                  <a
                    href={firmware.article}
                    onClick={openExternal}
                    className="text-hardwario-primary hover:underline"
                  >
                    {firmware.article}
                  </a>
                </p>
              </div>
            )}

            {firmware.video && (
              <div className="mb-4">
                <label className="form-label">Video</label>
                <p>
                  <a
                    href={firmware.video}
                    onClick={openExternal}
                    className="text-hardwario-primary hover:underline"
                  >
                    {firmware.video}
                  </a>
                </p>
              </div>
            )}

            {firmware.repository && (
              <div className="mb-4">
                <label className="form-label">Repository</label>
                <p>
                  <a
                    href={firmware.repository}
                    onClick={openExternal}
                    className="text-hardwario-primary hover:underline"
                  >
                    {firmware.repository}
                  </a>
                </p>
              </div>
            )}
          </div>

          <div>
            {firmware.images && firmware.images.length > 0 && (
              <img
                src={firmware.images[0].url}
                alt={firmware.images[0].title}
                className="max-w-full h-auto mb-4"
              />
            )}

            {firmware.video && isYoutubeUrl(firmware.video) && (
              <iframe
                src={getYoutubeVideoUrl(firmware.video) || ''}
                className="w-full aspect-video"
                frameBorder="0"
                allow="encrypted-media"
                allowFullScreen
                title="Firmware Video"
              />
            )}
          </div>

          {/* Articles */}
          {firmware.articles && firmware.articles.length > 0 && (
            <div className="col-span-2">
              <label className="form-label">Articles</label>
              <ul className="space-y-4">
                {firmware.articles.map((article, index) => (
                  <li key={index} className="flex gap-4">
                    {article.video && isYoutubeUrl(article.video) ? (
                      <iframe
                        src={getYoutubeVideoUrl(article.video) || ''}
                        className="w-48 aspect-video flex-shrink-0"
                        frameBorder="0"
                        allow="encrypted-media"
                        allowFullScreen
                        title={article.title}
                      />
                    ) : article.video ? (
                      <video
                        src={article.video}
                        controls
                        preload="metadata"
                        className="w-48 flex-shrink-0"
                      />
                    ) : article.images && article.images.length > 0 ? (
                      <img
                        src={article.images[0].url}
                        alt={article.images[0].title}
                        className="w-48 h-auto flex-shrink-0"
                      />
                    ) : null}

                    <div>
                      <h5 className="font-semibold mb-1">
                        <a
                          href={article.url}
                          onClick={openExternal}
                          className="text-hardwario-primary hover:underline"
                        >
                          {article.title}
                        </a>
                      </h5>
                      <p className="text-gray-600">{article.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
