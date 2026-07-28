-- Emails that get ADMIN whether or not they have signed up yet.
--
-- Promoting an existing user is not enough on its own: the people you want as
-- admins usually have not created an account at the moment you decide it, and
-- "ask them to sign up, then tell me" is a step everyone forgets. An email listed
-- here is promoted on signup, and promoted immediately if the account exists.

-- CreateTable
CREATE TABLE "AdminAllowlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAllowlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminAllowlist_email_key" ON "AdminAllowlist"("email");

