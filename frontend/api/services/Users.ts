import ApiBase from "../common/ApiBase";

export interface User {
  id: number;
  name: string;
  email: string;
}

export default class Users extends ApiBase {
  async getAllUsers(): Promise<User[]> {
    const response = await this.axios.get('/users');
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await this.axios.get(`/users/${id}`);
    return response.data;
  }
} 