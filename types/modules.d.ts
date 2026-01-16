// Type declarations for packages without TypeScript definitions

declare module 'websocket-stream' {
  import { Server } from 'http';
  import { Duplex } from 'stream';

  function createServer(
    options: { server: Server },
    handler: (stream: Duplex) => void
  ): void;

  export = { createServer };
}

declare module 'aedes' {
  import { EventEmitter } from 'events';
  import { Duplex } from 'stream';

  interface AedesOptions {
    id?: string;
    concurrency?: number;
    heartbeatInterval?: number;
    connectTimeout?: number;
  }

  interface Client {
    id: string;
    clean: boolean;
    conn: Duplex;
  }

  interface Subscription {
    topic: string;
    qos: number;
  }

  interface Packet {
    topic: string;
    payload: Buffer;
    qos: number;
    retain: boolean;
  }

  class Aedes extends EventEmitter {
    id: string;
    handle: (stream: Duplex) => void;
    
    on(event: 'client', listener: (client: Client) => void): this;
    on(event: 'clientDisconnect', listener: (client: Client) => void): this;
    on(event: 'publish', listener: (packet: Packet, client: Client | null) => void): this;
    on(event: 'subscribe', listener: (subscriptions: Subscription[], client: Client) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  function createAedes(options?: AedesOptions): Aedes;

  export = createAedes;
  export { Aedes, Client, AedesOptions, Subscription, Packet };
}
