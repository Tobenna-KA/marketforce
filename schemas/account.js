import { DataTypes } from "sequelize";

export const AccountSchema = {
    accountNumber: {
        type: DataTypes.INTEGER,
        unique: true
    },
    balance: DataTypes.FLOAT,
    phoneNumber: {
        type: DataTypes.STRING,
        unique: true
    },
}