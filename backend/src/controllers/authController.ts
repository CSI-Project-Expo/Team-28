import { User } from '../models/User';

export async function login(username: string, password: string) {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw { status: 401, message: 'Invalid username or password' };
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw { status: 401, message: 'Invalid username or password' };
    }
    return user;
  } catch (error: any) {
    if (error.status) {
      throw error;
    } else {
      throw { status: 500, message: 'Internal server error' };
    }
  }
}