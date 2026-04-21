import { OAuth2TokenManager } from "./auth.js";
import { HttpClient } from "./http.js";
import { StyleResource } from "./resources/style.js";
import { MaterialResource } from "./resources/material.js";
import { ColorResource } from "./resources/color.js";
import { BlockResource } from "./resources/block.js";
import { ImageResource } from "./resources/image.js";
import { TrackingResource } from "./resources/tracking.js";
import { DirectoryResource } from "./resources/directory.js";
import { UserResource } from "./resources/users.js";
import { DataTableResource } from "./resources/data-tables.js";
import { MasterDataResource } from "./resources/master-data.js";

export interface BeProductConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  companyDomain: string;
  tokenEndpoint?: string;
  publicApiUrl?: string;
  accessToken?: string;
  additionalHeaders?: Record<string, string>;
}

export class BeProduct {
  readonly raw: HttpClient;
  readonly style: StyleResource;
  readonly material: MaterialResource;
  readonly color: ColorResource;
  readonly block: BlockResource;
  readonly image: ImageResource;
  readonly tracking: TrackingResource;
  readonly directory: DirectoryResource;
  readonly user: UserResource;
  readonly dataTables: DataTableResource;
  readonly masterData: MasterDataResource;

  constructor(config: BeProductConfig) {
    if (!config.companyDomain) {
      throw new Error("companyDomain is required");
    }

    if (!config.accessToken && !(config.clientId && config.clientSecret && config.refreshToken)) {
      throw new Error("accessToken or clientId + clientSecret + refreshToken are required");
    }

    const tokenEndpoint = config.tokenEndpoint ?? "https://id.winks.io/ids/connect/token";
    const publicApiUrl = (config.publicApiUrl ?? "https://developers.beproduct.com").replace(/\/+$/, "");
    const baseUrl = `${publicApiUrl}/api/${config.companyDomain}`;

    const tokenManager = new OAuth2TokenManager({
      tokenEndpoint,
      clientId: config.clientId ?? "",
      clientSecret: config.clientSecret ?? "",
    });

    if (config.accessToken) {
      tokenManager.setAccessToken(config.accessToken);
    }
    if (config.refreshToken) {
      tokenManager.setRefreshToken(config.refreshToken);
    }

    this.raw = new HttpClient(baseUrl, tokenManager, config.additionalHeaders);

    this.style = new StyleResource(this.raw);
    this.material = new MaterialResource(this.raw);
    this.color = new ColorResource(this.raw);
    this.block = new BlockResource(this.raw);
    this.image = new ImageResource(this.raw);
    this.tracking = new TrackingResource(this.raw);
    this.directory = new DirectoryResource(this.raw);
    this.user = new UserResource(this.raw);
    this.dataTables = new DataTableResource(this.raw);
    this.masterData = new MasterDataResource(this.raw);
  }
}
