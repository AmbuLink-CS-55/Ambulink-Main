CREATE TABLE "dispatcher_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL,
  "created_by_user_id" uuid NOT NULL,
  "invited_email" varchar(255),
  "token_hash" varchar(128) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dispatcher_invites" ADD CONSTRAINT "dispatcher_invites_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "dispatcher_invites" ADD CONSTRAINT "dispatcher_invites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "dispatcher_invites_token_hash_unique" ON "dispatcher_invites" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "dispatcher_invites_provider_idx" ON "dispatcher_invites" USING btree ("provider_id");
--> statement-breakpoint
CREATE INDEX "dispatcher_invites_invited_email_idx" ON "dispatcher_invites" USING btree ("invited_email");
--> statement-breakpoint
CREATE INDEX "dispatcher_invites_expires_at_idx" ON "dispatcher_invites" USING btree ("expires_at");
