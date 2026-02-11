import { z } from 'zod';
import { generateNamesRequestSchema } from './schema';

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
  names: {
    generate: {
      method: 'POST' as const,
      path: '/api/names/generate' as const,
      input: generateNamesRequestSchema,
      responses: {
        200: z.object({
          results: z.array(z.object({
            name: z.string(),
            available: z.boolean(),
          })),
        }),
        403: errorSchemas.forbidden,
        400: errorSchemas.validation,
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
