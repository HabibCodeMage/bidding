import ApiBase from "../common/ApiBase";

export interface PlaceBidDto {
  userId: number;
  auctionId: number;
  amount: number;
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

export default class Bids extends ApiBase {
  async placeBid(bidData: PlaceBidDto): Promise<Bid> {
    const response = await this.axios.post('/bids', bidData);
    return response.data;
  }

  async getAuctionBids(auctionId: number): Promise<Bid[]> {
    const response = await this.axios.get(`/bids/auction/${auctionId}`);
    return response.data;
  }

  async getBidHistory(auctionId: number): Promise<Bid[]> {
    const response = await this.axios.get(`/bids/auction/${auctionId}/history`);
    return response.data;
  }

  async getWinningBid(auctionId: number): Promise<Bid | null> {
    const response = await this.axios.get(`/bids/auction/${auctionId}/winning`);
    return response.data;
  }

  async getUserBids(userId: number): Promise<Bid[]> {
    const response = await this.axios.get(`/bids/user/${userId}`);
    return response.data;
  }
} 