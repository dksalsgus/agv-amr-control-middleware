import { runEvery } from "./common/utils/delay.util";
import {
  MQTT_URL,
  PLC_PORT,
  PLC_STEP_INTERVAL_MS,
  VENDOR_A_PUBLISH_INTERVAL_MS,
  VENDOR_A_ROBOT_COUNT,
  VENDOR_B_PORT,
  VENDOR_B_ROBOT_COUNT,
  VENDOR_B_STEP_INTERVAL_MS,
  VENDOR_C_PORT,
  VENDOR_C_ROBOT_COUNT,
  VENDOR_C_STEP_INTERVAL_MS,
} from "./config";
import { PlcServer } from "./plc/plc-server";
import { PlcSimulator } from "./plc/plc-simulator";
import { RobotFleet } from "./simulation/robot-fleet";
import { VendorAPublisher } from "./vendor-a/vendor-a-publisher";
import { VendorBServer } from "./vendor-b/vendor-b-server";
import { VendorCServer } from "./vendor-c/vendor-c-server";

const startVendorA = async () => {
  const fleet = new RobotFleet("A", VENDOR_A_ROBOT_COUNT);
  const publisher = new VendorAPublisher(MQTT_URL, fleet);
  publisher.connect();

  const dtSec = VENDOR_A_PUBLISH_INTERVAL_MS / 1000;
  await runEvery(VENDOR_A_PUBLISH_INTERVAL_MS, async () => {
    fleet.step(dtSec);
    await publisher.publishAll();
  });
};

const startVendorB = async () => {
  const fleet = new RobotFleet("B", VENDOR_B_ROBOT_COUNT);
  const server = new VendorBServer(VENDOR_B_PORT, fleet);
  server.listen();

  const dtSec = VENDOR_B_STEP_INTERVAL_MS / 1000;
  await runEvery(VENDOR_B_STEP_INTERVAL_MS, async () => {
    fleet.step(dtSec);
  });
};

const startVendorC = async () => {
  const fleet = new RobotFleet("C", VENDOR_C_ROBOT_COUNT);
  const server = new VendorCServer(VENDOR_C_PORT, fleet);
  server.refresh();
  server.listen();

  const dtSec = VENDOR_C_STEP_INTERVAL_MS / 1000;
  await runEvery(VENDOR_C_STEP_INTERVAL_MS, async () => {
    fleet.step(dtSec);
    server.refresh();
  });
};

const startPlc = async () => {
  const plc = new PlcSimulator();
  const server = new PlcServer(PLC_PORT, plc);
  server.refresh(new Date());
  server.listen();

  await runEvery(PLC_STEP_INTERVAL_MS, async () => {
    plc.step();
    server.refresh(new Date());
  });
};

const main = async () => {
  await Promise.all([
    startVendorA(),
    startVendorB(),
    startVendorC(),
    startPlc(),
  ]);
};

// CommonJS라 top-level await를 쓸 수 없다.
void main();
