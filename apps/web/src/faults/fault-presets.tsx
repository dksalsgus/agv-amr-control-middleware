import { Icon } from "../components/icon";
import { PRESETS } from "./faults.constants";
import { FaultGroup, GroupState, Preset } from "./faults.types";
import { presetActive } from "./fault-draft.util";

type Props = {
  groups: Record<FaultGroup, GroupState> | null;
  onToggle: (preset: Preset) => void;
};

export const FaultPresets = ({ groups, onToggle }: Props) => (
  <div className="presets" role="group" aria-labelledby="presetTitle">
    {PRESETS.map((preset) => {
      const state = groups?.[preset.group];
      return (
        <button
          key={preset.label}
          type="button"
          className="preset"
          aria-pressed={state ? presetActive(preset, state.applied) : false}
          disabled={!state || state.phase === "applying"}
          onClick={() => onToggle(preset)}
        >
          <Icon name="bolt" />
          {preset.label}
          <span className="tag">{preset.group}</span>
        </button>
      );
    })}
  </div>
);
