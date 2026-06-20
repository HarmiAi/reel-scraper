import { User } from '../models/User.js';

/**
 * @desc    Create a new user profile
 * @route   POST /api/users
 * @access  Public
 */
export const createUser = async (req, res, next) => {
  const { username, email } = req.body;

  try {
    const user = await User.create({ username, email });
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
    const user = await User.findById(id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};
