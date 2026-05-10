import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Loader2, Moon, Sun, Bell, BellOff, Camera } from 'lucide-react';
import { userService } from '../../services/index';
import { useForgeAuth } from '../../context/AuthContext';
import { useForgeTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ProfilePage = () => {
  const { forgeUser, updateUserCache } = useForgeAuth();
  const { activeTheme, setTheme } = useForgeTheme();

  const [myProfileData, setMyProfileData] = useState({
    fullName: '', bio: '', jobTitle: '', timezone: 'UTC',
    preferences: { theme: 'dark', notificationsEnabled: true, emailNotifications: true },
  });
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (forgeUser) {
      setMyProfileData({
        fullName:    forgeUser.fullName || '',
        bio:         forgeUser.bio || '',
        jobTitle:    forgeUser.jobTitle || '',
        timezone:    forgeUser.timezone || 'UTC',
        preferences: forgeUser.preferences || { theme: 'dark', notificationsEnabled: true, emailNotifications: true },
      });
    }
  }, [forgeUser]);

  const onInputModify = (theField) => (evt) => setMyProfileData((prev) => ({ ...prev, [theField]: evt.target.value }));
  const onSettingChange = (theKey, theVal) => setMyProfileData((prev) => ({ ...prev, preferences: { ...prev.preferences, [theKey]: theVal } }));

  const saveMyStuff = async (evt) => {
    evt.preventDefault();
    if (!myProfileData.fullName.trim()) { toast.error('You need a name!'); return; }
    setIsWorking(true);
    try {
      const { data } = await userService.updateProfile(myProfileData);
      updateUserCache(data.data.user);
      setTheme(myProfileData.preferences.theme);
      toast.success('Saved perfectly!');
    } catch { toast.error('Uh oh, saving failed'); }
    finally { setIsWorking(false); }
  };

  const ROLE_NAMES = { admin: 'Administrator', project_manager: 'Project Manager', member: 'Team Member' };

  return (
    <div className="space-y-6 mx-auto max-w-3xl lg:p-8 p-6">
      <div>
        <h1 className="tracking-tight text-white font-extrabold text-2xl">My Profile</h1>
        <p className="mt-1 text-sm text-surface-400">Update your details here</p>
      </div>

      <div className="p-6 forge-card">
        <div className="gap-6 flex items-center">
          <div className="relative">
            <div className="font-bold text-2xl text-white justify-center items-center flex bg-indigo-600 rounded-full h-20 w-20">
              {forgeUser?.initials || '?'}
            </div>
            <button className="transition-colors hover:bg-surface-600 hover:text-white text-surface-400 justify-center items-center flex border-surface-600 border bg-surface-700 rounded-full h-7 w-7 -right-1 -bottom-1 absolute">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-white font-bold text-xl">{forgeUser?.fullName}</p>
            <p className="text-sm text-surface-400">{forgeUser?.email}</p>
            <span className="border-indigo-500/30 border text-indigo-400 bg-indigo-500/15 text-xs forge-badge items-center inline-flex mt-2">
              {ROLE_NAMES[forgeUser?.role] || forgeUser?.role}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={saveMyStuff} className="space-y-5">
        <div className="space-y-4 p-6 forge-card">
          <h2 className="pb-3 border-surface-800 border-b text-surface-200 font-semibold text-sm">About Me</h2>
          <div className="gap-4 sm:grid-cols-2 grid-cols-1 grid">
            <div>
              <label className="forge-label">Name</label>
              <input type="text" value={myProfileData.fullName} onChange={onInputModify('fullName')} className="forge-input" />
            </div>
            <div>
              <label className="forge-label">Job Title</label>
              <input type="text" value={myProfileData.jobTitle} onChange={onInputModify('jobTitle')} placeholder="Developer" className="forge-input" />
            </div>
          </div>
          <div>
            <label className="forge-label">Bio</label>
            <textarea value={myProfileData.bio} onChange={onInputModify('bio')} rows={3} maxLength={300}
              placeholder="A little bit about yourself..." className="resize-none forge-input" />
            <p className="mt-1 text-surface-600 text-xs">{myProfileData.bio.length}/300</p>
          </div>
          <div>
            <label className="forge-label">Timezone</label>
            <select value={myProfileData.timezone} onChange={onInputModify('timezone')} className="forge-input">
              {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'].map((tzItem) => (
                <option key={tzItem} value={tzItem}>{tzItem}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 p-6 forge-card">
          <h2 className="pb-3 border-surface-800 border-b text-surface-200 font-semibold text-sm">App Settings</h2>

          <div className="justify-between flex items-center">
            <div>
              <p className="text-surface-200 font-medium text-sm">Colors</p>
              <p className="text-surface-500 text-xs">Light or Dark mode</p>
            </div>
            <div className="p-1 rounded-lg bg-surface-800 gap-2 flex items-center">
              {['dark', 'light'].map((tName) => (
                <button key={tName} type="button" onClick={() => onSettingChange('theme', tName)}
                  className={clsx('transition-all font-medium text-xs rounded py-1.5 px-3 gap-1.5 flex items-center',
                    myProfileData.preferences.theme === tName ? 'text-white bg-surface-600' : 'hover:text-surface-200 text-surface-400'
                  )}>
                  {tName === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  {tName.charAt(0).toUpperCase() + tName.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {[
            { key: 'notificationsEnabled', label: 'App Alerts', desc: 'Get updates while in the app' },
            { key: 'emailNotifications',   label: 'Email Alerts',   desc: 'Get updates to your inbox' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="justify-between flex items-center">
              <div>
                <p className="text-surface-200 font-medium text-sm">{label}</p>
                <p className="text-surface-500 text-xs">{desc}</p>
              </div>
              <button type="button" onClick={() => onSettingChange(key, !myProfileData.preferences[key])}
                className={clsx('flex-shrink-0 relative duration-200 transition-all border rounded-full h-6 w-11',
                  myProfileData.preferences[key] ? 'border-indigo-500 bg-indigo-600' : 'border-surface-700 bg-surface-800'
                )}>
                <div className={clsx('duration-200 transition-all absolute top-0.5 shadow-sm bg-white rounded-full h-4 w-4',
                  myProfileData.preferences[key] ? 'left-[calc(100%-20px)]' : 'left-0.5'
                )} />
              </button>
            </div>
          ))}
        </div>

        <div className="justify-end flex">
          <button type="submit" disabled={isWorking} className="forge-btn-primary">
            {isWorking ? <><Loader2 className="animate-spin h-4 w-4" />Saving...</> : <><Save className="h-4 w-4" />Save</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
