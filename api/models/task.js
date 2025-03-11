const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/database");
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
    type: DataTypes.ENUM("pending", "completed"),
    allowNull: false,
    defaultValue: "pending",
  },
  category: {
    type: DataTypes.ENUM("Work", "Personal"),
    allowNull: false,
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
});

User.hasMany(Task, { foreignKey: "userId", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "userId" });

module.exports = Task;
