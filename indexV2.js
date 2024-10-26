const fs = require("fs");
const path = require("path");
const axios = require("axios");
const fileType = require("file-type");
const mime = require("mime-types");

const convert = {
  bufferToBase64: (buffer) => buffer.toString("base64"),
  bufferToBase64Url: async (buffer) => {
    const fileInfo = await fileType.fromBuffer(buffer);
    const mimeType = fileInfo ? fileInfo.mime : "application/octet-stream";
    return `data:${mimeType};base64,${buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
  },
  bufferToBinary: (buffer) => buffer.toString("binary"),
  bufferToStream: (buffer) => {
    const stream = new require("stream").Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  },

  base64ToBuffer: (base64) => Buffer.from(base64, "base64"),
  base64ToBase64Url: async (base64) =>
    convert.bufferToBase64Url(Buffer.from(base64, "base64")),
  base64ToBinary: (base64) => Buffer.from(base64, "base64").toString("binary"),
  base64ToStream: (base64) =>
    convert.bufferToStream(Buffer.from(base64, "base64")),

  base64UrlToBuffer: (base64Url) => {
    const matches = base64Url.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid base64 data URI");
    const base64Data = matches[2];
    return Buffer.from(base64Data, "base64");
  },
  base64UrlToBase64: (base64Url) =>
    convert.bufferToBase64(convert.base64UrlToBuffer(base64Url)),
  base64UrlToBinary: (base64Url) =>
    Buffer.from(convert.base64UrlToBuffer(base64Url)).toString("binary"),
  base64UrlToStream: (base64Url) =>
    convert.bufferToStream(convert.base64UrlToBuffer(base64Url)),

  binaryToBuffer: (binary) => Buffer.from(binary, "binary"),
  binaryToBase64: (binary) => Buffer.from(binary, "binary").toString("base64"),
  binaryToBase64Url: (binary) =>
    convert.bufferToBase64Url(Buffer.from(binary, "binary")),
  binaryToStream: (binary) =>
    convert.bufferToStream(Buffer.from(binary, "binary")),

  streamToBase64: async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString("base64");
  },
  streamToBase64Url: async (stream) =>
    convert.bufferToBase64Url(await convert.streamToBuffer(stream)),
  streamToBuffer: async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  },
  streamToBinary: async (stream) =>
    (await convert.streamToBuffer(stream)).toString("binary"),

  pathToBuffer: (filePath) =>
    fs.existsSync(filePath) ? fs.readFileSync(filePath) : null,
  pathToBase64: (filePath) =>
    convert.bufferToBase64(convert.pathToBuffer(filePath)),
  pathToBase64Url: (filePath) =>
    convert.bufferToBase64Url(convert.pathToBuffer(filePath)),
  pathToBinary: (filePath) => convert.pathToBuffer(filePath).toString("binary"),
  pathToStream: (filePath) =>
    fs.existsSync(filePath) ? fs.createReadStream(filePath) : null,

  urlToBuffer: async (url) => {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  },
  urlToBase64: async (url) =>
    convert.bufferToBase64(await convert.urlToBuffer(url)),
  urlToBase64Url: async (url) =>
    convert.bufferToBase64Url(await convert.urlToBuffer(url)),
  urlToBinary: async (url) =>
    (await convert.urlToBuffer(url)).toString("binary"),
  urlToStream: async (url) => {
    const response = await axios.get(url, { responseType: "stream" });
    return response.data;
  },
};

// Fungsi untuk mendapatkan info media
async function infoMedia(data, options) {
  let result;

  switch (options.type) {
    case "bufferToBase64":
      result = convert.bufferToBase64(data);
      break;
    case "bufferToBase64Url":
      result = convert.bufferToBase64Url(data);
      break;
    case "bufferToBinary":
      result = convert.bufferToBinary(data);
      break;
    case "bufferToStream":
      result = convert.bufferToStream(data);
      break;

    case "base64ToBuffer":
      result = convert.base64ToBuffer(data);
      break;
    case "base64ToBase64Url":
      result = convert.base64ToBase64Url(data);
      break;
    case "base64ToBinary":
      result = convert.base64ToBinary(data);
      break;
    case "base64ToStream":
      result = convert.base64ToStream(data);
      break;

    case "base64UrlToBuffer":
      result = convert.base64UrlToBuffer(data);
      break;
    case "base64UrlToBase64":
      result = convert.base64UrlToBase64(data);
      break;
    case "base64UrlToBinary":
      result = convert.base64UrlToBinary(data);
      break;
    case "base64UrlToStream":
      result = convert.base64UrlToStream(data);
      break;

    case "binaryToBuffer":
      result = convert.binaryToBuffer(data);
      break;
    case "binaryToBase64":
      result = convert.binaryToBase64(data);
      break;
    case "binaryToBase64Url":
      result = convert.binaryToBase64Url(data);
      break;
    case "binaryToStream":
      result = convert.binaryToStream(data);
      break;

    case "streamToBase64":
      result = await convert.streamToBase64(data);
      break;
    case "streamToBase64Url":
      result = await convert.streamToBase64Url(data);
      break;
    case "streamToBuffer":
      result = await convert.streamToBuffer(data);
      break;
    case "streamToBinary":
      result = await convert.streamToBinary(data);
      break;

    case "pathToBuffer":
      result = convert.pathToBuffer(data);
      if (!result)
        throw new Error("File not found at the given path.");
      options.filename = options.filename || path.basename(data);
      break;
    case "pathToBase64":
      result = convert.pathToBase64(data);
      if (!result)
        throw new Error("File not found at the given path.");
      options.filename = options.filename || path.basename(data);
      break;
    case "pathToBase64Url":
      result = convert.pathToBase64Url(data);
      if (!result)
        throw new Error("File not found at the given path.");
      options.filename = options.filename || path.basename(data);
      break;
    case "pathToBinary":
      result = convert.pathToBinary(data);
      if (!result)
        throw new Error("File not found at the given path.");
      options.filename = options.filename || path.basename(data);
      break;
    case "pathToStream":
      result = convert.pathToStream(data);
      if (!result)
        throw new Error("File not found at the given path.");
      options.filename = options.filename || path.basename(data);
      break;

    case "urlToBuffer":
      result = await convert.urlToBuffer(data);
      break;
    case "urlToBase64":
      result = await convert.urlToBase64(data);
      break;
    case "urlToBase64Url":
      result = await convert.urlToBase64Url(data);
      break;
    case "urlToBinary":
      result = await convert.urlToBinary(data);
      break;
    case "urlToStream":
      result = await convert.urlToStream(data);
      break;

    default:
      throw new Error(`Unknown conversion type: ${options.type}`);
  }

  // Menentukan mimetype, ukuran file, dan ekstensi
  const bufferResult = Buffer.isBuffer(result)
    ? result
    : result?.match(/^data:(.+);base64,(.+)$/)?.[2]
      ? Buffer.from(result?.match(/^data:(.+);base64,(.+)$/)[2], "base64")
      : Buffer.from(result, "base64");
  const size = bufferResult.length;
  let mimetype, ext;

  // Deteksi tipe file dari buffer atau nama file
  if (options.filename) {
    ext = path.extname(options.filename);
    mimetype = mime.lookup(ext) || "application/octet-stream";
  } else if (Buffer.isBuffer(bufferResult)) {
    const fileInfo = await fileType.fromBuffer(bufferResult);
    mimetype = fileInfo ? fileInfo.mime : "application/octet-stream";
    ext = fileInfo ? `${fileInfo.ext}` : "bin";
    options.filename = options.filename || `${Date.now()}.${fileInfo}`;
  }

  if (options.saveFilePath && result) {
    if (Buffer.isBuffer(result) || typeof result === "string") {
      fs.writeFileSync(options.saveFilePath, result);
    } else if (result.pipe) {
      const writeStream = fs.createWriteStream(options.saveFilePath);
      result.pipe(writeStream);
    }
  }
  return {
    file_name: options.filename,
    file_size: size,
    file_mime: mimetype,
    file_type: options.type,
    file_ext: ext,
    file_data: result,
  };
}

module.exports = infoMedia;