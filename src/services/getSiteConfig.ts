import { deepMerge } from "@/lib/utils";
import { DEEP_OBJECT_KEYS, DEFAULT_THEME, PageSiteConfig } from "./siteConstant";
import fs from "fs";
import YAML from "yaml";

export const getSiteConfig = () => {
  try {
    const file = fs.readFileSync("./siteConfig.yaml", "utf8");
    const config = YAML.parse(file);

    let configData = {
      ...DEFAULT_THEME,
      ...(config &&
        Object.fromEntries(
          Object.entries(config).map(([key, userValue]) => [
            key,
            DEEP_OBJECT_KEYS.includes(key) && typeof userValue === "object" && userValue !== null
              ? deepMerge(DEFAULT_THEME[key as keyof PageSiteConfig], userValue)
              : userValue !== undefined && userValue !== null
              ? userValue
              : DEFAULT_THEME[key as keyof PageSiteConfig],
          ])
        )),
    };

    return configData;
  } catch (error) {
    console.log(error);
  }
};
