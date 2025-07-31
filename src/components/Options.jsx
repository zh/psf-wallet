import { useAtom } from 'jotai';
import { syncServerAtom, serverListAtom, walletAtom, walletConnectedAtom } from '../atoms';

const Options = () => {
  const [selectedServer, setSelectedServer] = useAtom(syncServerAtom);
  const [serverList] = useAtom(serverListAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [, setWallet] = useAtom(walletAtom);

  const handleServerChange = (serverId) => {
    const server = serverList.find(s => s.id === serverId);
    if (server) {
      setSelectedServer(server);
      setWallet(null);
    }
  };

  return (
    <div className="container options-container">
      <fieldset className="form-group">
        <legend>[ Connection ]</legend>
        <select
          id="server-select"
          value={selectedServer.id}
          onChange={(e) => handleServerChange(e.target.value)}
          className="options-select"
          disabled={walletConnected}
        >
          <option value="" disabled>
            -- Select a server --
          </option>
          {serverList.map((server) => (
            <option key={server.id} value={server.id}>
              {server.name} {server.requiresAuth ? '(Auth Required)' : ''}
            </option>
          ))}
        </select>
      </fieldset>
    </div>
  );
};

export default Options;

