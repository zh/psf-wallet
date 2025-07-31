import { useAtom } from 'jotai';
import { busyAtom, optionsAtom, walletConnectedAtom } from '../atoms';

const servers = [
  'https://free-bch.fullstack.cash',
  'https://bch-consumer-anacortes-wa-usa.fullstackcash.nl',
];

const ServerSelector = () => {
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [busy] = useAtom(busyAtom);
  const [options, setOptions] = useAtom(optionsAtom);

  const handleSelect = async (serverUrl) => {
    if (options.restURL !== serverUrl) {
      setOptions((prevOptions) => ({
        ...prevOptions,
        restURL: serverUrl,
      }));
    }
  };

  return (
    <div className="container serverselector-container">
      <fieldset className="form-group">
        <legend>[ Select Server ]</legend>
      <ul className="server-list">
        {servers.map((server, index) => (
          <li key={index} className="server-item">
            <span className="server-url">{server}</span>
            <button
              disabled={busy || walletConnected}
              className={`select-button ${
                options.restURL === server ? 'selected' : ''
              }`}
              onClick={() => handleSelect(server)}
            >
              {options.restURL === server ? 'Selected' : 'Select'}
            </button>
          </li>
        ))}
      </ul>
      </fieldset>
    </div>
  );
};

export default ServerSelector;

