import { DataTypes } from "sequelize";

export const TransactionsSchema = {
    payer_account: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    transactions: {
        type: DataTypes.STRING,
        get: function() {
            return JSON.parse(this.getDataValue('transactions'));
        },
        set: function(val) {
            return this.setDataValue('transactions', JSON.stringify(val));
        }
    },
    idempotency_key: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lock_status: {
        type: DataTypes.STRING,
        defaultValue: 'LOCKED',
    },
    responseStatus: DataTypes.INTEGER
}