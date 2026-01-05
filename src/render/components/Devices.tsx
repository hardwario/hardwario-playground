import Gateway from './Gateway';
import RadioManager from './RadioManager';
import type { useRadioManager } from '../hooks/useRadioManager';

interface DevicesProps {
  radioManager: ReturnType<typeof useRadioManager>;
}

export default function Devices({ radioManager }: DevicesProps) {
  return (
    <div id="devices">
      <Gateway />
      <RadioManager radioManager={radioManager} />
    </div>
  );
}
