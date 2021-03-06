// import dotenv from 'dotenv';
import webSocket from 'ws';
import nodes from './initialize';

// dotenv.config();

// const { P2P_PORT, PEERS } = process.env;
// const peers = PEERS ? PEERS.split(',') : [];

const MESSAGE = {
  BLOCKS: 'blocks',
  TX: 'transactions',
  WIPE: 'wipe_memory-pool',
};

class P2PService {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.sockets = [];
  }

  listen(peerPort) {
    const server = new webSocket.Server({ port: peerPort });
    server.on('connection', (socket) => this.onConnection(socket));
    // nodes.shift();
    nodes.forEach(({ PEER }) => {
      // eslint-disable-next-line new-cap
      const socket = new webSocket(`ws:localhost:${PEER}`);
      socket.on('open', () => this.onConnection(socket));
    });
    console.log(`server ws in ${peerPort}`);
  }

  onConnection(socket) {
    const { blockchain } = this;
    this.sockets.push(socket);
    socket.on('message', (message) => {
      const { type, value } = JSON.parse(message);
      try {
        if (type === MESSAGE.BLOCKS) blockchain.replace(value);
        else if (type === MESSAGE.TX) blockchain.memoryPool.addOrUpdate(value);
        else if (type === MESSAGE.WIPE) blockchain.memoryPool.wipe();
      } catch (err) {
        throw Error(err);
      }
    });
    socket.send(JSON.stringify({ type: MESSAGE.BLOCKS, value: blockchain.blocks }));
  }

  sync() {
    const { blockchain: { blocks } } = this;
    this.broadcast(MESSAGE.BLOCKS, blocks);
  }

  broadcast(type, value) {
    console.log(`[ws:broadcast] ${type}...`);
    const message = JSON.stringify({ type, value });
    this.sockets.forEach((socket) => socket.send(message));
  }
}

export { MESSAGE };
export default P2PService;
