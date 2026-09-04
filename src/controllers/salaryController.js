const Employee = require('../models/Employee');
const SalaryPayment = require('../models/SalaryPayment');

async function listEmployees(req, res) {
  const items = await Employee.find({ tenantId: req.user.tenantId, isActive: true }).sort({
    name: 1,
  });
  res.json(items);
}

async function createEmployee(req, res) {
  const { name, phone, designation, monthlySalary, joiningDate } = req.body;
  if (!name || monthlySalary === undefined) {
    return res.status(400).json({ message: 'name and monthlySalary are required' });
  }
  const emp = await Employee.create({
    tenantId: req.user.tenantId,
    name,
    phone: phone || '',
    designation: designation || '',
    monthlySalary: Number(monthlySalary),
    joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
  });
  res.status(201).json(emp);
}

async function updateEmployee(req, res) {
  const emp = await Employee.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!emp) return res.status(404).json({ message: 'Employee not found' });
  const { name, phone, designation, monthlySalary, joiningDate, isActive } = req.body;
  if (name) emp.name = name;
  if (phone !== undefined) emp.phone = phone;
  if (designation !== undefined) emp.designation = designation;
  if (monthlySalary !== undefined) emp.monthlySalary = Number(monthlySalary);
  if (joiningDate) emp.joiningDate = new Date(joiningDate);
  if (isActive !== undefined) emp.isActive = !!isActive;
  await emp.save();
  res.json(emp);
}

async function deactivateEmployee(req, res) {
  const emp = await Employee.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!emp) return res.status(404).json({ message: 'Employee not found' });
  emp.isActive = false;
  await emp.save();
  res.json({ message: 'Employee deactivated' });
}

async function listSalaries(req, res) {
  const items = await SalaryPayment.find({ tenantId: req.user.tenantId, status: 'ACTIVE' }).sort({
    paymentDate: -1,
  });
  res.json(items);
}

async function createSalary(req, res) {
  const { employeeId, month, salary, paid, paymentDate, paymentMethod } = req.body;
  if (!employeeId || !month || salary === undefined || paid === undefined || !paymentDate) {
    return res
      .status(400)
      .json({ message: 'employeeId, month, salary, paid and paymentDate are required' });
  }
  const emp = await Employee.findOne({
    _id: employeeId,
    tenantId: req.user.tenantId,
    isActive: true,
  });
  if (!emp) return res.status(400).json({ message: 'Invalid employee' });

  const payment = await SalaryPayment.create({
    tenantId: req.user.tenantId,
    employeeId: emp._id,
    employeeName: emp.name,
    month,
    salary: Number(salary),
    paid: Number(paid),
    paymentDate: new Date(paymentDate),
    paymentMethod: paymentMethod || 'Bank',
  });
  res.status(201).json(payment);
}

async function cancelSalary(req, res) {
  const payment = await SalaryPayment.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!payment) return res.status(404).json({ message: 'Salary payment not found' });
  payment.status = 'CANCELLED';
  payment.cancelledBy = req.user.userId;
  payment.cancelledAt = new Date();
  payment.cancelReason = req.body.cancelReason || '';
  await payment.save();
  res.json(payment);
}

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  listSalaries,
  createSalary,
  cancelSalary,
};
