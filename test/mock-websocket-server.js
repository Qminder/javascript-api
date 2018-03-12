/**
 * A simple websocket mock server.
 * Sends all received events from 8123 to 8124, and all received from 8124 to 8123*.
 * 8124 can send a message with the body DROP!, which will cause the 8123 connection to drop.
 */

const WebSocket = require('ws');
class MockWebsocketServer {
  constructor() {
    this.server = new WebSocket.Server( { port: 8123 });
    this.controlServer = new WebSocket.Server( { port: 8124 });

    const connHandler = new ConnectionHandler();
    const controlHandler = new ControlHandler();

    this.server.on('connection', function connection(sock) {
      console.log('\x1b[33m   main |\x1b[0m Client attached!');
      connHandler.setSocket(sock);
      controlHandler.setClientSocket(sock);
    });

    this.controlServer.on('connection', function connection(sock) {
      console.log('\x1b[33m   main |\x1b[0m Control attached!');
      controlHandler.setSocket(sock);
      connHandler.setControlSocket(sock);
    });

    connHandler.onClose(() => {
      console.log('\x1b[33m   main |\x1b[0m Connection closed - closing control');
      if (controlHandler.connection.readyState === 1) {
        controlHandler.connection.close();
      }
    });
    controlHandler.onClose(() => {
      console.log('\x1b[33m   main |\x1b[0m Control closed - closing connection');
      if (connHandler.connection.readyState === 1) {
        connHandler.connection.close();
      }
    });
  }
}

class ControlHandler {
  setSocket(sock) {
    if (this.connection) {
      this.connection.close();
    }
    this.connection = sock;
    this.connection.on('message', (message) => this.handleMessage(message));
    this.connection.on('close', (reason, desc) => this.handleClose(reason, desc));
  }

  setClientSocket(sock) {
    this.clientSocket = sock;
  }

  handleMessage(message) {
    console.log('\x1b[32mcontrol |\x1b[0m', message);

    if (message.trim() === 'DROP!') {
      console.log('\x1b[32mcontrol |\x1b[0m Dropping client');
      this.clientSocket.close(1002);
      return;
    }

    if (!this.clientSocket || this.clientSocket.readyState !== 1) {
      if (this.clientSocket) {
        console.log('\x1b[32mcontrol |\x1b[0m Client not attached', this.clientSocket.readyState);
      }
    } else {
      this.clientSocket.send(message);
    }
  }

  handleClose(reason, description) {
    console.log('\x1b[32mcontrol |\x1b[0m Lost control connection', reason, description, this.connection.remoteAddress);
    if (typeof this.closeCallback === 'function') {
      this.closeCallback();
    }
  }

  onClose(callback) {
    this.closeCallback = callback;
  }
}

class ConnectionHandler {
  setSocket(sock) {
    if (this.connection) {
      this.connection.close();
    }
    this.connection = sock;
    this.connection.on('message', (message) => this.handleMessage(message));
    this.connection.on('close', (reason, desc) => this.handleClose(reason, desc));
  }

  setControlSocket(sock) {
    this.controlSocket = sock;
  }

  handleMessage(message) {
    console.log('\x1b[35m client |\x1b[0m Client Message', message);
    if (!this.controlSocket || this.controlSocket.readyState !== 1) {
      if (this.controlSocket) {
        console.error('Control not connected!', this.controlSocket.readyState);
      }
    }
    else {
      this.controlSocket.send(message);
    }
  }

  handleClose(reason, description) {
    console.log('\x1b[35m client |\x1b[0m Client closed', reason, description, this.connection.remoteAddress);
    if (typeof this.closeCallback === 'function') {
      this.closeCallback();
    }
  }

  onClose(callback) {
    this.closeCallback = callback;
  }
}

module.exports = MockWebsocketServer;

if (require.main === module) {
  const s = new MockWebsocketServer();
}
