import IConfig from "./models/iConfig";

export const config: IConfig = {
  fetchInterval: {
    posts: 1000 * 15,
    comments: 1000 * 20,
    reports: 1000 * 60,
    mentions: 1000 * 15,
  },
  communityConfig: [
    {
      communities: ["hdev"],
      config: {
        discordTeam: ["710213572898193428"],
        logs: {
          discord: {
            enabled: true,
            logChannel: "1117095595597901914",
            logGuild: "932286006156222495",
            comments: { enabled: true },
            posts: { enabled: true },
            reports: { enabled: true },
          },
        },
      },
    },
  ],
  logs: {
    discord: {
      logChannel: "1117095595597901914",
      logGuild: "932286006156222495",
      enabled: true,
      comments: { enabled: true },
      posts: { enabled: true },
      reports: { enabled: true },
    },
  },
};

export const activeCommunities = config.communityConfig
  .map((c) => c.communities)
  .flat();

export default config;
