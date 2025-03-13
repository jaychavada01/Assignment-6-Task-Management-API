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

    //? Task Validation Rules
    CREATE_TASK: {
      title: "required|string|min:3|max:100",
      description: "string|max:500",
      dueDate: "required|date",
      priority: "required|string|in:High,Medium,Low",
      category: "required|string|in:Work,Personal",
    },

    UPDATE_TASK: {
      title: "string|min:3|max:100",
      description: "string|max:500",
      dueDate: "date",
      priority: "string|in:High,Medium,Low",
      status: "string|in:todo,inprocess,inreview,testing,Completed",
      category: "string|in:Work,Personal",
    },
  },
};
