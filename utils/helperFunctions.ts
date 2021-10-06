import jwt from "jsonwebtoken";
import { NextFunction } from "express";
import {
  invalidArgDetail,
  invalidArgError,
  ErrorDetailType,
} from "./errorObject";
import ErrorResponse from "./errorResponse";

type OrderType = { [key: string]: string };
type FilteredType = { [key: string]: number };

/**
 * Receive comma seperated string and return { string: true }
 * @param query - comma seperated string
 * @returns object { string: true, string: true }
 * @example 'name,price,stock' => { name: true, price: true, stock: true }
 */
export const selectedQuery = (query: string) =>
  query.split(",").reduce((a, v) => ({ ...a, [v.trim()]: true }), {});

/**
 * Receive string and return array of { key: value } pairs
 * @param query - query string
 * @returns array of object [ {key:value}, etc]
 * @example 'price.desc,name' => [ { price: 'desc' }, { name: 'asc' } ]
 */
export const orderedQuery = (query: string) => {
  let orderArray: OrderType[] = [];
  const sortLists = query.split(",");
  sortLists.forEach((sl) => {
    const obj: OrderType = {};

    const fields = sl.split(".");
    obj[fields[0]] = fields[1] || "asc";
    orderArray = [...orderArray, obj];
  });
  return orderArray;
};

/**
 * Receive string or string[] and return array of { key: value } pairs
 * @param query - query string or string[]
 * @returns array of object [ {key: value}, etc ]
 * @example ['gte:50','lt:100'] => [ { gte: 50 }, { lt: 100 } ]
 * @example 'gte:50' => [ { gte: 50 } ]
 */
export const filteredQty = (query: string | string[]) => {
  const obj: FilteredType = {};
  const obj2: FilteredType = {};
  let filteredValue: FilteredType[] = [];
  if (typeof query === "string") {
    const fields = query.split(":");
    obj[fields[0]] = parseFloat(fields[1]);
    filteredValue = [...filteredValue, obj];
  }
  if (typeof query === "object") {
    const fields = (query as string[])[0].split(":");
    obj[fields[0]] = parseFloat(fields[1]);
    filteredValue = [...filteredValue, obj];

    const fields2 = (query as string[])[1].split(":");
    obj2[fields2[0]] = parseFloat(fields2[1]);
    filteredValue = [...filteredValue, obj2];
  }
  return filteredValue;
};

/**
 * Check required fields
 * @param requiredObj - required fields as an object
 * @param next - express next function
 * @returns false (hasError) | ErrorResponse
 */
export const checkRequiredFields = (
  requiredObj: { [key: string]: string | undefined },
  next: NextFunction
) => {
  let errorArray: ErrorDetailType[] = [];
  for (const field in requiredObj) {
    if (!requiredObj[field]) {
      errorArray = [...errorArray, invalidArgDetail(field)];
    }
  }
  if (errorArray.length === 0) {
    return false;
  } else {
    return next(new ErrorResponse(invalidArgError(errorArray), 400));
  }
};

/**
 * Check if a number is positive integer
 * @param num - number to be checked
 * @returns true | false
 */
export const isIntegerAndPositive = (num: number) => num % 1 === 0 && num > 0;

/**
 * Check email is valid
 * @param email - email to be checked
 * @returns true | false
 */
export const validateEmail = (email: string) => {
  const emailRegex =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  return emailRegex.test(String(email).toLowerCase());
};

/**
 * Generate JsonWebToken
 * @param {number} id - User ID
 * @param {string} email - User Email
 * @returns jwt
 */
export const generateToken = (id: number, email: string) =>
  jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000) - 30,
      id,
      email,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );