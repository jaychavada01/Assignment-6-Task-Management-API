module.exports = {
  //? HTTP Status Codes
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500,
  },
  //? Validation Rules
  VALIDATION_RULES: {
    SIGNUP: {
      fullName: "required|string|min:2",
      email: "required|email",
      password:
        "required|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/",
    },
    LOGIN: {
      email: "required|email",
      password: "required|string|min:8",
    },
    CHANGE_PASSWORD: {
      oldPassword: "required|string|min:8",
      newPassword:
        "required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/",
    },
    FORGET_PASSWORD: {
      email: "required|email",
    },
    RESET_PASSWORD: {
      token: "required|string",
      newPassword:
        "required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/",
    },
  },
};
