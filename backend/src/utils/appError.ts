class AppError extends Error {
    public httpCode: number;
  
    constructor(httpCode: number, message: string) {
      super(message);
      this.httpCode = httpCode;
      Object.setPrototypeOf(this, new.target.prototype);
      Error.captureStackTrace(this);
    }
  }
  
  export default AppError;