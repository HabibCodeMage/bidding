import { io, Socket } from 'socket.io-client';

export interface BidUpdate {
  bid: {
    id: number;
    userId: number;
    auctionId: number;
    amount: number;
    createdAt: string;
    isWinningBid: boolean;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  auctionId: number;
  newHighestBid: number;
}

export interface AuctionUpdate {
  id: number;
  itemId: number;
  startTime: string;
  endTime: string;
  currentHighestBid: number;
  isActive: boolean;
  item?: {
    id: number;
    name: string;
    description: string;
    startingPrice: number;
  };
  bids?: Array<{
    id: number;
    userId: number;
    auctionId: number;
    amount: number;
    createdAt: string;
    isWinningBid: boolean;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
}

export interface AuctionEnd {
  auctionId: number;
  winningBid: {
    id: number;
    userId: number;
    auctionId: number;
    amount: number;
    createdAt: string;
    isWinningBid: boolean;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export interface AuctionCreated {
  id: number;
  itemId: number;
  startTime: string;
  endTime: string;
  currentHighestBid: number;
  isActive: boolean;
  item?: {
    id: number;
    name: string;
    description: string;
    startingPrice: number;
  };
}

export default class WebSocketService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    this.serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl);

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinAuction(auctionId: number): void {
    if (this.socket) {
      this.socket.emit('joinAuction', auctionId);
    }
  }

  leaveAuction(auctionId: number): void {
    if (this.socket) {
      this.socket.emit('leaveAuction', auctionId);
    }
  }

  joinDashboard(): void {
    if (this.socket) {
      this.socket.emit('joinDashboard');
    }
  }

  leaveDashboard(): void {
    if (this.socket) {
      this.socket.emit('leaveDashboard');
    }
  }

  placeBid(bidData: { userId: number; auctionId: number; amount: number }): void {
    if (this.socket) {
      this.socket.emit('placeBid', bidData);
    }
  }

  onBidPlaced(callback: (data: BidUpdate) => void): void {
    if (this.socket) {
      this.socket.on('bidPlaced', callback);
    }
  }

  onAuctionUpdated(callback: (data: AuctionUpdate) => void): void {
    if (this.socket) {
      this.socket.on('auctionUpdated', callback);
    }
  }

  onAuctionEnded(callback: (data: AuctionEnd) => void): void {
    if (this.socket) {
      this.socket.on('auctionEnded', callback);
    }
  }

  onAuctionCreated(callback: (data: AuctionCreated) => void): void {
    if (this.socket) {
      this.socket.on('auctionCreated', callback);
    }
  }

  onBidSuccess(callback: (data: { message: string; bid: any }) => void): void {
    if (this.socket) {
      this.socket.on('bidSuccess', callback);
    }
  }

  onBidError(callback: (data: { message: string; auctionId: number }) => void): void {
    if (this.socket) {
      this.socket.on('bidError', callback);
    }
  }

  offBidPlaced(): void {
    if (this.socket) {
      this.socket.off('bidPlaced');
    }
  }

  offAuctionUpdated(): void {
    if (this.socket) {
      this.socket.off('auctionUpdated');
    }
  }

  offAuctionEnded(): void {
    if (this.socket) {
      this.socket.off('auctionEnded');
    }
  }

  offAuctionCreated(): void {
    if (this.socket) {
      this.socket.off('auctionCreated');
    }
  }

  offBidSuccess(): void {
    if (this.socket) {
      this.socket.off('bidSuccess');
    }
  }

  offBidError(): void {
    if (this.socket) {
      this.socket.off('bidError');
    }
  }
} 