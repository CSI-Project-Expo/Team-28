import { User } from '../models/User';

export async function login(username: string, password: string) {
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid username or password');
    }
    return user;
  } catch (error) {
    throw error;
  }
}
