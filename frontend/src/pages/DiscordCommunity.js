import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/mainlayout/MainLayout';

import DiscordHeroBanner from '../components/discordcommunity/DiscordHeroBanner';
import DiscordMessagePreview from '../components/discordcommunity/DiscordMessagePreview';
import DiscordFeatureGrid from '../components/discordcommunity/DiscordFeatureGrid';
import JoinStepsGuide from '../components/discordcommunity/JoinStepsGuide';
import ChannelDirectory from '../components/discordcommunity/ChannelDirectory';

import styles from '../components/discordcommunity/DiscordCommunityStyles';

const API_URL = 'http://localhost:8080/api';
const DEFAULT_DISCORD_INVITE = 'https://discord.gg/xBCgxjAPgT';

const DiscordCommunity = () => {
  const [inviteUrl, setInviteUrl] = useState(DEFAULT_DISCORD_INVITE);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios
      .get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data))
      .catch(() => {});

    axios
      .get(`${API_URL}/community/discord`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data?.invite_url) {
          setInviteUrl(res.data.invite_url);
        }
      })
      .catch(() => {
      });
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <MainLayout title="Discord Community" username={user?.username || 'User'} userRole={user?.role || 'user'}>
      <div style={styles.container}>
        <DiscordHeroBanner inviteUrl={inviteUrl} copied={copied} onCopyLink={handleCopyLink} />

        <DiscordMessagePreview />

        <DiscordFeatureGrid />

        <div style={styles.infoSplitGrid}>
          <JoinStepsGuide />
          <ChannelDirectory />
        </div>
      </div>
    </MainLayout>
  );
};

export default DiscordCommunity;