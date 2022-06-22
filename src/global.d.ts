interface IUserToken {}

declare namespace Express {
  export interface Request {
    user?: IUserToken
  }
}