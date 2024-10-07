import * as aws from "@pulumi/aws";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
} from "@aws-sdk/client-s3";

export const getPostSelectorHandler = (
  userPostsBucket: aws.s3.BucketV2,
  theOnePostBucket: aws.s3.BucketV2,
  role: aws.iam.Role
) => {
  return new aws.lambda.CallbackFunction("post-selector", {
    policies: [aws.iam.ManagedPolicies.AmazonS3FullAccess],
    role,
    environment: {
      variables: {
        USER_POSTS_BUCKET: userPostsBucket.bucket,
        THE_ONE_POST_BUCKET: theOnePostBucket.bucket,
      },
    },
    callback: async (event: any) => {
      const userPostsBucket = process.env.USER_POSTS_BUCKET;
      const theOnePostBucket = process.env.THE_ONE_POST_BUCKET;

      const client = new S3Client({ region: "eu-west-3" });
      const listCommand = new ListObjectsV2Command({ Bucket: userPostsBucket });
      const listResponse = await client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log("There is no user post, abort");
        return;
      }

      function getRandomInt(max: number) {
        return Math.floor(Math.random() * max);
      }

      const chosenPostIndex = getRandomInt(listResponse.Contents.length);

      const getCommand = new GetObjectCommand({
        Bucket: userPostsBucket,
        Key: listResponse.Contents[chosenPostIndex].Key,
      });
      const getResponse = await client.send(getCommand);

      if (!getResponse.Body) {
        console.log("Missing Body in response from s3");
        return;
      }

      const uint8Array = await getResponse.Body.transformToByteArray();
      const putCommand = new PutObjectCommand({
        Bucket: theOnePostBucket,
        Key: "image.jpg",
        Body: Buffer.from(uint8Array),
        ContentType: "image/jpeg",
      });
      const putResponse = await client.send(putCommand);
      if (putResponse["$metadata"].httpStatusCode !== 200) {
        console.log("There was a problem with transfering chosen post");
        console.log(putResponse);
        return;
      }

      const promises: Array<Promise<DeleteObjectCommandOutput>> = [];
      for (const item of listResponse.Contents) {
        const command = new DeleteObjectCommand({
          Bucket: userPostsBucket,
          Key: item.Key,
        });
        promises.push(client.send(command));
      }
      await Promise.all(promises);
      console.log("Finished cleaning up user posts bucket");
    },
  });
};
