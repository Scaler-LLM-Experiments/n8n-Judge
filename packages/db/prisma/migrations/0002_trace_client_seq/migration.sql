-- Client-assigned sequence for events the CLIENT reports, so a re-sent batch
-- after a dropped connection is idempotent.
--
-- `seq` stays SERVER-assigned. The check endpoint records its own decisions (the
-- recording is what stops it being a free answer oracle), and the client must
-- not choose the ordering of something it is graded on — so with both sides
-- numbering rows a client counter would collide with server inserts on
-- TraceEvent_sessionId_seq_key.
--
-- Nullable on purpose: Postgres treats NULLs as distinct in a unique index, so
-- every server-written row can leave this null without contending.
ALTER TABLE "TraceEvent" ADD COLUMN     "clientSeq" INTEGER;

CREATE UNIQUE INDEX "TraceEvent_sessionId_clientSeq_key" ON "TraceEvent"("sessionId", "clientSeq");
