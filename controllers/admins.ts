import asyncHandler from "../middlewares/asyncHandler";
import prisma from "../prisma/client";
import errorObj, {
  errorTypes,
  invalidEmail,
  incorrectCredentialsError,
} from "../utils/errorObject";
import ErrorResponse from "../utils/errorResponse";
import { ExtendedRequest } from "../utils/extendedRequest";
import {
  checkRequiredFields,
  comparePassword,
  generateToken,
  hashPassword,
  validateEmail,
} from "../utils/helperFunctions";

/**
 * Create admin
 * @route   POST /api/v1/admins
 * @access  Private (superadmin)
 */
export const createAdmin = asyncHandler(async (req, res, next) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const role = req.body.role;

  // Check required fields
  const requiredFields = { username, email, password };
  const hasError = checkRequiredFields(requiredFields, next);
  if (hasError !== false) return hasError;

  // Validate Email
  const validEmail = validateEmail(email);
  if (!validEmail) return next(new ErrorResponse(invalidEmail, 400));

  // Hash plain password
  const hashedPassword = await hashPassword(password);

  // Check role is either SUPERADMIN, ADMIN or MODERATOR
  const allowedRoles = ["SUPERADMIN", "ADMIN", "MODERATOR"];
  if (role && !allowedRoles.includes(role)) {
    const roleError = errorObj(
      400,
      errorTypes.invalidArgument,
      "role type is not valid",
      [
        {
          code: "invalidRole",
          message: "role must be one of 'SUPERADMIN', 'ADMIN', and 'MODERATOR'",
        },
      ]
    );
    return next(new ErrorResponse(roleError, 400));
  }

  const admin = await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      username,
      role,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      username,
      email,
      password,
    },
  });
});

/**
 * Login admin
 * @route   POST /api/v1/admins/login
 * @access  PUBLIC
 */
export const loginAdmin = asyncHandler(async (req, res, next) => {
  const email: string | undefined = req.body.email;
  const password: string | undefined = req.body.password;

  // Throws error if required fields not specify
  const requiredFields = { email, password };
  const hasError = checkRequiredFields(requiredFields, next);
  if (hasError !== false) return hasError;

  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  // Throws error if email is incorrect
  if (!admin) {
    return next(new ErrorResponse(incorrectCredentialsError, 401));
  }

  // Check pwd with hashed pwd stored in db
  const result = await comparePassword(password as string, admin.password);

  // Throws error if password is incorrect
  if (!result) {
    return next(new ErrorResponse(incorrectCredentialsError, 401));
  }

  // Generate a jwt
  const token = generateToken(admin.id, admin.email);

  res.status(200).json({
    success: true,
    token,
  });
});

/**
 * Get current logged-in admin
 * @route   GET /api/v1/admins/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: ExtendedRequest, res, next) => {
  const user = await prisma.admin.findUnique({
    where: { id: req!.admin!.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});
