import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000", // URL do seu NestJS
  headers: {
    "Content-Type": "application/json",
  },
});
