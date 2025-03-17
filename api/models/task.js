const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./user");

const Task = sequelize.define(
  "Task",
  {
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
      type: DataTypes.ENUM(
        "todo",
        "inprocess",
        "inreview",
        "testing",
        "completed"
      ),
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
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
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
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    timestamps: true, // Enables createdAt and updatedAt
    paranoid: true, // Enables soft delete (deletedAt)
  }
);

// Define relationships
User.hasMany(Task, { foreignKey: "userId", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "userId" });

Task.hasMany(Task, {
  as: "subtasks",
  foreignKey: "parentTaskId",
  onDelete: "CASCADE",
});
Task.belongsTo(Task, { as: "parentTask", foreignKey: "parentTaskId" });

module.exports = Task;
