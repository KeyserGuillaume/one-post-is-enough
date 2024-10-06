import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

function createRootOptionsMethod(
  api: aws.apigateway.RestApi,
  apiDeploymentTriggers: pulumi.Input<string>[]
) {
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
}

function createRootGetMethod(
  api: aws.apigateway.RestApi,
  apiDeploymentTriggers: pulumi.Input<string>[],
  authorizer: aws.apigateway.Authorizer,
  theOnePostBucket: aws.s3.BucketV2
) {
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
}

export function createApi(
  userPool: aws.cognito.UserPool,
  theOnePostBucket: aws.s3.BucketV2
) {
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

  const api = new aws.apigateway.RestApi("one-post-is-enough", {
    binaryMediaTypes: ["image/jpg", "image/jpeg"],
  });

  // put everything related to the api and pass this via triggers to deployment
  const apiDeploymentTriggers: pulumi.Input<string>[] = [api.id];
  const authorizer = new aws.apigateway.Authorizer("cognito-authorizer", {
    type: "COGNITO_USER_POOLS",
    restApi: api.id,
    providerArns: [userPool.arn],
    identitySource: "method.request.header.Authorization",
  });
  apiDeploymentTriggers.push(authorizer.id);

  createRootOptionsMethod(api, apiDeploymentTriggers);
  createRootGetMethod(api, apiDeploymentTriggers, authorizer, theOnePostBucket);

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
}
