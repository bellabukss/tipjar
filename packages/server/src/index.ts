interface HealthResponse {
  status: 'ok';
  service: 'tipjar-server';
  version: string;
}

export function health(): HealthResponse {
  return { status: 'ok', service: 'tipjar-server', version: '0.1.0' };
}
