import { useEffect, useState } from 'react';
import { api } from '../api/client';

function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.health(), api.systemStatus()])
      .then(([health, system]) => {
        if (active) setStatus({ health, system });
      })
      .catch(() => {
        if (active) setOffline(true);
      });
    return () => { active = false; };
  }, []);

  const online = Boolean(status) && !offline;
  return (
    <div className="system-status" aria-live="polite">
      <span className={`status-dot ${online ? 'online' : 'offline'}`} />
      <span>{online ? 'API online · model ready' : 'API offline'}</span>
      {online && (
        <span className="status-mode">
          Sentinel {status.system.sentinel.configured_dry_run ? 'dry-run' : 'live'}
        </span>
      )}
    </div>
  );
}

export default SystemStatus;
