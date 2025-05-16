import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sayHello } from './functions/say-hello/resource';
import { IotCoreConstruct, getPosition } from './iot/resource';  // Import the IoT core construct and simulation function
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CfnMap } from "aws-cdk-lib/aws-location";
import { Stack } from "aws-cdk-lib/core";

const backend = defineBackend({
  auth,
  data,
  sayHello,
});

// Set up the Geo Stack as before
const geoStack = backend.createStack("geo-stack");

const map = new CfnMap(geoStack, "Map", {
  mapName: "myMap",
  description: "Map",
  configuration: {
    style: "VectorEsriNavigation",
  },
  pricingPlan: "RequestBasedUsage",
  tags: [
    {
      key: "name",
      value: "myMap",
    },
  ],
});

const myGeoPolicy = new Policy(geoStack, "GeoPolicy", {
  policyName: "myGeoPolicy",
  statements: [
    new PolicyStatement({
      actions: [
        "geo:GetMapTile",
        "geo:GetMapSprites",
        "geo:GetMapGlyphs",
        "geo:GetMapStyleDescriptor",
      ],
      resources: [map.attrArn],
    }),
  ],
});

// Uncomment these lines if you have defined roles for authenticated and unauthenticated users
// backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(myGeoPolicy);
// backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(myGeoPolicy);

backend.addOutput({
  geo: {
    aws_region: geoStack.region,
    maps: {
      items: {
        [map.mapName]: {
          style: "VectorEsriNavigation",
        },
      },
      default: map.mapName,
    },
  },
});

// Create a new stack for IoT resources and run the simulation
const iotStack = backend.createStack("iot-stack");

// Initialize IoT Core Construct with any necessary configuration options
const iotCore = new IotCoreConstruct(iotStack, "IotCoreConstruct", {
  // Configuration options for your IoT Core Construct
  thingNamePrefix: "MyIoTDevice",
  topic: "iot/pettracker",
});

// Add IAM policies as necessary
const iotPolicy = new Policy(iotStack, "IotPolicy", {
  policyName: "iotDevicePolicy",
  statements: [
    new PolicyStatement({
      actions: ["iot:Publish", "iot:Connect", "iot:Receive", "iot:Subscribe"],
      resources: ["*"],  // Specify resources or ARNs as needed
    }),
  ],
});

// Attach policies to roles if your construct includes IAM roles
// iotCore.deviceRole.attachInlinePolicy(iotPolicy);

// Run the IoT simulation after defining the necessary IoT resources
getPosition();
