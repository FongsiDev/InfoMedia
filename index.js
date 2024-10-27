const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const axios = require("axios");
const fileType = require("file-type");

async function infoMedia(PATH, options = {}) {
  const type = options.type || "buffer";
  const data = Buffer.isBuffer(PATH)
    ? PATH
    : PATH instanceof ArrayBuffer
      ? Buffer.from(PATH)
      : /^data:.*?\/.*?;base64,/i.test(PATH)
        ? Buffer.from(PATH.split(",")[1], "base64")
        : /^https?:\/\//.test(PATH)
          ? (await axios.get(PATH, { responseType: "arraybuffer" })).data
          : fs.existsSync(PATH)
            ? ((fileName = PATH), fs.readFileSync(PATH))
            : typeof PATH === "string"
              ? Buffer.from(PATH)
              : Buffer.alloc(0);

  if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");
  const typeFile = (await fileType.fromBuffer(data)) || {
    mime: "application/octet-stream",
    ext: "bin",
  };
  let resultData;

  switch (type) {
    case "buffer":
      resultData = data;
      break;
    case "stream":
      const stream = new Readable();
      stream.push(data);
      stream.push(null);
      resultData = stream;
      break;
    case "base64":
      resultData = data.toString("base64");
      break;
    case "base64url":
      resultData = `data:${typeFile.mime};base64,${data.toString("base64")}`;
      break;
    case "binary":
      resultData = Buffer.from(data, "binary");
      break;
    default:
      throw new Error("Invalid type option");
  }

  return {
    file_name: options.fileName
      ? options.fileName
      : typeof PATH === "string"
        ? path.basename(PATH)
        : `${Date.now()}.${typeFile.ext}`,
    file_size: data.length,
    file_mime: typeFile.mime,
    file_type: type,
    file_ext: typeFile.ext,
    file_data: resultData,
  };
}

module.exports = infoMedia;