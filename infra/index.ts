import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const userPool = new aws.cognito.UserPool("user-pool", {}, { protect: true });
const userPoolClient = new aws.cognito.UserPoolClient("user-pool-client", {
  userPoolId: userPool.id,
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

export const userPoolId = userPool.id;
export const userPoolClientId = userPoolClient.id;
