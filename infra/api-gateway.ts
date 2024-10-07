import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { getPostGetterHandler } from "./lambda-functions/get-user-post";
import { getPostSetterHandler } from "./lambda-functions/post-uploader";
import { getPostDeleterHandler } from "./lambda-functions/post-deleter";

function createOptionsMethod(
  api: aws.apigateway.RestApi,
  resourceId: pulumi.Output<string>,
  prefix: string, // necessary to ensure unique resource logical names
  apiDeploymentTriggers: pulumi.Input<string>[]
) {
  const optionsMethod = new aws.apigateway.Method(`${prefix}OptionsMethod`, {
    restApi: api.id,
    resourceId,
    httpMethod: "OPTIONS",
    authorization: "NONE",
  });
  apiDeploymentTriggers.push(optionsMethod.id);

  const integration = new aws.apigateway.Integration(
    `${prefix}OptionsIntegration`,
    {
      httpMethod: optionsMethod.httpMethod,
      integrationHttpMethod: "OPTIONS",
      resourceId,
      restApi: api.id,
      type: "MOCK",
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    },
    // a bug in the aws provider : integrationHttpMethod is overwritten with empty value
    { ignoreChanges: ["integrationHttpMethod"] }
  );
  apiDeploymentTriggers.push(integration.id);

  const optionsMethodResponse = new aws.apigateway.MethodResponse(
    `${prefix}OptionsMethodResponse`,
    {
      restApi: api.id,
      resourceId,
      httpMethod: optionsMethod.httpMethod,
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
  apiDeploymentTriggers.push(optionsMethodResponse.id);

  apiDeploymentTriggers.push(
    new aws.apigateway.IntegrationResponse(
      `${prefix}OptionsIntegrationResponse`,
      {
        restApi: api.id,
        resourceId: resourceId,
        httpMethod: optionsMethod.httpMethod,
        statusCode: optionsMethodResponse.statusCode,
        responseParameters: {
          "method.response.header.Access-Control-Allow-Origin": "'*'",
          "method.response.header.Access-Control-Allow-Methods":
            "'DELETE,GET,OPTIONS,POST'",
          "method.response.header.Access-Control-Allow-Headers":
            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        },
      },
      { dependsOn: [integration] }
    ).id
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

function createUserPostGetMethod(
  api: aws.apigateway.RestApi,
  apiUserPostResource: aws.apigateway.Resource,
  apiDeploymentTriggers: pulumi.Input<string>[],
  authorizer: aws.apigateway.Authorizer,
  userPostsBucket: aws.s3.BucketV2,
  lambdaRole: aws.iam.Role
) {
  const lambdaFunction = getPostGetterHandler(userPostsBucket, lambdaRole);

  const userPostGetMethod = new aws.apigateway.Method("userPostGetMethod", {
    restApi: api.id,
    resourceId: apiUserPostResource.id,
    httpMethod: "GET",
    authorization: "COGNITO_USER_POOLS",
    authorizerId: authorizer.id,
  });
  apiDeploymentTriggers.push(userPostGetMethod.id);

  new aws.lambda.Permission("apiGatewayGetUserPostPermission", {
    action: "lambda:InvokeFunction",
    function: lambdaFunction.arn,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  });

  apiDeploymentTriggers.push(
    new aws.apigateway.Integration("userPostGetIntegration", {
      httpMethod: userPostGetMethod.httpMethod,
      integrationHttpMethod: "POST",
      resourceId: apiUserPostResource.id,
      restApi: api.id,
      type: "AWS_PROXY",
      uri: lambdaFunction.invokeArn,
    }).id
  );

  apiDeploymentTriggers.push(
    new aws.apigateway.MethodResponse("userPostGetResponse", {
      restApi: api.id,
      resourceId: apiUserPostResource.id,
      httpMethod: userPostGetMethod.httpMethod,
      statusCode: "200",
      responseParameters: {
        "method.response.header.Access-Control-Allow-Origin": true,
      },
    }).id
  );
}

function createUserPostPostMethod(
  api: aws.apigateway.RestApi,
  apiUserPostResource: aws.apigateway.Resource,
  apiDeploymentTriggers: pulumi.Input<string>[],
  authorizer: aws.apigateway.Authorizer,
  userPostsBucket: aws.s3.BucketV2,
  lambdaRole: aws.iam.Role
) {
  const lambdaFunction = getPostSetterHandler(userPostsBucket, lambdaRole);

  const userPostPostMethod = new aws.apigateway.Method("userPostPostMethod", {
    restApi: api.id,
    resourceId: apiUserPostResource.id,
    httpMethod: "POST",
    authorization: "COGNITO_USER_POOLS",
    authorizerId: authorizer.id,
  });
  apiDeploymentTriggers.push(userPostPostMethod.id);

  new aws.lambda.Permission("apiGatewaySetUserPostPermission", {
    action: "lambda:InvokeFunction",
    function: lambdaFunction.arn,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  });

  apiDeploymentTriggers.push(
    new aws.apigateway.Integration("userPostPostIntegration", {
      httpMethod: userPostPostMethod.httpMethod,
      integrationHttpMethod: "POST",
      resourceId: apiUserPostResource.id,
      restApi: api.id,
      type: "AWS_PROXY",
      uri: lambdaFunction.invokeArn,
    }).id
  );

  apiDeploymentTriggers.push(
    new aws.apigateway.MethodResponse("userPostPostResponse", {
      restApi: api.id,
      resourceId: apiUserPostResource.id,
      httpMethod: userPostPostMethod.httpMethod,
      statusCode: "200",
      responseParameters: {
        "method.response.header.Access-Control-Allow-Origin": true,
      },
    }).id
  );
}

function createUserPostDeleteMethod(
  api: aws.apigateway.RestApi,
  apiUserPostResource: aws.apigateway.Resource,
  apiDeploymentTriggers: pulumi.Input<string>[],
  authorizer: aws.apigateway.Authorizer,
  userPostsBucket: aws.s3.BucketV2,
  lambdaRole: aws.iam.Role
) {
  const lambdaFunction = getPostDeleterHandler(userPostsBucket, lambdaRole);

  const userPostDeleteMethod = new aws.apigateway.Method(
    "userPostDeleteMethod",
    {
      restApi: api.id,
      resourceId: apiUserPostResource.id,
      httpMethod: "DELETE",
      authorization: "COGNITO_USER_POOLS",
      authorizerId: authorizer.id,
    }
  );
  apiDeploymentTriggers.push(userPostDeleteMethod.id);

  new aws.lambda.Permission("apiGatewayDeleteUserPostPermission", {
    action: "lambda:InvokeFunction",
    function: lambdaFunction.arn,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  });

  apiDeploymentTriggers.push(
    new aws.apigateway.Integration("userPostDeleteIntegration", {
      httpMethod: userPostDeleteMethod.httpMethod,
      integrationHttpMethod: "POST",
      resourceId: apiUserPostResource.id,
      restApi: api.id,
      type: "AWS_PROXY",
      uri: lambdaFunction.invokeArn,
    }).id
  );

  apiDeploymentTriggers.push(
    new aws.apigateway.MethodResponse("userPostDeleteResponse", {
      restApi: api.id,
      resourceId: apiUserPostResource.id,
      httpMethod: userPostDeleteMethod.httpMethod,
      statusCode: "200",
      responseParameters: {
        "method.response.header.Access-Control-Allow-Origin": true,
      },
    }).id
  );
}

export function createApi(
  userPool: aws.cognito.UserPool,
  theOnePostBucket: aws.s3.BucketV2,
  userPostsBucket: aws.s3.BucketV2,
  lambdaRole: aws.iam.Role
) {
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

  createOptionsMethod(api, api.rootResourceId, "root", apiDeploymentTriggers);
  createRootGetMethod(api, apiDeploymentTriggers, authorizer, theOnePostBucket);

  const apiUserPostResource = new aws.apigateway.Resource("userPostResource", {
    restApi: api.id,
    parentId: api.rootResourceId,
    pathPart: "user-post",
  });
  apiDeploymentTriggers.push(apiUserPostResource.id);

  createOptionsMethod(
    api,
    apiUserPostResource.id,
    "userPost",
    apiDeploymentTriggers
  );

  createUserPostGetMethod(
    api,
    apiUserPostResource,
    apiDeploymentTriggers,
    authorizer,
    userPostsBucket,
    lambdaRole
  );
  createUserPostPostMethod(
    api,
    apiUserPostResource,
    apiDeploymentTriggers,
    authorizer,
    userPostsBucket,
    lambdaRole
  );
  createUserPostDeleteMethod(
    api,
    apiUserPostResource,
    apiDeploymentTriggers,
    authorizer,
    userPostsBucket,
    lambdaRole
  );

  const triggers: { [x: string]: pulumi.Input<string> } = {};
  apiDeploymentTriggers.forEach(
    (pulumiInput, index) => (triggers[index] = pulumiInput)
  );
  const deployment = new aws.apigateway.Deployment("api-deployment", {
    restApi: api.id,
    triggers,
    stageName: "client",
  });
}
