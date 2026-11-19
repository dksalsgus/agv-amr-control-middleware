import { FAULT_PORT } from "./config";
import { FaultServer } from "./faults/fault-server";
import { FaultSettings } from "./faults/fault-settings";
import { PlcEmulator } from "./plc/plc-emulator";
import { VendorAEmulator } from "./vendor-a/vendor-a-emulator";
import { VendorBEmulator } from "./vendor-b/vendor-b-emulator";
import { VendorCEmulator } from "./vendor-c/vendor-c-emulator";

const main = async () => {
  const faults = new FaultSettings();
  new FaultServer(FAULT_PORT, faults).listen();

  await Promise.all([
    new VendorAEmulator().start(),
    new VendorBEmulator().start(),
    new VendorCEmulator().start(),
    new PlcEmulator().start(),
  ]);
};

void main();
