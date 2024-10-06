import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
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

const lambdaRole = new aws.iam.Role(`one-post-is-enough-lambda-role`, {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
});
new aws.iam.RolePolicy(`one-post-is-enough-lambda-role-policy`, {
  role: lambdaRole,
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: ["s3:*"],
        Resource: "*",
        Effect: "Allow",
      },
    ],
  },
});

const apiRole = new aws.iam.Role(`one-post-is-enough-api-role`, {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "apigateway.amazonaws.com",
  }),
});
new aws.iam.RolePolicy(`one-post-is-enough-api-role-policy`, {
  role: apiRole,
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: ["s3:*"],
        Resource: [
          pulumi.interpolate`${theOnePostBucket.arn}`,
          pulumi.interpolate`${theOnePostBucket.arn}/*`,
        ],
        Effect: "Allow",
      },
    ],
  },
});

const api = new aws.apigateway.RestApi("one-post-is-enough", {
  binaryMediaTypes: ["image/jpg", "image/jpeg"],
});

// put everything related to the api and pass this via dependOn to deployment
const apiDeploymentTriggers: pulumi.Input<string>[] = [api.id];
const authorizer = new aws.apigateway.Authorizer("cognito-authorizer", {
  type: "COGNITO_USER_POOLS",
  restApi: api.id,
  providerArns: [userPool.arn],
  identitySource: "method.request.header.Authorization",
});
apiDeploymentTriggers.push(authorizer.id);

const rootOptionsMethod = new aws.apigateway.Method("routeOptionsMethod", {
  restApi: api.id,
  resourceId: api.rootResourceId,
  httpMethod: "OPTIONS",
  authorization: "NONE",
});
apiDeploymentTriggers.push(rootOptionsMethod.id);

apiDeploymentTriggers.push(
  new aws.apigateway.Integration("rootOptionsIntegration", {
    httpMethod: rootOptionsMethod.httpMethod,
    integrationHttpMethod: "OPTIONS",
    resourceId: api.rootResourceId,
    restApi: api.id,
    type: "MOCK",
    requestTemplates: {
      "application/json": '{"statusCode": 200}',
    },
  }).id
);

const rootOptionsMethodResponse = new aws.apigateway.MethodResponse(
  "rootOptionsMethodResponse",
  {
    restApi: api.id,
    resourceId: api.rootResourceId,
    httpMethod: rootOptionsMethod.httpMethod,
    statusCode: "200",
    responseModels: {
      "application/json": "Empty",
    },
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin": true,
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true,
    },
  }
);
apiDeploymentTriggers.push(rootOptionsMethodResponse.id);

apiDeploymentTriggers.push(
  new aws.apigateway.IntegrationResponse("rootOptionsIntegrationResponse", {
    restApi: api.id,
    resourceId: api.rootResourceId,
    httpMethod: rootOptionsMethod.httpMethod,
    statusCode: rootOptionsMethodResponse.statusCode,
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin": "'*'",
      "method.response.header.Access-Control-Allow-Methods":
        "'DELETE,GET,OPTIONS,POST'",
      "method.response.header.Access-Control-Allow-Headers":
        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    },
  }).id
);

const rootGetMethod = new aws.apigateway.Method("routeGetMethod", {
  restApi: api.id,
  resourceId: api.rootResourceId,
  httpMethod: "GET",
  authorization: "COGNITO_USER_POOLS",
  authorizerId: authorizer.id,
});
apiDeploymentTriggers.push(rootGetMethod.id);

apiDeploymentTriggers.push(
  new aws.apigateway.Integration("rootGetIntegration", {
    httpMethod: rootGetMethod.httpMethod,
    integrationHttpMethod: "GET",
    resourceId: api.rootResourceId,
    restApi: api.id,
    type: "AWS",
    credentials: apiRole.arn,
    uri: pulumi.interpolate`arn:aws:apigateway:eu-west-3:s3:path/${theOnePostBucket.bucket}/image.jpg`,
  }).id
);

const rootGetResponse = new aws.apigateway.MethodResponse("rootGetResponse", {
  restApi: api.id,
  resourceId: api.rootResourceId,
  httpMethod: rootGetMethod.httpMethod,
  statusCode: "200",
  responseParameters: {
    "method.response.header.Access-Control-Allow-Origin": true,
  },
});
apiDeploymentTriggers.push(rootGetResponse.id);

apiDeploymentTriggers.push(
  new aws.apigateway.IntegrationResponse("rootGetIntegrationResponse", {
    restApi: api.id,
    resourceId: api.rootResourceId,
    httpMethod: rootGetMethod.httpMethod,
    statusCode: rootGetResponse.statusCode,
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin": "'*'",
    },
  }).id
);

const triggers: { [x: string]: pulumi.Input<string> } = {};
apiDeploymentTriggers.forEach(
  (pulumiInput, index) => (triggers[index] = pulumiInput)
);
const deployment = new aws.apigateway.Deployment("api-deployment", {
  restApi: api.id,
  triggers,
});
const stage = new aws.apigateway.Stage(
  "api-stage",
  {
    stageName: "client",
    restApi: api.id,
    deployment,
  },
  {
    dependsOn: [deployment],
    replaceOnChanges: ["deployment"],
  }
);

const apiUserPostResource = new aws.apigateway.Resource("userPostResource", {
  restApi: api.id,
  parentId: api.rootResourceId,
  pathPart: "user-post",
});
export const userPoolId = userPool.id;
export const userPoolClientId = userPoolClient.id;
