import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    cookies: Record<string, string | undefined>;
    user?: {
      userId: string;
      email: string;
      isVerified: boolean;
      role: string;
    };
  }

  interface FastifyReply {
    setCookie(
      name: string,
      value: string,
      options: {
        domain?: string;
        path?: string;
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: boolean | 'lax' | 'strict' | 'none';
        maxAge?: number;
        expires?: Date;
        signed?: boolean;
      },
    ): FastifyReply;
    clearCookie(
      name: string,
      options?: { path?: string; domain?: string },
    ): FastifyReply;
  }
}
