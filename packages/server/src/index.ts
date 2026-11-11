export interface HealthResponse {
  status: 'ok';
  service: 'tipjar-server';
  version: string;
}

export function health(): HealthResponse {
  return { status: 'ok', service: 'tipjar-server', version: '0.1.0' };
}

export interface RequestLike {
  method?: string;
  url?: string;
  path?: string;
}

export interface ResponseLike {
  status(code: number): this;
  json(body: unknown): this;
}

export type RouteHandler = (req: RequestLike, res: ResponseLike) => void;

export interface RouterLike {
  get(path: string, handler: RouteHandler): void;
}

/**
 * Route handler for GET /health returning { status: 'ok' }
 */
export function healthRoute(_req: RequestLike, res: ResponseLike): void {
  res.status(200).json({ status: 'ok' });
}

/**
 * Registers basic health routes onto an Express router or app stub
 */
export function registerHealthRoutes(router: RouterLike): void {
  router.get('/health', healthRoute);
}

