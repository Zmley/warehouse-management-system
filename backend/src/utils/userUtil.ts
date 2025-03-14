import User from "../models/account";

export const getUserByAccountID = async (accountID: string) => {
  return await User.findOne({
    where: { accountID },
    attributes: ["role", "firstName", "lastName", "email"],
  });
};