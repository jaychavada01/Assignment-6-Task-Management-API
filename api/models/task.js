const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./user");

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM("High", "Medium", "Low"),
    allowNull: false,
    defaultValue: "Medium",
  },
  status: {
    type: DataTypes.ENUM("todo", "inprocess", "inreview", "testing", "Completed"),
    allowNull: true,
    defaultValue: "todo",
  },
  category: {
    type: DataTypes.ENUM("Work", "Personal"),
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  parentTaskId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "Tasks",
      key: "id",
    },
    onDelete: "CASCADE",
  },
});

// Define relationships
User.hasMany(Task, { foreignKey: "userId", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "userId" });

Task.hasMany(Task, { as: "subtasks", foreignKey: "parentTaskId", onDelete: "CASCADE" });
Task.belongsTo(Task, { as: "parentTask", foreignKey: "parentTaskId" });

module.exports = Task;