import { Community } from "lemmy-js-client";
import { Column, Entity } from "typeorm";
import baseModel from "./baseModel";
import { CommunityFilterConfig, CommunityLogConfig } from "./iConfig";

@Entity({ name: "rooki_community_config" })
export default class communityConfigModel extends baseModel {
  @Column()
  community!: Community;
  @Column()
  logConfig: CommunityLogConfig = {
    enabled: false,
    discord: {
      logChannel: "",
      logGuild: "",
      posts: { enabled: false },
      comments: { enabled: false },
      reports: { enabled: false },
      profanity: { enabled: false },
    },
  };

  @Column({array: true})
  filterConfig: CommunityFilterConfig[] = []
}
