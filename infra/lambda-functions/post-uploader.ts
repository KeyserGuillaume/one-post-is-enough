import * as aws from "@pulumi/aws";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const getPostSetterHandler = (
  userPostsBucket: aws.s3.BucketV2,
  role: aws.iam.Role
) => {
  return new aws.lambda.CallbackFunction("post-uploader", {
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

      const body = event.body;
      if (!body) {
        return {
          statusCode: 400,
          headers,
        };
      }

      if (body.length > 1e6) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "File is too large" }),
        };
      }

      const buffer = Buffer.from(body, "base64");
      const uint8Array = new Uint8Array(buffer);
      const firstHex = uint8Array[0].toString(16);
      const secondHex = uint8Array[1].toString(16);
      // ffd8 is jpg and ffe0 is jfif. It seems they are often considered interchangeable
      const isCorrectFormat =
        firstHex === "ff" && (secondHex === "d8" || secondHex === "e0");
      if (!isCorrectFormat) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Wrong file format : only jpg/jpeg is accepted",
          }),
        };
      }

      const input = {
        Body: buffer,
        Bucket: userPostsBucket,
        Key: username + ".jpg",
      };
      const command = new PutObjectCommand(input);
      const client = new S3Client({ region: "eu-west-3" });
      const response = await client.send(command);

      if (!response) {
        return {
          statusCode: 500,
          headers,
        };
      }

      return {
        statusCode: 200,
        headers,
      };
    },
  });
};
