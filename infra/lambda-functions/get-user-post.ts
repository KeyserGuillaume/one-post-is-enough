import * as aws from "@pulumi/aws";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const getPostGetterHandler = (
  userPostsBucket: aws.s3.BucketV2,
  role: aws.iam.Role
) => {
  return new aws.lambda.CallbackFunction("get-user-post", {
    environment: {
      variables: {
        USER_POSTS_BUCKET: userPostsBucket.bucket,
      },
    },
    role,
    policies: [aws.iam.ManagedPolicies.AmazonS3FullAccess],
    callback: async (event: any) => {
      const userPostsBucket = process.env.USER_POSTS_BUCKET;

      const headers = {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      };

      const client = new S3Client({ region: "eu-west-3" });

      const claims = event?.requestContext?.authorizer?.claims;
      if (!event || !claims) {
        return {
          statusCode: 500,
          headers,
        };
      }
      const username = claims["cognito:username"];

      const input = {
        Bucket: userPostsBucket,
        Key: username + ".jpg",
      };
      const command = new GetObjectCommand(input);

      let response;
      try {
        response = await client.send(command);
      } catch {
        return {
          statusCode: 404,
          headers,
        };
      }

      if (!response.Body) {
        return {
          statusCode: 500,
          headers,
        };
      }
      // The Body object has 'transformToString', 'transformToByteArray' and 'transformToWebStream' methods.
      const uint8Array = await response.Body.transformToByteArray();
      const b64Encoded = Buffer.from(uint8Array).toString("base64");

      const response2 = {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "image/jpg",
        },
        body: b64Encoded,
      };
      return response2;
    },
  });
};
