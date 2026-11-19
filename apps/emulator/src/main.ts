import {
  MQTT_URL,
  VENDOR_A_PUBLISH_INTERVAL_MS,
  VENDOR_A_ROBOT_COUNT,
  VENDOR_B_PORT,
  VENDOR_B_ROBOT_COUNT,
  VENDOR_B_STEP_INTERVAL_MS,
} from "./config";
import { RobotFleet } from "./simulation/robot-fleet";
import { VendorAPublisher } from "./vendor-a/vendor-a-publisher";
import { VendorBServer } from "./vendor-b/vendor-b-server";

const startVendorA = () => {
  const fleet = new RobotFleet("A", VENDOR_A_ROBOT_COUNT);
  const publisher = new VendorAPublisher(MQTT_URL, fleet);
  publisher.connect();

  const dtSec = VENDOR_A_PUBLISH_INTERVAL_MS / 1000;
  setInterval(() => {
    fleet.step(dtSec);
    publisher.publishAll();
  }, VENDOR_A_PUBLISH_INTERVAL_MS);
};

const startVendorB = () => {
  const fleet = new RobotFleet("B", VENDOR_B_ROBOT_COUNT);
  const server = new VendorBServer(VENDOR_B_PORT, fleet);
  server.listen();

  const dtSec = VENDOR_B_STEP_INTERVAL_MS / 1000;
  setInterval(() => fleet.step(dtSec), VENDOR_B_STEP_INTERVAL_MS);
};

startVendorA();
startVendorB();
