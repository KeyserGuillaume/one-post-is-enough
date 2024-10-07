import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createApi } from "./api-gateway";
// import { postDeleterHandler } from "./lambda-functions/post-deleter";
// import { postUploadHandler } from "./lambda-functions/post-uploader";

const userPool = new aws.cognito.UserPool(
  "user-pool",
  {
    name: "one-post-is-enough",
    usernameAttributes: ["email"],
    accountRecoverySetting: {
      recoveryMechanisms: [{ name: "verified_email", priority: 1 }],
    },
    autoVerifiedAttributes: ["email"],
    schemas: [
      { name: "name", attributeDataType: "String", required: true },
      { name: "email", attributeDataType: "String", required: true },
    ],
    deletionProtection: "ACTIVE",
  },
  { protect: true }
);

const userPoolClient = new aws.cognito.UserPoolClient("user-pool-client", {
  userPoolId: userPool.id,
  name: "one-post-is-enough",
});

const theOnePostBucket = new aws.s3.BucketV2(
  "the-one-post",
  {},
  { protect: true }
);
const userPostsBucket = new aws.s3.BucketV2(
  "user-posts",
  {},
  { protect: true }
);

createApi(userPool, theOnePostBucket, userPostsBucket);

export const userPoolId = userPool.id;
export const userPoolClientId = userPoolClient.id;
