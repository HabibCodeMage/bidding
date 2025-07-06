import { AxiosInstance } from "axios";

export default class ApiBase {
  axios: AxiosInstance;
  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }
}
