import { Request, Response, NextFunction } from 'express';
import { Account } from '../models/account'; 
import httpStatus from 'http-status';
import AppError from '../utils/appError';
import httpContext from 'express-http-context'


const currentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountID = httpContext.get('accountID')

    if (!accountID) {
      throw new AppError(httpStatus.UNAUTHORIZED, '❌ Unauthorized: Missing user ID');
    }

    const user = await Account.findOne({ where: { accountID } });

    if (!user) {
      throw new AppError(httpStatus.FORBIDDEN, '❌ Forbidden: User not found in out database');
    }

    res.locals.currentUser = user.dataValues; 
    next(); 
  } catch (error: any) {
    console.error('❌ Current User Error:', error);
    next(new AppError(httpStatus.FORBIDDEN, error.message || '❌ Forbidden: Invalid User'));
  }
};

export default currentUser;