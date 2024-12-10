import sodium from "sodium-native";
import fs from "fs";
import path from "path";
import os from "os";
import appConstant from "../appConstant";
import prisma from "@/lib/prisma";
import { Buffer } from "buffer";

export interface SecretsProvider {
  put(name: string, value: string): Promise<boolean>;
  get(name: string): Promise<string | undefined>;
}

const keyFormat = "base64";

export class SodiumSecretsProvider implements SecretsProvider {
  privateKey = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES);
  publicKey = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES);

  initKeyPair = () => {
    const homeDir = os.homedir();
    const dirPath = path.join(homeDir, appConstant.homeDirName);
    const keyFilePath = path.join(dirPath, "privKey");
    const pubKeyFilePath = path.join(dirPath, "pubKey");
    if (fs.existsSync(keyFilePath) && fs.existsSync(pubKeyFilePath)) {
      const privKey = fs.readFileSync(keyFilePath, { encoding: "utf-8" });
      const pubKey = fs.readFileSync(pubKeyFilePath, { encoding: "utf-8" });
      this.privateKey = Buffer.from(Buffer.from(privKey, keyFormat), sodium.crypto_box_SECRETKEYBYTES);
      this.publicKey = Buffer.from(Buffer.from(pubKey, keyFormat), sodium.crypto_box_PUBLICKEYBYTES);
    } else {
      sodium.crypto_box_keypair(this.privateKey, this.publicKey);
      fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) {
          console.error("Error creating directory:", err);
          return;
        }
        console.log(`Directory created at: ${dirPath}`);

        fs.writeFile(keyFilePath, this.privateKey.toString(keyFormat), "utf8", (err) => {
          if (err) {
            console.error("Error writing to file:", err);
            return;
          }
          console.log(`Private Key written successfully at: ${keyFilePath}`);
        });

        fs.writeFile(pubKeyFilePath, this.publicKey.toString(keyFormat), "utf8", (err) => {
          if (err) {
            console.error("Error writing to file:", err);
            return;
          }
          console.log(`Public Key written successfully at: ${pubKeyFilePath}`);
        });
      });
    }
  };

  constructor() {
    this.initKeyPair();
  }
  async put(name: string, value: string): Promise<boolean> {
    try {
      const nonce = Buffer.alloc(sodium.crypto_box_NONCEBYTES);
      sodium.randombytes_buf(nonce);
      const messageBuffer = Buffer.from(value, "utf8");
      const encryptedMessage = Buffer.alloc(messageBuffer.length + sodium.crypto_box_MACBYTES);
      sodium.crypto_box_easy(encryptedMessage, messageBuffer, nonce, this.publicKey, this.privateKey);
      const dbSecret = encryptedMessage.toString(keyFormat);
      const dbNonce = nonce.toString(keyFormat);
      const existingSecret = await prisma.secretStore.findUnique({
        where: {
          name: name,
        },
      });

      if (existingSecret) {
        await prisma.secretStore.update({
          data: {
            secret: dbSecret,
            nonce: dbNonce,
          },
          where: {
            name: name,
          },
        });
      } else {
        await prisma.secretStore.create({
          data: {
            name: name,
            secret: dbSecret,
            nonce: dbNonce,
          },
        });
      }
      return true;
    } catch (e) {
      console.error(`Error while saving the secret: ${e}`);
      return false;
    }
  }

  async get(name: string): Promise<string | undefined> {
    try {
      const result = await prisma.secretStore.findUnique({
        where: {
          name: name,
        },
      });

      if (result) {
        const cipherText = Buffer.from(result.secret, keyFormat);
        const nonce = Buffer.from(result.nonce, keyFormat);
        const decryptedMessage = Buffer.alloc(cipherText.length - sodium.crypto_box_MACBYTES);
        sodium.crypto_box_open_easy(decryptedMessage, cipherText, nonce, this.publicKey, this.privateKey);
        return decryptedMessage.toString("utf-8");
      }
      return undefined;
    } catch (e) {
      console.error(`Error while getting the secret: ${e}`);
      return undefined;
    }
  }
}
