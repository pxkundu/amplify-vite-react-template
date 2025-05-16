import awsIot from "aws-iot-device-sdk";
import { point, Position } from "@turf/helpers";
import buffer from "@turf/buffer";
import bbox from "@turf/bbox";
import { randomPosition } from "@turf/random";
import sensors from "./sensors.json";

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface SensorSettings {
  keyPath: string;
  certPath: string;
  caPath: string;
  clientId: string;
  host: string;
  deviceId: string;
  deviceType: string;
}

interface Sensor {
  name: string;
  frequency: number;
  geo: GeoLocation;
  settings: SensorSettings;
}

interface Message {
  deviceId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
}

const VALUE_TOPIC = "iot/pettracker";

function run(sensor: Sensor): void {
  const device = awsIot.device({
    keyPath: sensor.settings.keyPath,
    certPath: sensor.settings.certPath,
    caPath: sensor.settings.caPath,
    clientId: sensor.settings.clientId,
    host: sensor.settings.host,
  });

  device.on("connect", () => {
    console.log(`Connected to IoT Hub for device ${sensor.settings.deviceId}`);

    setInterval(() => {
      const topic = `${VALUE_TOPIC}/${sensor.settings.deviceType}/${sensor.settings.deviceId}`;
      const position = getPosition(sensor.geo);
      const [longitude, latitude] = makeStep(position);

      const msg: Message = {
        deviceId: sensor.settings.deviceId,
        timestamp: Date.now(),
        latitude,
        longitude,
      };

      device.publish(topic, JSON.stringify(msg), (err) => {
        if (err) {
          console.error("Publish error:", err);
        } else {
          console.log(`Published to topic ${topic}: ${JSON.stringify(msg)}`);
        }
      });
    }, sensor.frequency);
  });

  device.on("error", (error: Error) => {
    console.error(`Device error for ${sensor.settings.deviceId}:`, error);
  });
}

function makeStep(position: Position): Position {
  const currentPosition = point(position);
  const bufferAroundPoint = buffer(currentPosition, 0.1, { units: "kilometers" });
  const bboxAroundPoint = bbox(bufferAroundPoint);
  const nextPosition = randomPosition(bboxAroundPoint) as Position;
  return nextPosition;
}

function getPosition(geo: GeoLocation): Position {
  return [geo.longitude, geo.latitude];
}

console.log("Running simulated sensors...");
sensors.forEach((sensor: Sensor) => {
  run(sensor);
});
