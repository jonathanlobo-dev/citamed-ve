/**
 * Payment Model - CITAMED.VE
 * M05 / Semana 8 - Registro y validación de cobros con recibo verificable
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'appointment_id',
      references: {
        model: 'appointments',
        key: 'id'
      }
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    amountUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'amount_usd',
      get() {
        const v = this.getDataValue('amountUsd');
        return v === null ? null : Number(v);
      }
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      field: 'exchange_rate',
      get() {
        const v = this.getDataValue('exchangeRate');
        return v === null ? null : Number(v);
      }
    },
    amountVes: {
      type: DataTypes.DECIMAL(16, 2),
      allowNull: true,
      field: 'amount_ves',
      get() {
        const v = this.getDataValue('amountVes');
        return v === null ? null : Number(v);
      }
    },
    method: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['pago_movil', 'transferencia', 'zelle', 'efectivo_usd', 'efectivo_ves']]
      }
    },
    reference: {
      type: DataTypes.STRING(60),
      allowNull: true
    },
    payerBank: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: 'payer_bank'
    },
    payerNote: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'payer_note'
    },
    status: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'reported',
      validate: {
        isIn: [['reported', 'approved', 'rejected', 'voided']]
      }
    },
    reportedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reported_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reportedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'reported_at'
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at'
    },
    reviewNote: {
      type: DataTypes.STRING(300),
      allowNull: true,
      field: 'review_note'
    },
    verificationCode: {
      type: DataTypes.STRING(16),
      unique: true,
      allowNull: true,
      field: 'verification_code'
    },
    receiptNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true,
      field: 'receipt_number'
    },
    idempotencyKey: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      field: 'idempotency_key'
    }
  }, {
    tableName: 'payments',
    underscored: true,
    timestamps: true
  });

  /**
   * Genera el siguiente número correlativo de recibo anual con bloqueo transaccional.
   * Patrón: REC-YYYY-000001 (pg_advisory_xact_lock(7002))
   */
  Payment.nextReceiptNumber = async function(transaction) {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    if (transaction) {
      await sequelize.query('SELECT pg_advisory_xact_lock(7002)', { transaction });
    }
    const [rows] = await sequelize.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM '[0-9]+$') AS INTEGER)), 0) AS n
       FROM payments WHERE receipt_number LIKE :prefix`,
      { replacements: { prefix: `${prefix}%` }, transaction }
    );
    const nextNum = Number(rows[0]?.n || 0) + 1;
    return `${prefix}${String(nextNum).padStart(6, '0')}`;
  };

  return Payment;
};
