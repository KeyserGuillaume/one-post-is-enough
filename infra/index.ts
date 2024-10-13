import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createApi } from "./api-gateway";
import { getPostSelectorHandler } from "./lambda-functions/post-selector";

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

const lambdaRole = new aws.iam.Role("getUserPostRole", {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
      },
    ],
  },
});
new aws.iam.RolePolicyAttachment("getUserPostRolePolicy", {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
});
new aws.iam.RolePolicyAttachment("getUserPostRolePolicyBis", {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicies.AmazonS3FullAccess,
});

const lambdaSelector = getPostSelectorHandler(
  userPostsBucket,
  theOnePostBucket,
  lambdaRole
);

const schedulerRole = new aws.iam.Role("postSelectorScheduler", {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "scheduler.amazonaws.com",
        },
        Effect: "Allow",
      },
    ],
  },
});
new aws.iam.RolePolicy(`one-post-is-enough-scheduler-role-policy`, {
  role: schedulerRole,
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: ["lambda:InvokeFunction"],
        Resource: [
          pulumi.interpolate`${lambdaSelector.arn}`,
          pulumi.interpolate`${lambdaSelector.arn}/*`,
        ],
        Effect: "Allow",
      },
    ],
  },
});

new aws.scheduler.Schedule("update-one-post-is-enough", {
  groupName: "default",
  flexibleTimeWindow: {
    mode: "FLEXIBLE",
    maximumWindowInMinutes: 10,
  },
  scheduleExpression: "cron(30 22 * * ? *)",
  scheduleExpressionTimezone: "Europe/Paris",
  target: {
    arn: lambdaSelector.arn,
    roleArn: schedulerRole.arn,
  },
});

const staticBucket = new aws.s3.BucketV2("one-post-is-enough-static-content");
export const staticBucketName = staticBucket.bucket;

export const apiEndpointUrl = createApi(
  userPool,
  theOnePostBucket,
  userPostsBucket,
  staticBucket,
  lambdaRole
);

export const userPoolId = userPool.id;
export const userPoolClientId = userPoolClient.id;
