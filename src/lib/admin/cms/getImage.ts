import appConstant from "@/services/appConstant";
import { NextApiResponse } from "next";
import path from "path";
import os from "os";
import fs from "fs";
import { IncomingMessage, ServerResponse } from "http";

const getImage = (res: ServerResponse<IncomingMessage>, imageName: string) => {
  const filePath = path.join(os.homedir(), `${appConstant.homeDirName}/static/${imageName}`);

  const file = fs.readFileSync(filePath);
  return file;
};

export default getImage;
