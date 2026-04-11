import { User } from '../models/User';

export async function login(username: string, password: string) {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return { status: 401, message: 'Invalid username or password' };
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return { status: 401, message: 'Invalid username or password' };
    }
    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    return { status: 500, message: 'Internal server error' };
  }
}