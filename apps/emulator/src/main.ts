import { PlcEmulator } from "./plc/plc-emulator";
import { VendorAEmulator } from "./vendor-a/vendor-a-emulator";
import { VendorBEmulator } from "./vendor-b/vendor-b-emulator";
import { VendorCEmulator } from "./vendor-c/vendor-c-emulator";

const main = async () => {
  await Promise.all([
    new VendorAEmulator().start(),
    new VendorBEmulator().start(),
    new VendorCEmulator().start(),
    new PlcEmulator().start(),
  ]);
};

// CommonJS라 top-level await를 쓸 수 없다.
void main();
