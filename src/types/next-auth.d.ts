import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
  }
}
