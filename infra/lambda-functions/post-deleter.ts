import * as aws from "@pulumi/aws";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const getPostDeleterHandler = (
  userPostsBucket: aws.s3.BucketV2,
  role: aws.iam.Role
) => {
  return new aws.lambda.CallbackFunction("post-deleter", {
    policies: [aws.iam.ManagedPolicies.AmazonS3FullAccess],
    role,
    environment: {
      variables: {
        USER_POSTS_BUCKET: userPostsBucket.bucket,
      },
    },
    callback: async (event: any) => {
      const userPostsBucket = process.env.USER_POSTS_BUCKET;
      const headers = {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      };

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
      const command = new DeleteObjectCommand(input);
      const client = new S3Client({ region: "eu-west-3" });
      await client.send(command);

      const response = {
        statusCode: 200,
        headers,
      };
      return response;
    },
  });
};
