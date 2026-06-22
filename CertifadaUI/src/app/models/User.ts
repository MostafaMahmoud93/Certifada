export interface TokenModel {
    token: string;
    expiration: string;
    userId: string | null;
    isAdmin: boolean | null;
    userActions: string[];
}