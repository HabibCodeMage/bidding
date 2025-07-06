import ApiBase from "../common/ApiBase";

export interface CreateAuctionDto {
  itemId: number;
  startTime: string;
  endTime: string;
}

export interface Auction {
  id: number;
  itemId: number;
  startTime: string;
  endTime: string;
  currentHighestBid: number;
  isActive: boolean;
  item?: Item;
  bids?: Bid[];
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  startingPrice: number;
}

export interface Bid {
  id: number;
  userId: number;
  auctionId: number;
  amount: number;
  createdAt: string;
  isWinningBid: boolean;
  user?: User;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export default class Auctions extends ApiBase {
  async getAllAuctions(params?: PaginationParams): Promise<PaginatedResponse<Auction>> {
    const response = await this.axios.get('/auctions', { params });
    return response.data;
  }

  async getActiveAuctions(params?: PaginationParams): Promise<PaginatedResponse<Auction>> {
    const response = await this.axios.get('/auctions/active', { params });
    return response.data;
  }

  async getEndedAuctions(params?: PaginationParams): Promise<PaginatedResponse<Auction>> {
    const response = await this.axios.get('/auctions/ended', { params });
    return response.data;
  }

  async getAuction(id: number): Promise<Auction> {
    const response = await this.axios.get(`/auctions/${id}`);
    return response.data;
  }

  async createAuction(auctionData: CreateAuctionDto): Promise<Auction> {
    const response = await this.axios.post('/auctions', auctionData);
    return response.data;
  }

  async getCurrentHighestBid(auctionId: number): Promise<{ currentHighestBid: number }> {
    const response = await this.axios.get(`/auctions/${auctionId}/highest-bid`);
    return response.data;
  }
} 