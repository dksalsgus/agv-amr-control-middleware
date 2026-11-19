import { Icon } from "../components/icon";
import { DEVICE_PRESETS } from "./faults.constants";
import { DeviceFaults, DevicePreset } from "./faults.types";
import { isDevicePresetOn } from "./use-device-faults";

type Props = {
  devices: DeviceFaults | null;
  busy: boolean;
  onToggle: (preset: DevicePreset) => void;
};

/** PLC 값·로봇 오류 빠른 설정. 그룹 빠른 설정과 같은 버튼 모양을 쓴다. */
export const DevicePresets = ({ devices, busy, onToggle }: Props) => (
  <div className="presets" role="group" aria-labelledby="deviceTitle">
    {DEVICE_PRESETS.map((preset) => (
      <button
        key={preset.label}
        type="button"
        className="preset"
        aria-pressed={devices ? isDevicePresetOn(preset, devices) : false}
        disabled={!devices || busy}
        onClick={() => onToggle(preset)}
      >
        <Icon name="bolt" />
        {preset.label}
        <span className="tag">{preset.tag}</span>
      </button>
    ))}
  </div>
);
