export interface Application {
  _id: string;
  name: string;
  identifier: string;
}

export interface Client {
  _id: string;
  name: string;
  email: string;
}

export interface User {
  _id: string;
  empCode: string;
  name: string;
  email: string;
  role: string;
}
