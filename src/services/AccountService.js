const User = require('../models/user');

class AccountService {
  async getProfile(userId) {
    const u = await User.findById(userId).lean();
    if (!u) return null;
    return {
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      phone: u.phone || ''
    };
  }

  async updateProfile(userId, { firstName, lastName, phone }) {
    const u = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone },
      { new: true }
    ).lean();
    if (!u) return null;
    return {
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      phone: u.phone || ''
    };
  }
}

module.exports = { AccountService };
