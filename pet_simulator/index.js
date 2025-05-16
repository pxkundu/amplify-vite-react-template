const awsIot = require("aws-iot-device-sdk");

//load the sensors file that contains the location of the device certificates and the clientId of the sensor
var sensors = require("./sensors.json");
const { point } = require("@turf/helpers");
const { default: buffer } = require("@turf/buffer");
const { default: bbox } = require("@turf/bbox");
const { randomPosition } = require("@turf/random");

//constants used in the application
const SHADOW_TOPIC = "$aws/things/[thingName]/shadow/update";
const VALUE_TOPIC = "iot/pettracker"; //topic to which sensor values will be published

//shadow document to be transmitted at statup
var shadowDocument = {
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

async function run(sensor) {
  //initialize the IOT device
  var device = awsIot.device(sensor.settings);

  //create a placeholder for the message
  var msg = {
    deviceId: sensor.settings.deviceId,
    timestamp: new Date().getTime(),
    latitude: -1,
    longitude: -1,
  };

  device.on("connect", function () {
    console.log("connected to IoT Hub");

    //publish the shadow document for the sensor
    // var topic = SHADOW_TOPIC.replace("[thingName]", sensor.settings.deviceId);

    // shadowDocument.state.reported.name = sensor.name;
    // shadowDocument.state.reported.enabled = true;
    // shadowDocument.state.reported.geo.latitude = sensor.geo.latitude;
    // shadowDocument.state.reported.geo.longitude = sensor.geo.longitude;

    // device.publish(topic, JSON.stringify(shadowDocument));

    // console.log(
    //   "published to shadow topic " +
    //     topic +
    //     " " +
    //     JSON.stringify(shadowDocument)
    // );

    //publish new value readings based on value_rate
    setInterval(function () {
      //calculate randome values for each sensor reading

      //publish the sensor reading message
      var topic = VALUE_TOPIC.replace("+", sensor.settings.deviceType).replace(
        "+",
        sensor.settings.deviceId
      );

      var position = getPosition(sensor.geo);

      var [longitude, latitude] = makeStep(position);

      msg.latitude = latitude;
      msg.longitude = longitude;

      device.publish(topic, JSON.stringify(msg));

      console.log(
        "published to telemetry topic " + JSON.stringify(msg)
      );
    }, sensor.frequency);
  });

  device.on("error", function (error) {
    console.log("Error: ", error);
  });
}

function RandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeStep(position) {
  const currentPosition = point(position);
  // Create a buffer around the current position (i.e. a polygon 10feet around the point)
  const bufferAroundPoint = buffer(currentPosition, 1000, {
    units: "meters",
  });
  // Create a bounding box around the buffer
  const bboxAroundPoint = bbox(bufferAroundPoint);
  // Generate a random point within the intersection bounding box
  const nextPosition = randomPosition(bboxAroundPoint);

  return nextPosition;
}

function getPosition(geo) {
  return [geo.longitude, geo.latitude];
}

//run simulation for each sensor
sensors.forEach((sensor) => {
  console.log("runninng simulated sensors...");
  run(sensor);
});
