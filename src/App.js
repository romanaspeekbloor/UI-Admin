import React, { PureComponent } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const url = 'http://192.168.10.242:3010/v1/admin';

class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      clients: [],
      columns: [],
      samples: [],
    }
    this.handleActivate = this.handleActivate.bind(this);
    this.clientDisconnected = this.clientDisconnected.bind(this);
    this.clientConnected = this.clientConnected.bind(this);
  }

  clientDisconnected(data) {
    console.log('disconnected!', { data }); 
    this.setState({ clients: data });
  }

  clientConnected(data) {
    console.log('connected!', { data });
    this.setState({ clients: data });
  }

  handleActivate(client) {
    console.log('posting: ', client);
      
    axios({
      method: 'POST',
      url: `${url}/activate`,
      data: client,
      headers: { 
        'Content-Type': 'application/json'
      },
    }).then(res => {
      if(res.status === 200) this.setState({ clients: res.data });
    });
  }

  componentDidMount() {
    const socket = io('http://192.168.10.242:9955');
    socket.on('clientDisconnected', this.clientDisconnected); 
    socket.on('clientConnected', this.clientConnected); 
    socket.on('newSamplesAdded', (samples) => {
      console.log('samples received: ', samples);
      this.setState({
        samples: [
          ...samples,
          ...this.state.samples.slice(0, 40),
        ]
      });
      // this.setState({ samples });
    });
    socket.on('connect', () => {
      console.log('connected');
      socket.emit('onUIConnect', 'MY MESSAGE');
    });
    axios.get(`${url}/clients`).then(res =>{
      const clients = res.data;
      console.log(clients)
      if (clients.length) {
        this.setState({
          clients,
          columns: [...Object.keys(clients[0]).map(name => name.match(/[^_]+$/g)[0]), 'activate'],
        });
      }
    });
  };

  render() {
    const { columns, clients, samples } = this.state;

    const renderSamplesTables = () => {
      if (samples.length > 0) {
        return (
          <table border={1}>
            <thead> 
              <tr>
                {Object.keys(samples[0]).map(col => <th>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {samples.map(s => {
                return (
                  <tr>
                    {Object.values(s).map(d => <td>{d !== null ? d.toString() : 'null' }</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      }
      return (
        <div>no new samples</div>
      );
    }

    if (columns.length && clients.length) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
            <button>refresh</button>
          </div>
          <table border={1}>
            <thead> 
              <tr>
                {columns.map(col => <th>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {this.state.clients.map(c => {
                return (
                  <tr>
                    {Object.values(c).map(d => <td>{d !== null ? d.toString() : 'null' }</td>)}
                    <td>
                      <button onClick={() => this.handleActivate(c)}>on/off</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <h1>samples feed</h1>
          {renderSamplesTables()}
        </div>
      );
    }

    return <div>yo</div>
  }
}

export default App;

