# Inbox

`bp.inbox` covers the inbox — task threads with messages, attachments,
and per-master-folder visibility. Useful for in-app notifications,
review-loop coordination, etc.

## Tasks

```ts
// Search across a master folder ("STYLE", "MATERIAL", "COLOR", "IMAGE")
for await (const task of bp.inbox.search("STYLE", { pageSize: 20, body: { /* filters */ } })) {
  console.log(task);
}

const t = await bp.inbox.get(taskId);
const created = await bp.inbox.create(body);
await bp.inbox.update(taskId, body);
await bp.inbox.deleteTask(taskId);
```

The `body` shape varies by tenant configuration. Inspect a known-good
task via `get` to see the field set, then mirror it on `create` /
`update`.

## Messages

Each task carries a thread of messages:

```ts
for await (const m of bp.inbox.messages(taskId, { pageSize: 50 })) {
  console.log(m);
}

await bp.inbox.messageCreate(taskId, body);
await bp.inbox.messageUpdate(messageId, body);
await bp.inbox.messageDelete(messageId);
```

## Message attachments

```ts
import { type FileInput } from "beproduct";

await bp.inbox.messageAttachmentsUpload(messageId, {
  filepath: "/spec.pdf",
  filename: "spec.pdf",
});
```

See [../file-uploads.md](../file-uploads.md) for `FileInput` and the
processing-status pattern.

## Common pattern: review-loop

1. Designer creates a task on a style: `inbox.create({ headerId, ... })`
2. Reviewer receives the task in their inbox; reads via `inbox.get(taskId)`
3. Reviewer adds comments via `inbox.messageCreate`
4. Designer updates the spec, marks the task resolved via
   `inbox.update(taskId, { status: "Closed" })`

The exact field names depend on the tenant's task config — read the
existing task body first.
