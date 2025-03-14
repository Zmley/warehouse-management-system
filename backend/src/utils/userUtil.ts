import account from "../models/account";

export const getUserByAccountID = async (accountID: string) => {
  return await account.findOne({
    where: { accountID },
    attributes: ["role", "firstName", "lastName", "email"],
  });
};