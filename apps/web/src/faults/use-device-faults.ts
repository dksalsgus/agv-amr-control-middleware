import { useEffect, useState } from "react";
import { ToastTone } from "../components/use-toasts";
import { faultsApi } from "./faults.api";
import { DeviceFaults, DevicePreset } from "./faults.types";

type Push = (text: string, tone: ToastTone) => void;

/** 지금 켜져 있는(주입된) 빠른 설정인지 */
export const isDevicePresetOn = (
  preset: DevicePreset,
  devices: DeviceFaults,
): boolean =>
  preset.kind === "plc"
    ? devices.plcPointsOn.includes(preset.pointNo)
    : devices.robotErrors.includes(preset.serial);

/** 에뮬레이터 장비 값 주입(PLC 점, 로봇 오류)을 읽고 켜고 끈다. */
export const useDeviceFaults = (push: Push) => {
  const [devices, setDevices] = useState<DeviceFaults | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    faultsApi
      .findDevices()
      .then(setDevices)
      .catch((error: unknown) => console.warn("장비 값 주입 조회 실패", error));
  }, []);

  const toggle = async (preset: DevicePreset) => {
    if (!devices || busy) {
      return;
    }
    const on = !isDevicePresetOn(preset, devices);
    setBusy(true);
    try {
      const next =
        preset.kind === "plc"
          ? await faultsApi.setPlcPoint(preset.pointNo, on)
          : await faultsApi.setRobotError(preset.serial, on);
      setDevices(next);
      push(
        on ? `${preset.label} — 넣었습니다` : `${preset.label} — 풀었습니다`,
        on ? "warn" : "ok",
      );
    } catch (error) {
      console.warn("장비 값 주입 실패", error);
      push(`${preset.label}: 에뮬레이터에 적용하지 못했습니다.`, "danger");
    } finally {
      setBusy(false);
    }
  };

  return { devices, busy, toggle };
};
