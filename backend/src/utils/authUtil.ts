import axios from "axios";
import { importJWK } from "jose";
import { getCognitoPublicKeysUrl } from "./awsUtil";
import { awsConfig } from "../configs/awsConfig";

export const getPublicKeyForToken = async (kid: string) => {
  try {
    const publicKeysUrl = getCognitoPublicKeysUrl(awsConfig.userPoolId, awsConfig.region);
    const { data } = await axios.get(publicKeysUrl);
    const publicKey = data.keys.find((key: any) => key.kid === kid);

    if (!publicKey) {
      throw new Error("❌ Invalid token: Key not found");
    }

    return importJWK(publicKey, "RS256");
  } catch (error) {
    console.error("❌ Error fetching public key:", error);
    throw new Error("❌ Failed to fetch public key");
  }
};