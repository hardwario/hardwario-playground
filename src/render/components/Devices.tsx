import Gateway from './Gateway';
import RadioManager from './RadioManager';
import type { useRadioManager } from '../hooks/useRadioManager';

interface DevicesProps {
  radioManager: ReturnType<typeof useRadioManager>;
}

export default function Devices({ radioManager }: DevicesProps) {
  return (
    <div className="h-full overflow-auto">
      <div className="p-4 max-w-4xl mx-auto">
        <Gateway />
        <RadioManager radioManager={radioManager} />
      </div>
    </div>
  );
}
