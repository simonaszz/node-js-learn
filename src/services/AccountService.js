const User = require('../models/user');

class AccountService {
  async getProfile(userId) {
    const userDoc = await User.findById(userId).lean();
    if (!userDoc) return null;
    return {
      id: userDoc._id.toString(),
      email: userDoc.email,
      firstName: userDoc.firstName || '',
      lastName: userDoc.lastName || '',
      phone: userDoc.phone || ''
    };
  }

  async updateProfile(userId, { firstName, lastName, phone }) {
    const userDoc = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone },
      { new: true }
    ).lean();
    if (!userDoc) return null;
    return {
      id: userDoc._id.toString(),
      email: userDoc.email,
      firstName: userDoc.firstName || '',
      lastName: userDoc.lastName || '',
      phone: userDoc.phone || ''
    };
  }
}

module.exports = { AccountService };
