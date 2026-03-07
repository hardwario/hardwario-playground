"use strict";

const { execFile } = require("child_process");

function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      {
        windowsHide: true,
        maxBuffer: 4 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr || error.message));
        }

        resolve(stdout.trim());
      }
    );
  });
}

async function getWindowsPortsMetadata() {
  if (process.platform !== "win32") {
    return [];
  }

  const script = `
    $devices = Get-PnpDevice -PresentOnly -Class Ports | ForEach-Object {
      $parent = Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName 'DEVPKEY_Device_Parent' -ErrorAction SilentlyContinue

      [PSCustomObject]@{
        InstanceId   = $_.InstanceId
        FriendlyName = $_.FriendlyName
        ParentId     = if ($parent) { $parent.Data } else { $null }
      }
    }

    $devices | ConvertTo-Json -Compress
  `;

  try {
    const raw = await runPowerShell(script);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

async function enrichPortsWithParent(ports) {
  if (process.platform !== "win32" || !Array.isArray(ports) || ports.length === 0) {
    return ports;
  }

  const metadata = await getWindowsPortsMetadata();

  return ports.map((port) => {
    const byPnpId =
      port.pnpId
        ? metadata.find((item) => item.InstanceId === port.pnpId)
        : undefined;

    const byComName = metadata.find(
      (item) =>
        item.FriendlyName &&
        item.FriendlyName.includes(`(${port.path})`)
    );

    const match = byPnpId || byComName;

    return {
      ...port,
      pnpId: port.pnpId || match?.InstanceId,
      parentId: match?.ParentId || undefined,
    };
  });
}

module.exports = {
  enrichPortsWithParent,
};
