import { z } from 'zod';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  config: {
    get: {
      method: 'GET' as const,
      path: '/api/config' as const,
      responses: {
        200: z.object({
          favicon: z.string().nullable(),
          logo: z.string().nullable(),
        }),
      },
    },
  },
  ip: {
    get: {
      method: 'GET' as const,
      path: '/api/ip' as const,
      responses: {
        200: z.object({ 
          ip: z.string(), 
          isAllowed: z.boolean(),
          ips: z.array(z.object({
            address: z.string(),
            type: z.string(),
          })),
          version: z.number().nullable().optional(),
          hostname: z.string().nullable().optional(),
          country: z.string().nullable().optional(),
          countryCode: z.string().nullable().optional(),
          asn: z.number().nullable().optional(),
          org: z.string().nullable().optional(),
          userAgent: z.string().optional(),
        }),
      },
    },
  },
  server: {
    get: {
      method: 'GET' as const,
      path: '/api/server-ip' as const,
      responses: {
        200: z.object({
          outboundIp: z.string().nullable(),
          ips: z.array(z.object({
            address: z.string(),
            type: z.string(),
            interface: z.string(),
          })),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
