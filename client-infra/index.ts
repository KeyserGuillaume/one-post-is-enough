import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
const mime = require("mime");
const fs = require("fs");
const path = require("path");

// the initial idea was to include the build in pulumi (with local.Command)
// however this would not work : local.Command runs after the update plan is made
// and because of this, the update of the static files bucket is done on the basis
// of what the code was like at the previous build (and if there was no previous
// build, the update will delete all the static files)
// so always run 'npm run build' at ../client/ before running this

const infra = new pulumi.StackReference("Ecureuil/one-post-is-enough/dev");

const staticBucket = infra.getOutput("staticBucketName");

const addFolderContents = (siteDir: string, prefix?: string) => {
  for (let item of fs.readdirSync(siteDir)) {
    let filePath = path.join(siteDir, item);
    let isDir = fs.lstatSync(filePath).isDirectory();

    // This handles adding subfolders and their content
    if (isDir) {
      const newPrefix = prefix ? path.join(prefix, item) : item;
      addFolderContents(filePath, newPrefix);
      continue;
    }

    let itemPath = prefix ? path.join(prefix, item) : item;
    itemPath = itemPath.replace(/\\/g, "/"); // convert Windows paths to something S3 will recognize

    let object = new aws.s3.BucketObject(itemPath, {
      bucket: staticBucket,
      source: new pulumi.asset.FileAsset(filePath), // use FileAsset to point to a file
      contentType: mime.getType(filePath) || undefined, // set the MIME type of the file
    });
  }
};

addFolderContents("../client/dist"); // base directory for content files
