type ProbeConfig =
  | { type: 'tcp'; port: number }
  | { type: 'ping' };

interface NodeConfig {
  id: string;
  name: string;
  ip: string;
  probe: ProbeConfig;
}

const nodes: NodeConfig[] = [
  {
    id: 'MacBookPro',
    name: 'MacBookPro',
    ip: '10.242.46.156',
    probe: { type: 'tcp', port: 22 },
  },
  {
    id: 'Ace3vTierFix',
    name: 'Ace3vTierFix',
    ip: '10.242.208.39',
    probe: { type: 'ping' },
  },
  {
    id: 'KaiX570',
    name: 'KaiX570',
    ip: '10.242.78.83',
    probe: { type: 'tcp', port: 22 },
  },
  {
    id: 'Surface',
    name: 'Surface',
    ip: '10.242.18.33',
    probe: { type: 'tcp', port: 22 },
  },
  {
    id: 'MacBookAir',
    name: 'MacBookAir',
    ip: '10.242.21.36',
    probe: { type: 'tcp', port: 22 },
  },
  {
    id: 'Kai_Danzhou',
    name: 'Kai_Danzhou',
    ip: '10.242.122.214',
    probe: { type: 'tcp', port: 22 },
  },
  {
    id: '14Pro',
    name: '14Pro',
    ip: '10.242.162.233',
    probe: { type: 'ping' },
  },
  {
    id: 'iPad_Mini4',
    name: 'iPad_Mini4',
    ip: '10.242.115.176',
    probe: { type: 'ping' },
  },
];

export default nodes;
