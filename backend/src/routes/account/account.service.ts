import axios from "axios";
import { importJWK } from "jose";
import { getCognitoPublicKeysUrl } from "../../utils/awsUtil";
import { awsConfig } from "../../configs/awsConfig";
import account from "../../models/account";

export const getUserById = async (accountID: string) => {
  return await account.findOne({
    where: { accountID },
    attributes: ["role", "firstName", "lastName", "email"],
  });
};


// export const getPublicKeyForToken = async (kid: string) => {
//   try {
//     const publicKeysUrl = getCognitoPublicKeysUrl(awsConfig.userPoolId, awsConfig.region);
//     const { data } = await axios.get(publicKeysUrl);
//     const publicKey = data.keys.find((key: any) => key.kid === kid);

//     if (!publicKey) {
//       throw new Error("❌ Invalid token: Key not found");
//     }

//     return importJWK(publicKey, "RS256");
//   } catch (error) {
//     console.error("❌ Error fetching public key:", error);
//     throw new Error("❌ Failed to fetch public key");
//   }
// };

export const getCognitoErrorMessage = (error: any): string => {
    console.error("❌ Cognito Error:", error);
  
    switch (error.name) {
      case "NotAuthorizedException":
        return "❌ Incorrect username or password";
      case "UserNotFoundException":
        return "❌ User does not exist";
      case "UserNotConfirmedException":
        return "❌ User is not confirmed. Please check your email.";
      case "PasswordResetRequiredException":
        return "❌ Password reset is required.";
      default:
        return "❌ Login failed";
    }
  };