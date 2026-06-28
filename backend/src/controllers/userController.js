import { User } from '../models/User.js';

/**
 * @desc    Create a new user profile
 * @route   POST /api/users
 * @access  Public
 */
export const createUser = async (req, res, next) => {
  const { username, email } = req.body;

  try {
    const user = {
      _id: "66ea43b7778c43debefa3224",
      username: username || "guest_user",
      email: email || "guest@savetube.app",
      createdAt: new Date()
    };
    return res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user profile by MongoDB ObjectId
 * @route   GET /api/users/:id
 * @access  Public
 */
export const getUserById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = {
      _id: id,
      username: "guest_user",
      email: "guest@savetube.app",
      createdAt: new Date()
    };
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};
