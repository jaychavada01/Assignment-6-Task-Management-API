const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Task = require("./task");
const User = require("./user");

const Comment = sequelize.define("Comment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Task,
      key: "id",
    },
    onDelete: "CASCADE",
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

Task.hasMany(Comment, { foreignKey: "taskId", onDelete: "CASCADE" });
Comment.belongsTo(Task, { foreignKey: "taskId"})

User.hasMany(Comment, { foreignKey: "userId", onDelete: "CASCADE" });
Comment.belongsTo(User, { foreignKey: "userId"})

module.exports = Comment