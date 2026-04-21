import type { HttpClient } from "../http.js";
import { paginate, type PageResult } from "../pagination.js";
import type { TrackingFolder, TrackingPlan, PlanTimeline, PlanProgress } from "../schemas/tracking.js";
import type { SearchFilter } from "./base.js";

export class TrackingResource {
  constructor(private readonly http: HttpClient) {}

  async folders(): Promise<TrackingFolder[]> {
    return this.http.get("Tracking/Folders");
  }

  planList(options?: { filters?: SearchFilter[]; folderId?: string; pageSize?: number }): AsyncGenerator<TrackingPlan> {
    const { filters = [], folderId, pageSize = 30 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<TrackingPlan>>("Tracking/Plans", { filters }, {
        folderId, pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async planGet(planId: string): Promise<TrackingPlan> {
    return this.http.post(`Tracking/Plan/${planId}`, {});
  }

  // ── Style tracking ──

  async styleProgress(planId: string): Promise<PlanProgress> {
    return this.http.get(`Tracking/Plan/${planId}/Style/Progress`);
  }

  styleTimelineList(planId: string, options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<PlanTimeline> {
    const { filters = [], pageSize = 20 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<PlanTimeline>>(`Tracking/Plan/${planId}/Style/Timeline`, { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  styleTrackingView(planId: string, viewId: string, options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<PlanTimeline> {
    const { filters = [], pageSize = 20 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<PlanTimeline>>(`Tracking/Plan/${planId}/Style/View/${viewId}`, { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async styleTimelineUpdate(planId: string, timelines: unknown[]): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/Style/Timelines/Edit`, timelines);
  }

  async styleTimelinesDelete(planId: string, timelineIds: string[]): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/Style/Timelines/Delete`, { timelineIds });
  }

  /** Archive timelines — body is a flat array of timeline IDs (NOT wrapped in {timelineIds}) */
  async styleTimelinesArchive(planId: string, timelineIds: string[]): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/Style/Timelines/Archive`, timelineIds);
  }

  async styleAdd(planId: string, styleIds: string[]): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/Style/Add`, styleIds);
  }

  async styleByColorwayAdd(planId: string, body: unknown): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/StyleByColorway/Add`, body);
  }

  /**
   * Add style by SKU to plan. Body is an array of { headerId, sku: [{ colorwayId, sizes }] }.
   * Returns array of created timelines with { id, headerId, headerFolderId }.
   */
  async styleBySkuAdd(planId: string, body: unknown): Promise<{ id: string; headerId: string; headerFolderId: string }[]> {
    return this.http.post(`Tracking/Plan/${planId}/StyleBySKU/Add`, body);
  }

  styleRevisions(planId: string, options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<unknown> {
    const { filters = [], pageSize = 20 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<unknown>>(`Tracking/Plan/${planId}/Style/Revisions`, { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  // ── Material tracking ──

  async materialProgress(planId: string): Promise<PlanProgress> {
    return this.http.get(`Tracking/Plan/${planId}/Material/Progress`);
  }

  materialTimelineList(planId: string, options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<PlanTimeline> {
    const { filters = [], pageSize = 20 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<PlanTimeline>>(`Tracking/Plan/${planId}/Material/Timeline`, { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  materialTrackingView(planId: string, viewId: string, options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<PlanTimeline> {
    const { filters = [], pageSize = 20 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<PlanTimeline>>(`Tracking/Plan/${planId}/Material/View/${viewId}`, { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }

  async materialTimelineUpdate(planId: string, timelines: unknown[]): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/Material/Timelines/Edit`, timelines);
  }

  async materialTimelinesDelete(planId: string, timelineIds: string[]): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/Material/Timelines/Delete`, { timelineIds });
  }

  async materialAdd(planId: string, materialIds: string[]): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/Material/Add`, materialIds);
  }

  async materialByColorwayAdd(planId: string, body: unknown): Promise<unknown> {
    return this.http.post(`Tracking/Plan/${planId}/MaterialByColorway/Add`, body);
  }

  materialRevisions(planId: string, options?: { filters?: SearchFilter[]; pageSize?: number }): AsyncGenerator<unknown> {
    const { filters = [], pageSize = 20 } = options ?? {};
    return paginate(pageSize, (pSize, pNum) =>
      this.http.post<PageResult<unknown>>(`Tracking/Plan/${planId}/Material/Revisions`, { filters }, {
        pageSize: pSize, pageNumber: pNum,
      }),
    );
  }
}
