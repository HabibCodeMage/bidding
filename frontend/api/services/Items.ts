import ApiBase from "../common/ApiBase";

export interface CreateItemDto {
  name: string;
  description: string;
  startingPrice: number;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  startingPrice: number;
}

export default class Items extends ApiBase {
  async getAllItems(): Promise<Item[]> {
    const response = await this.axios.get('/items');
    return response.data;
  }

  async getItem(id: number): Promise<Item> {
    const response = await this.axios.get(`/items/${id}`);
    return response.data;
  }

  async createItem(itemData: CreateItemDto): Promise<Item> {
    const response = await this.axios.post('/items', itemData);
    return response.data;
  }
} 