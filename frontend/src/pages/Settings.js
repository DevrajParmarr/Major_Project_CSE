import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { currentUser, updateUserPreferences } = useAuth();
  const [theme, setTheme] = useState('light');
  const [algorithm, setAlgorithm] = useState('clarke-wright');
  const [preferRoad, setPreferRoad] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.preferences) {
      setTheme(currentUser.preferences.theme || 'light');
      setAlgorithm(currentUser.preferences.defaultAlgorithm || 'clarke-wright');
      setPreferRoad(!!currentUser.preferences.preferRoadNetwork);
    }
  }, [currentUser]);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateUserPreferences({ theme, defaultAlgorithm: algorithm, preferRoadNetwork: preferRoad });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Settings</h1>
      <div className="form-group">
        <label>Theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="form-group">
        <label>Default Algorithm</label>
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
          <option value="clarke-wright">Clarke-Wright (Savings)</option>
          <option value="nearest-neighbor">Nearest Neighbor</option>
        </select>
      </div>
      <div className="form-group checkbox-group">
        <input type="checkbox" id="preferRoad" checked={preferRoad} onChange={() => setPreferRoad(!preferRoad)} />
        <label htmlFor="preferRoad">Prefer road network (when available)</label>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</button>
      </div>
    </div>
  );
};

export default Settings;