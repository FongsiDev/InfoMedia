const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const { Buffer } = require("buffer");
const { Readable } = require("stream");
const axios = require("axios");
const fileType = require("file-type");

// Helper to convert a base64 URL to a normal base64 string
const base64UrlToBase64 = (base64Url) =>
  base64Url.replace(/-/g, "+").replace(/_/g, "/");

async function infoMedia(input, options = {}) {
  const type = options.type || "buffer";
  let fileName = options.file_name || null;
  let fileData, fileSize, fileMime, fileExt;

  if (Buffer.isBuffer(input)) {
    fileData = input;
    fileSize = input.length;
  } else if (typeof input === "string") {
    if (input.startsWith("data:")) {
      const matches = input.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid base64 data URI");
      const base64Data = matches[2];
      fileData = Buffer.from(base64Data, "base64");
      fileSize = fileData.length;
    } else if (input.startsWith("http") || input.startsWith("https")) {
      const response = await axios.get(input, { responseType: "arraybuffer" });
      fileData = Buffer.from(response.data);
      fileSize = fileData.length;
    } else {
      if (!fs.existsSync(input)) throw new Error("File not found");
      fileData = fs.readFileSync(input);
      fileSize = fileData.length;
      fileName = fileName || path.basename(input);
    }
  } else if (input instanceof Readable) {
    const chunks = [];
    for await (const chunk of input) {
      chunks.push(chunk);
    }
    fileData = Buffer.concat(chunks);
    fileSize = fileData.length;
  } else {
    throw new Error("Unsupported input type");
  }

  const fileTypeResult = await fileType.fromBuffer(fileData);
  if (fileTypeResult) {
    fileMime = fileTypeResult.mime;
    fileExt = fileTypeResult.ext;
  } else {
    fileMime = mime.lookup(fileName) || "application/octet-stream";
    fileExt = mime.extension(fileMime) || "";
  }

  fileName = fileName || `${Date.now()}.${fileExt}`;

  // Handle output format
  let resultData;
  switch (type) {
    case "buffer":
      resultData = fileData;
      break;
    case "stream":
      const stream = new Readable();
      stream.push(fileData);
      stream.push(null);
      resultData = stream;
      break;
    case "base64":
      resultData = fileData.toString("base64");
      break;
    case "base64url":
      resultData = `data:${fileMime};base64,${Buffer.from(fileData, "binary").toString("base64")}`;
      break;
    case "binary":
      resultData = Buffer.from(fileData, "binary");
      break;
    default:
      throw new Error("Invalid type option");
  }

  return {
    file_name: fileName,
    file_size: fileSize,
    file_mime: fileMime,
    file_type: type,
    file_ext: fileExt,
    file_data: resultData,
  };
};

module.exports = infoMedia;