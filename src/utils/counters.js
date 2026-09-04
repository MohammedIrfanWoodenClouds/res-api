const Counter = require('../models/Counter');

async function nextSequence(tenantId, key) {
  const doc = await Counter.findOneAndUpdate(
    { tenantId, key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
}

async function nextPadded(tenantId, key, width = 5) {
  const seq = await nextSequence(tenantId, key);
  return String(seq).padStart(width, '0');
}

async function nextInvoiceNumber(tenantId) {
  const seq = await nextPadded(tenantId, 'invoice');
  return `INV-${seq}`;
}

async function nextExpenseNumber(tenantId) {
  const seq = await nextPadded(tenantId, 'expense');
  return `EXP-${seq}`;
}

module.exports = {
  nextSequence,
  nextPadded,
  nextInvoiceNumber,
  nextExpenseNumber,
};
