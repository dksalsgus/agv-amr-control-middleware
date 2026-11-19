import {
  MQTT_URL,
  VENDOR_A_PUBLISH_INTERVAL_MS,
  VENDOR_A_ROBOT_COUNT,
} from "./config";
import { RobotFleet } from "./simulation/robot-fleet";
import { VendorAPublisher } from "./vendor-a/vendor-a-publisher";

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

startVendorA();
