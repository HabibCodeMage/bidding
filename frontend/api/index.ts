import axios, { AxiosInstance } from "axios";
import Auctions from "./services/Auctions";
import Items from "./services/Items";
import Bids from "./services/Bids";
import WebSocketService from "./services/WebSocket";
import Users from "./services/Users";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class Api {
  axios: AxiosInstance;
  token: string | undefined;
  auctions: Auctions;
  items: Items;
  bids: Bids;
  users: Users;
  ws: WebSocketService;

  constructor() {
    this.axios = axios.create({
      baseURL: `${BACKEND_BASE_URL}`,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.auctions = new Auctions(this.axios);
    this.items = new Items(this.axios);
    this.bids = new Bids(this.axios);
    this.users = new Users(this.axios);
    this.ws = new WebSocketService();
  }
}

const api = new Api();
export default api;
