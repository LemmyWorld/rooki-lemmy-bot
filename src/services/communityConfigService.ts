import {
  Community,
} from "lemmy-js-client";
import { Inject, Service } from "typedi";
import "reflect-metadata";
import communityConfigRepository from "../repository/communityConfigRepository";
import { CommunityFilterConfig, LogOptions } from "../models/iConfig";
import CommunityService from "./guildService";
import communityConfigModel from "../models/communityConfigModel";

@Service()
class communityConfigService {
  @Inject()
  repository: communityConfigRepository;

  @Inject()
  CommunityService: CommunityService;

  async getCommunities() {
    return await this.repository.findAll();
  }

  async createCommunityConfig(community: Community) {
    const createdConfig = this.repository.create();
    createdConfig.community = community;
    return await this.repository.save(createdConfig);
  }
  async removeCommunityConfig(config: communityConfigModel) {
    return await this.repository.delete(config);
  }

  async updateLogOptions(
    community: Community,
    logOptions: Partial<LogOptions>
  ) {
    const config = await this.getCommunityConfig(community);
    if (!config) throw new Error("Community config not found!");
    config.logConfig = { ...config.logConfig, ...logOptions };
    return await this.repository.save(config);
  }

  async updateFilterOptions(
    community: Community,
    filterOption: CommunityFilterConfig[]
  ) {
    const config = await this.getCommunityConfig(community);
    if (!config) throw new Error("Community config not found!");
    config.filterConfig = [ ...config.filterConfig, ...filterOption ];
    return await this.repository.save(config);
  }

  async getCommunityConfig(community: Community) {
    return await this.repository.findOne({
      where: { "community.id": { $eq: community.id } },
    });
  }
}

export default communityConfigService;
