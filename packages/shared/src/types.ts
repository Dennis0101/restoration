export type SnapshotPayload = {
  roles: Array<{ name: string; permissions: string; color: number; position: number }>;
  channels: Array<{
    name: string; type: number; parent?: string|null; topic?: string|null;
    overwrites: Array<{ target: string; type: number; allow: string; deny: string }>
  }>;
  takenAt: string;
};
