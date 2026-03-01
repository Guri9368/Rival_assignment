// Payload passed to the job when a blog is published
export interface SummaryJobPayload {
  readonly blogId: string;
  readonly title: string;
  readonly content: string;
}
