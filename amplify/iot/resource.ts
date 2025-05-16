import * as awsIot from "aws-iot-device-sdk";
import sensors from "./sensors.json";
import { point, Position, Feature, Point } from "@turf/helpers";
import buffer from "@turf/buffer";
import bbox from "@turf/bbox";
import { randomPosition } from "@turf/random";

// TypeScript interface definitions
interface SensorSettings {
  deviceId: string;
  deviceType: string;
  [key: string]: any;
}

interface Sensor {
  name: string;
  settings: SensorSettings;
  geo: GeoLocation;
  frequency: number;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface ShadowDocument {
  state: {
    reported: {
      name: string;
      enabled: boolean;
      geo: GeoLocation;
    };
  };
}

interface Message {
  deviceId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
}

// Constants used in the application
const SHADOW_TOPIC = "$aws/things/[thingName]/shadow/update";
const VALUE_TOPIC = "iot/pettracker"; // Topic to which sensor values will be published

// Shadow document to be transmitted at startup
const shadowDocument: ShadowDocument = {
  state: {
    reported: {
      name: "",
      enabled: true,
      geo: {
        latitude: 0,
        longitude: 0,
      },
    },
  },
};

// Initialize a function to simulate sensor data publishing
async function run(sensor: Sensor): Promise<void> {
  // Initialize the IoT device
  const device = awsIot.device(sensor.settings);

  // Create a placeholder for the message
  const msg: Message = {
    deviceId: sensor.settings.deviceId,
    timestamp: new Date().getTime(),
    latitude: -1,
    longitude: -1,
  };

  device.on("connect", () => {
    console.log("Connected to IoT Hub");

    // Publish new value readings based on value_rate
    setInterval(() => {
      // Define the telemetry topic
      const topic = VALUE_TOPIC.replace("+", sensor.settings.deviceType).replace(
        "+",
        sensor.settings.deviceId
      );

      // Calculate a random position for the sensor reading
      const position = getPosition(sensor.geo);
      const [longitude, latitude] = makeStep(position);

      msg.latitude = latitude;
      msg.longitude = longitude;
      msg.timestamp = new Date().getTime();

      device.publish(topic, JSON.stringify(msg));

      console.log("Published to telemetry topic", JSON.stringify(msg));
    }, sensor.frequency);
  });

  device.on("error", (error) => {
    console.error("Error: ", error);
  });
}

// Generate a random value within a specified range
function RandomValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Move the sensor's position in a random step within a buffer around its current location
function makeStep(position: Position): Position {
  const currentPosition: Feature<Point> = point(position);
  const bufferAroundPoint = buffer(currentPosition, 1000, {
    units: "meters",
  });
  const bboxAroundPoint = bbox(bufferAroundPoint);
  const nextPosition = randomPosition(bboxAroundPoint) as Position;

  return nextPosition;
}

// Get the geographic position of the sensor
function getPosition(geo: GeoLocation): Position {
  return [geo.longitude, geo.latitude];
}

// Run simulation for each sensor
sensors.forEach((sensor: Sensor) => {
  console.log("Running simulated sensor:", sensor.name);
  run(sensor).catch((error) => console.error(`Error running sensor ${sensor.name}:`, error));
});


